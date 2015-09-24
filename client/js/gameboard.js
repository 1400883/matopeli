function Gameboard(game, width, height) {
  var _this = this;
  this.game = game;
  this.width = width;
  this.height = height;
  this.startButtonText = { off: "Aloita peli", on: "Pysäytä", paused: "Jatka" };
  this.getNextPos = {
    l: function(nextPos) { return _this.GetLeft(nextPos); }, 
    r: function(nextPos) { return _this.GetRight(nextPos); }, 
    u: function(nextPos) { return _this.GetUp(nextPos); }, 
    d: function(nextPos) { return _this.GetDown(nextPos); },
  };
};

///////////////////////////////////////////////////////////
// PELILAUDAN ALUSTUSFUNKTIO //////////////////////////////
///////////////////////////////////////////////////////////
Gameboard.prototype.Init = function(boardElement, sizeOptions, speedOptions) {
  var _this = this;
  this.idList = [];
  var gameboard = "<div id=\"score-container\">Pisteet:<div id=\"score-display\"></div></div>" +
    "<table id=\"gametable\">";
  for (var iRow = 0; iRow < this.height; ++iRow) {
    gameboard += "<tr>";
    for (var iCell = 0; iCell < this.width; ++iCell) {
      gameboard +=  "<td id=\"" + (iRow * this.width + iCell) + "\"></td>";
      this.idList.push(iRow * this.width + iCell);
    }
    gameboard += "</tr>";
  }
  gameboard += "</table>";

  gameboard += "<div id=\"game-controls\">" + 
      "<input type=\"button\" id=\"start-game\" value=\"" + this.startButtonText.off + "\">" + 
      "<div class=\"dropdown\">Pelilaudan koko:<select id=\"boardsize\">";
  for (key in sizeOptions) {
    gameboard += "<option value=\"" + key + "\"" + 
      (key == "average" ? "selected=\"selected\"" : "") + ">" + sizeOptions[key] + "</option>";
  }
  gameboard += "</select></div><div class=\"dropdown\">Madon nopeus:<select id=\"worm-speed\">";
  for (key in speedOptions) {
    gameboard += "<option value=\"" + key + "\"" + (key == "medium" ? "selected=\"selected\"" : "") + ">" + speedOptions[key] + "</option>";
  }
  gameboard += "</select></div></div>";

  if (DEBUGMODE)
    gameboard += "<span id=\"logger\"></span>";

  // Lisää pelilauta dokumentin pelilauta-div-kontaineriin
  boardElement.innerHTML = gameboard;

  // Alusta pistenäyttö
  this.gametable = document.getElementById("gametable");
  this.scoreDisplay = document.getElementById("score-display");
  this.scoreDisplay.textContent = this.score;
  
  // Pelin aloituspainike ja painikkeen kuuntelu
  this.startButton = document.getElementById("start-game");
  this.startButton.addEventListener("click", function() {
    _this.OnStartButtonClick();
  });

  // Kehitystyötä varten:
  // - Tulostetaan hiiren kursorin alla olevan solun id-tunnus
  //   pelikentän viereen. Alkuperäisessä videossa solujen 
  //   title-ominaisuuteen oli tallennettu sama id, joka kyllä 
  //   ilmestyy selaimissa näkyviin hiiren kursorin viipyessä 
  //   solun päällä hetken aikaa, mutta ilmestyminen kestää turhan
  //   kauan. Tehdään oma id-näyttö, joka reagoi heti hiiren
  //   sijaintiin.
  if (DEBUGMODE) {
    // Yläreunan sisäänkirjauselementti
    this.logger = document.getElementById("logger");
    // Aktivoidaan pelilaudalle hiiren kursorin rekisteröinti
    for (var i = 0; i < this.width * this.height; ++i) {
      var td = document.getElementById(i);
      td.addEventListener("mouseover", function(event) { _this.OnMouseOver(event); });
      td.addEventListener("mouseleave", function(event) { _this.OnMouseLeave(event); });
    }
  }
};

///////////////////////////////////////////////////////////
// PELILAUDAN TYHJENNUSFUNKTIO ////////////////////////////
///////////////////////////////////////////////////////////
Gameboard.prototype.Reset = function() {
  for (var i = 0; i < this.idList.length; ++i) {
    document.getElementById(i).style.backgroundColor = "";
  }
  this.game.score = 0;
  this.scoreDisplay.textContent = this.game.score;
};

