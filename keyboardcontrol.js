function KeyboardControl(game) {
  this.game = game;
  this.keyCode = { left: 37, up: 38, right: 39, down: 40 };
  this.bufferedKeyCode = 0;
}

///////////////////////////////////////////////////////////
// NÄPPÄIN-MANAGERIN ALUSTUSFUNKTIO ///////////////////////
///////////////////////////////////////////////////////////
KeyboardControl.prototype.Init = function() {
  var _this = this;
  // Kuuntele näppäinpainalluksia pelilaudan ollessa fokusoituna
  this.game.board.addEventListener("keydown", function(event) {
    _this.OnKeyDown(event);
  });
}

///////////////////////////////////////////////////////////
// NÄPPÄINPUSKURIN KÄSITTELYFUNKTIO ///////////////////////
///////////////////////////////////////////////////////////
KeyboardControl.prototype.ProcessBuffer = function() {
  var _this = this;
  if (this.bufferedKeyCode) {
    // Näppäinpuskurissa on painallus, puretaan se muuttamalla
    // madon suunta manuaalisesti puskurissa olevaa näppäintä
    // vastaavaksi ja jäädään odottamaan seuraavaa ajastettua
    // sijaintipäivitysfunktiokutsua, joka siirtää matoa
    this.game.worm.ChangeDirection(this.bufferedKeyCode);
    
    // Nollataan purettu puskuri ja palautetaan puskurin
    // tallennuksen yhteydessä pois käytöstä otettu näppäin-
    // painallusten rekisteröintitoiminto, jolloin puskuri
    // on taas käytössä
    this.bufferedKeyCode = 0;
    this.game.board.addEventListener("keydown", function(event) {
      _this.OnKeyDown(_this, event);
    });
  }
  else
    // Matoa on siirretty, merkitään viimeisin siirtokomento 
    // käsitellyksi. Puskuri on tässä vaiheessa varmasti tyhjä 
    this.game.worm.hasMovedSinceLastKey = true;
}


///////////////////////////////////////////////////////////
// NÄPPÄINPAINALLUSTEN REKISTERÖINTIFUNKTIO ///////////////
///////////////////////////////////////////////////////////
KeyboardControl.prototype.OnKeyDown = function(event) {
  var isGameKey = false;
  // Jos madon ohjausnäppäintä painettiin, estä 
  // näppäimen mahdollinen normaalitoiminto selaimessa
  for (var key in this.keyCode) {
    if (this.keyCode[key] == event.keyCode) {
        event.preventDefault();
        isGameKey = true;
        break;
    }
  }

  if (isGameKey) {
    // Painettu näppäin on madon ohjausnäppäin 
    if (this.game.worm.hasMovedSinceLastKey) { 
      // Mato on ehtinyt liikkua edellisen validin 
      // ohjausnäppäimen painalluksen jälkeen -> yritä 
      // muuttaa normaalisti madon kulkusuunta
      if (this.game.worm.ChangeDirection(event.keyCode, this.keyCode))
        // Madon kulkusuunta muuttui
        this.game.worm.hasMovedSinceLastKey = false;
    }
    else if (!this.bufferedKeyCode) {
      // Mato ei ole ehtinyt liikkua edellisen validin ohjausnäppäimen 
      // painalluksen jälkeen ja näppäinpuskuri on tyhjillään.
      // Mikäli kyseessä on madon liikkeen perusteella 
      // sallittu suunnanvaihdos, puskuroi painallus ja poista näppäin-
      // input-tapahtumien kuuntelija käytöstä siksi aikaa, että 
      // sovelluslogiikka ehtii vaihtaa madon kulkusuunnan puskurissa 
      // olevaa painallusta vastaavaksi
      if (this.game.worm.IsValidDirectionChange(event.keyCode, this.keyCode)) {
        this.bufferedKeyCode = event.keyCode;
        this.game.board.removeEventListener("keydown", KeyboardControl.prototype.OnKeyDown);
      }
    }
  }
}