///////////////////////////////////////////////////////////
// PELIN ALOITUSPAINIKKEEN CALLBACK ///////////////////////
///////////////////////////////////////////////////////////
Gameboard.prototype.OnStartButtonClick = function() {
  if (!this.game.isRunning) {
    // Pelia ei ole vielä käynnistetty tai edellinen peli on päättynyt
    // Nollaa pelilauta
    this.Reset();
    // Piirrä mato aloitussijaintiin
    this.game.worm.Init();
    this.game.worm.Draw();

    // Piirrä ensimmäinen ruoka
    this.game.food.Draw();

    // Käynnistä peli
    this.game.isRunning = true;
    this.game.StartInterval();
  }
  else {
    // Peli on käynnistetty
    if (this.game.isPaused)
      // Peli on pausella -> jatka peliä
      this.game.StartInterval();
    else
      // Peli on käynnissä -> pauseta
      this.game.StopInterval();
    // Vaihda pause-muuttujan arvo
    this.game.isPaused = !this.game.isPaused;
  }

  // Päivitä pelinkäynnistyspainikkeen teksti
  this.startButton.value = this.game.isPaused 
    ? this.startButtonText.paused
    : this.startButtonText.on;
};

Gameboard.prototype.GetMiddlePoint = function() {
  // Palauta pelilaudan keskipisteen solu-id
  return this.width * ((this.height - 1) - 
    Math.floor(this.height / 2)) + Math.round(this.width / 2 - 1);
};

///////////////////////////////////////////////////////////
// PELILAUDAN SEURAAVAN RUUDUN ID:N PALAUTTAVAT FUNKTIOT //
///////////////////////////////////////////////////////////
// Madon piirtämisessä käytetään näitä funktioita.
// Funktioiden nimet ovat niiden sisäistä logiikkaa vasten 
// sikäli harhaanjohtavia, että nimessä oleva suunta viittaa
// madon kulkusuuntaan, kun taas funktio palauttaa id:n
// päinvastaisesta suunnasta (=madon tulosuunnasta).
// Madon vartalon sijainnit pelilaudalla saadaan kutsumalla 
// funktiota madon pään sijainnista alkaen madon pituutta 
// vastaava määrä kertoja. Paluuarvo on siis esim. 
// vasemmalle kulkevan madon päästä seuraavan osan sijainti 
// (eli madon pään oikealla puolella oleva id) GetLeft()-
// funktiolla, kun currentPos-parametri on madon pään 
// sijainti-id.
Gameboard.prototype.GetLeft = function(currentPos) {
  return currentPos % this.width // Onko mato parhaillaan vasemmasta laidasta irti?
    ? currentPos - 1 // Kyllä -> voi siirtää vasemmalle
    : this.width + currentPos - 1; // Ei, laitetaan ilmestymään sisään oikeasta laidasta
};

Gameboard.prototype.GetRight = function(currentPos) {
  return (currentPos + 1) % this.width // Onko mato parhaillaan oikeasta laidasta irti?
    ? currentPos + 1 // Kyllä, voi siirtää oikealle
    : currentPos - this.width + 1; // Ei, laitetaan ilmestymään sisään vasemmasta laidasta
};

Gameboard.prototype.GetUp = function(currentPos) {
  return currentPos >= this.width // Onko -- ylälaidasta irti?
    ? currentPos - this.width // Kyllä -> siirto ylös
    : currentPos + this.width * (this.height - 1); // Ei -> ilmestyy sisään alhaalta
};

Gameboard.prototype.GetDown = function(currentPos) {
  return currentPos < this.width * (this.height - 1) // Onko -- alalaidasta irti?
    ? currentPos + this.width // Kyllä -> siirto alas
    : currentPos + this.width * (1 - this.height); // Ei -> ilmestyy sisään ylhäältä
};

///////////////////////////////////////////////////////////
// DEBUGGAUS CALLBACK-FUNKTIOT ////////////////////////////
///////////////////////////////////////////////////////////
Gameboard.prototype.OnMouseOver = function(event) {
  if (event.target.tagName == "TD") {
    // Hae hiiren alla oleva taulun solun id
    var id = document.getElementById(event.target.id);
    // Laita id lokielementtiin
    this.logger.textContent = event.target.id;
    // Tallenna nykyinen solun taustaväri
    this.idStyle = id.style.backgroundColor;
    // Vaihda taustaväri "valitun" solun havainnollistamiseksi
    id.style.backgroundColor = "red";
  }
};

Gameboard.prototype.OnMouseLeave = function(event) {
  // Poista id lokielementistä
  this.logger.textContent = "";
  // Palauta alkuperäinen taustaväri soluun.
  document.getElementById(event.target.id).style.backgroundColor = this.idStyle;
};