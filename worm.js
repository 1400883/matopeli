
var DEBUGMODE = true;
// Madon ominaisuusmuuttujia
var pos = []; 
var startLen = 5;
// Värjätään mato usealla värillä etupään sijainnin ja  
// liikesuunnan paremmin hahmottamiseksi, kun mato on
// yhdellä väkkärällä.
var wormColor = { 
  head: "#ff0000", 
  neck: "#c50f74", 
  shoulder: "#4e3ca9",
  body: "darkblue"
};
var dir = "d";
var movesPerSecond = 3;

// Madon liikutukseen liittyviä muuttujia
var getNextPos = { "l": GetLeft, "r": GetRight, "u": GetUp, "d": GetDown };
var keyCode = { "left": 37, "up": 38, "right": 39, "down": 40 }
var bufferedKeyCode = 0;
var hasMovedSinceLastKey;

//  Ruokaan liittyviä muuttujia
var foodPos;
var foodColor = "orange";
var idList = [];
var hasJustEatenFood;

// Peliin ja pelilautaan liittyvät muuttujat
var gameboard;
var scoreDisplay;
var startGameButton;
var gameControls;
var startGameButtonText = { off: "Aloita peli", on: "Pysäytä", paused: "Jatka" };

var boardSizeOptions = { large: "suuri", average: "keskikoko", small: "pieni" };
var boardSizeDim = { large: 20, average: 14, small: 8 };
var speedOptions = { high: "nopea", medium: "normaali", slow: "hidas"};
var speedLevel = { high: 10, medium: 6, slow: 3 };
var boardWidth;
var boardHeight;
var setIntervalId;
var score;
var isGamePaused;
var isGameRunning;
var isGameOverReasonWin;

function CreateGame() {
  StartGame(boardSizeDim["average"],boardSizeDim["average"]);
}

function StartGame(width, height) {
  console.log("startGame");

  // Alustukset
  isGameRunning = false;
  isGamePaused = false;
  hasJustEatenFood = false;
  score = 0;

  // Tallenna käyttöliittymästä syötetyt pelilaudan mitat
  boardWidth = width;
  boardHeight = height;
  
  // Kuuntele näppäinpainalluksia pelilaudan ollessa fokusoituna
  gameboard = document.getElementById("gameboard");
  gameboard.addEventListener("keydown", OnKeyDown);


  // Määritä madon aloitussijainti pelilaudan keskelle, 
  // jos aloituspistettä ei määritelty erikseen
  if (pos.length < startLen) {
    var wormPart = GetGameboardMiddlePoint();
    var nextPos = wormPart;
    pos.push(wormPart);
    for (var i = 0; i < startLen - 1; ++i) {
      nextPos = getNextPos[dir](nextPos);
      pos.unshift(2 * wormPart - nextPos);
    }
  }
  // Y = Math.floor(pos / boardWidth)
  // X = pos % boardWidth

  // Piirrä pelilauta
  InitGameboard();
  
  // Piirrä mato aloitussijaintiin
  DrawWorm(true);

  // Piirrä ensimmäinen ruoka
  DrawFood();

  // Alusta pistenäyttö
  var gametable = document.getElementById("gametable")
  scoreDisplay = document.getElementById("score-display");
  scoreDisplay.textContent = score;

  // Sijoita pelinohjauspainikkeet pelilaudan vasemmalle puolelle.
  gameControls = document.getElementById("game-controls");
  PositionGameControls();
  
  // Pelin aloituspainike ja painikkeen kuuntelu
  startGameButton = document.getElementById("start-game");
  startGameButton.addEventListener("click", OnStartButtonClick);

  window.addEventListener("resize", OnResize);
  // Aloita madon liike
  // setIntervalId = StartGameInterval();

  // Kehitystyötä varten:
  // - Tulostetaan hiiren kursorin alla olevan solun id-tunnus
  //   pelikentän viereen. Alkuperäisessä videossa solujen 
  //   title-ominaisuuteen oli tallennettu sama id, joka kyllä 
  //   ilmestyy selaimissa näkyviin hiiren kursorin viipyessä 
  //   solun päällä hetken aikaa, mutta ilmestyminen kestää turhan
  //   kauan. Tehdään oma id-näyttö, joka reagoi heti hiiren
  //   sijaintiin.
  if (DEBUGMODE) {
    // Haetaan heti pelilaudan oikealta puolelta sopiva paikka, 
    // johon InitGameboard()-funktiossa HTML-dokumenttiin luotava
    // span#logger-elementti asetellaan
    var gametable = document.getElementById("gametable")
    var logger = document.getElementById("logger");
    var gameboardStyle = getComputedStyle(gameboard, null);
    var tableStyle = getComputedStyle(document.getElementById("gametable"), null);
    var x = (parseInt(gameboardStyle.width) + parseInt(tableStyle.width)) / 2;
    var y = parseInt(gameboardStyle.height) / 2 + 
      parseInt(getComputedStyle(document.getElementById("login"), null).height);
    logger.style.left = x + "px";
    logger.style.top = y + "px";

    // Aktivoidaan pelilaudalle hiiren kursorin rekisteröinti
    for (var i = 0; i < boardWidth * boardHeight; ++i) {
      var td = document.getElementById(i);
      td.addEventListener("mouseover", OnMouseOver);
      td.addEventListener("mouseleave", OnMouseLeave);
    }
  }
}

function OnResize() {
  PositionGameControls();
}

function PositionGameControls() {
  var visibleWindowWidth = window.innerWidth;
  var gametableWidth = parseFloat(getComputedStyle(gametable, null).width); 
  var gameControlsWidth = parseInt(getComputedStyle(gameControls, null).width);
  gameControls.style.left = Math.round(visibleWindowWidth / 2 - gametableWidth / 2 - gameControlsWidth - 10) + "px";
}

function StartGameInterval() {
  setIntervalId = setInterval(UpdateGame, Math.round(1000 / movesPerSecond));
}

function StopGameInterval() {
  clearInterval(setIntervalId);
}

function OnStartButtonClick() {
  
  if (!isGameRunning) {
    // Pelia ei ole vielä käynnistetty -> käynnistä peli
    isGameRunning = true;
    StartGameInterval();
  }
  else {
    // Peli on käynnistetty
    if (isGamePaused)
      // Peli on pausella -> jatka peliä
      StartGameInterval();
    else
      // Peli on käynnissä -> pauseta
      StopGameInterval();
    // Vaihda pause-muuttujan arvo
    isGamePaused = !isGamePaused;
  }

  // Päivitä pelinkäynnistyspainikkeen teksti
  startGameButton.value = isGamePaused 
    ? startGameButtonText["paused"]
    : startGameButtonText["on"];
}

///////////////////////////////////////////////////////////
// NÄPPÄINPAINALLUSTEN REKISTERÖINTIFUNKTIO ///////////////
///////////////////////////////////////////////////////////
function OnKeyDown(event) {
  var isGameKey = false;
  // Jos madon ohjausnäppäintä painettiin, estä 
  // näppäimen mahdollinen normaalitoiminto
  for (var key in keyCode) {
    if (keyCode[key] == event.keyCode) {
        event.preventDefault();
        isGameKey = true;
        break;
    }
  }

  if (isGameKey) {
    // Painettu näppäin on madon ohjausnäppäin 
    if (hasMovedSinceLastKey) { 
      // Mato on ehtinyt liikkua edellisen validin 
      // ohjausnäppäimen painalluksen jälkeen
      if (ChangeDirection(event.keyCode))
        hasMovedSinceLastKey = false;
    }
    else if (!bufferedKeyCode) {
      // Mato ei ole ehtinyt liikkua edellisen validin ohjausnäppäimen 
      // painalluksen jälkeen ja näppäinpuskuri on tyhjillään.
      // Mikäli kyseessä on madon liikkeen perusteella 
      // sallittu suunnanvaihdos, puskuroi painallus ja poista näppäin-
      // input-tapahtumien kuuntelija käytöstä siksi aikaa, että 
      // sovelluslogiikka ehtii vaihtaa madon kulkusuunnan puskurissa 
      // olevaa painallusta vastaavaksi
      if (    (event.keyCode == keyCode["left"] && dir != "l" && dir != "r")
          ||  (event.keyCode == keyCode["right"] && dir != "l" && dir != "r")
          ||  (event.keyCode == keyCode["up"] && dir != "u" && dir != "d")
          ||  (event.keyCode == keyCode["down"] && dir != "u" && dir != "d")) {
        bufferedKeyCode = event.keyCode;
        gameboard.removeEventListener("keydown", OnKeyDown);
      }
    }
  }
}

///////////////////////////////////////////////////////////
// PELIN TILAN PÄIVITYSFUNKTIO ////////////////////////////
///////////////////////////////////////////////////////////
function UpdateGame() {
  // Päivitetään madon sijainti
  /////////////////////////////
  var nextPos = getNextPos[dir](pos[pos.length - 1]);
  
  // Madon törmäystarkistus
  for (var i = 1; i < pos.length - 3; ++i) {
    if (nextPos == pos[i]) {
      // Mato on törmännyt omaan kylkeensä
      isGameRunning = false;
      isGameOverReasonWin = false;
      break;
    }
  }
  
  if (isGameRunning) {
    // Merkitse mato liikkuneeksi liikesuunnan mukaiseen 
    // seuraavaan sijaintiin
    pos.push(nextPos);

    // Merkitse madon peräpääruudusta pelilaudalta madon 
    // väri pois pyyhittäväksi, jos mato ei ole juuri syönyt 
    // ruokaa (= mato liikkuu eteenpäin).
    // Vastaavasti jos mato söi ruoan, sen pituus pitenee 
    // ja venyy pään puoleisesta päästä seuraavalla siirrolla.
    // Tällöin peräpää jää vielä paikalleen.
    if (!hasJustEatenFood) {
      // Mato ei ole syönyt -> poista matoväri peräpään 
      // alla olevasta pelilaudan ruudusta
      RestoreBackground();
      // Merkitse ruutu matoon kuulumattomaksi
      pos.shift();
    }
    else
      // Mato on syönyt eikä sen perää pyyhitty tällä siirrolla.
      // Nollataan syönnistä kertova muuttuja seuraavaan siirtoon.
      hasJustEatenFood = false;
  
    // Piirrä mato suunnan mukaiseen uuteen sijaintiin
    DrawWorm();

    // Ruoan hallinta ja pistelasku
    /////////////////////////////
    if (pos[pos.length - 1] == foodPos) {
      // Mato poimi ruoan -> välitetään viesti madon piirto-
      // funktiolle madon pidennystä varten
      hasJustEatenFood = true;
      // Kasvata pistelukemaa
      scoreDisplay.textContent = ++score;
      // Piirretään uusi ruoka pelilaudalle
      if (!DrawFood()) {
        // Uusi ruoka ei mahtunut pelilaudalle -> 
        // mato täyttää jo koko pelilaudan
        isGameRunning = false;
        isGameOverReasonWin = true;
      }
    }
    if (isGameRunning) {
      // Madon sijainnin näppäimistöpuskurin tarkistus
      /////////////////////////////
      if (bufferedKeyCode) {
        // Näppäinpuskurissa on painallus, puretaan se muuttamalla
        // madon suunta manuaalisesti puskurissa olevaa näppäintä
        // vastaavaksi ja jäädään odottamaan seuraavaa ajastettua
        // sijaintipäivitysfunktiokutsua, joka siirtää matoa
        ChangeDirection(bufferedKeyCode);
        
        // Nollataan purettu puskuri ja palautetaan puskurin
        // tallennuksen yhteydessä pois käytöstä otettu näppäin-
        // painallusten rekisteröintitoiminto, jolloin puskuri
        // on taas käytössä
        bufferedKeyCode = 0;
        gameboard.addEventListener("keydown", OnKeyDown);
      }
      else
        // Matoa on siirretty, merkitään viimeisin siirtokomento 
        // käsitellyksi. Puskuri on tässä vaiheessa varmasti tyhjä 
        hasMovedSinceLastKey = true;
    }
  }

  if (!isGameRunning) {
    StopGameInterval();
    setTimeout(GameOver, 50);
  }
}

///////////////////////////////////////////////////////////
// RUOAN PIIRTO- JA SIJAINTIFUNKTIOT //////////////////////
///////////////////////////////////////////////////////////
function DrawFood() {
  // Hae jokin tyhjillään oleva pelilaudan ruutu ja piirrä ruoka siihen
  foodPos = GetNewFoodPos();
  if (foodPos !== undefined)
    document.getElementById(foodPos).style.backgroundColor = foodColor;
  else
    return false;
  return true;
}

function GameOver() {
  if (isGameOverReasonWin) {
    // Pelaaja sai täytettyä madollaan koko ruudun!
    console.log("Win");
  }
  else {
    // Pelaajan mato törmäsi itseensä
    console.log("Lose");
  }
  // Aseta pelin aloituspainikkeen teksti alkuarvoonsa.
  startGameButton.value = startGameButtonText["off"];
}

function GetNewFoodPos() {
  // Ota kopio kaikki id:t sisältävästä taulukosta
  var foodIdList = idList.slice();
  var orderedPos = pos.slice().sort(SortHighToLow);
  // Poista listan kopiosta madon kehon valtaamien solujen id:t
  for (var i = 0; i < orderedPos.length; ++i)
    foodIdList.splice(orderedPos[i], 1);
  
  // Palauta pelikentän vapaat id-arvot sisältävistä listan 
  // alkioista sattumanvaraisesti jokin id
  return foodIdList.length
    ? foodIdList[Math.round(Math.random() * (foodIdList.length - 1))]
    : undefined;
}

function SortHighToLow(a, b) {
  return b - a;
}

///////////////////////////////////////////////////////////
// MADON SIJAINTIPÄIVITYS, SUUNNANMUUTOS JA LIIKUTUSFUNKTIOT
///////////////////////////////////////////////////////////
function ChangeDirection(pressedKey) {
  // Muuta kulkusuunta, jos pelaaja ei yritä liikkua tulo- 
  // tai menosuuntaan
  var previousDir = dir;
  dir = 
      pressedKey == keyCode["left"]  ? dir != "r" ? "l" : dir
    : pressedKey == keyCode["right"] ? dir != "l" ? "r" : dir
    : pressedKey == keyCode["up"]    ? dir != "d" ? "u" : dir
    : dir != "u" ? "d" : dir // <-- event.keyCode == keyCode[down]
  
  return dir != previousDir; // Palauta tieto, muuttuiko kulkusuunta
}

function GetLeft(currentPos) {
  return currentPos % boardWidth // Onko mato parhaillaan vasemmasta laidasta irti?
    ? currentPos - 1 // Kyllä -> voi siirtää vasemmalle
    : boardWidth + currentPos - 1; // Ei, laitetaan ilmestymään sisään oikeasta laidasta
}

function GetRight(currentPos) {
  return (currentPos + 1) % boardWidth // Onko mato parhaillaan oikeasta laidasta irti?
    ? currentPos + 1 // Kyllä, voi siirtää oikealle
    : currentPos - boardWidth + 1; // Ei, laitetaan ilmestymään sisään vasemmasta laidasta
}

function GetUp(currentPos) {
  return currentPos >= boardWidth // Onko -- ylälaidasta irti?
    ? currentPos - boardWidth // Kyllä -> siirto ylös
    : currentPos + boardWidth * (boardHeight - 1); // Ei -> ilmestyy sisään alhaalta
}

function GetDown(currentPos) {
  return currentPos < boardWidth * (boardHeight - 1) // Onko -- alalaidasta irti?
    ? currentPos + boardWidth // Kyllä -> siirto alas
    : currentPos + boardWidth * (1 - boardHeight); // Ei -> ilmestyy sisään ylhäältä
}

///////////////////////////////////////////////////////////
// MADON PIIRTO- JA TAUSTAN PYYHKIMISFUNKTIOT /////////////
///////////////////////////////////////////////////////////
// function DrawWorm(needsEntireBodyDrawn) {
function DrawWorm() {
  document.getElementById(pos[pos.length - 1]).style.backgroundColor = wormColor["head"];
  document.getElementById(pos[pos.length - 2]).style.backgroundColor = wormColor["neck"];
  document.getElementById(pos[pos.length - 3]).style.backgroundColor = wormColor["shoulder"];
  for (var i = pos.length - 4; i >= 0 ; --i) {
    document.getElementById(pos[i]).style.backgroundColor = wormColor["body"];
  }
}

function RestoreBackground() {
  document.getElementById(pos[0]).style.backgroundColor = "";
}

///////////////////////////////////////////////////////////
// PELILAUDAN ALUSTUSFUNKTIOT /////////////////////////////
///////////////////////////////////////////////////////////
function InitGameboard() {
  var gameboard = "<div id=\"score-container\">Pisteet:<div id=\"score-display\"></div></div>" +
	"<table id=\"gametable\">";
  for (var iRow = 0; iRow < boardHeight; ++iRow) {
    gameboard += "<tr>";
    for (var iCell = 0; iCell < boardWidth; ++iCell) {
      gameboard +=  "<td id=\"" + (iRow * boardWidth + iCell) + 
                    // "\" title=\"" + (iRow * boardWidth + iCell) +
                    "\">" +
                    "</td>";
      idList.push(iRow * boardWidth + iCell);
    }
    gameboard += "</tr>";
  }
  gameboard += "</table>";
  gameboard += "<div id=\"game-controls\">" + 
      "<input type=\"button\" id=\"start-game\" value=\"" + startGameButtonText["off"] + "\">" + 
      "<div class=\"dropdown\">Pelilaudan koko:<select id=\"boardsize\">";
  for (key in boardSizeOptions) {
    gameboard += "<option value=\"" + key + "\"" + 
      (key == "average" ? "selected=\"selected\"" : "") + ">" + boardSizeOptions[key] + "</option>";
  }
  gameboard += "</select></div><div class=\"dropdown\">Madon nopeus:<select id=\"worm-speed\">";
  for (key in speedOptions) {
    gameboard += "<option value=\"" + key + "\"" + (key == "medium" ? "selected=\"selected\"" : "") + ">" + speedOptions[key] + "</option>";
  }
  gameboard += "</select></div></div>";
  if (DEBUGMODE)
    gameboard += "<span id=\"logger\"></span>"
  document.getElementById("gameboard").innerHTML = gameboard;
}

function GetGameboardMiddlePoint() {
  return boardWidth * ((boardHeight - 1) - Math.floor(boardHeight / 2)) + Math.round(boardWidth / 2 - 1);
}

///////////////////////////////////////////////////////////
// DEBUGGAUS CALLBACK-FUNKTIOT ////////////////////////////
///////////////////////////////////////////////////////////
function OnMouseOver(event) {
  if (event.target.tagName == "TD") {
    document.getElementById("logger").textContent = event.target.id;
  }
}

function OnMouseLeave(event) {
  document.getElementById("logger").textContent = "";
}

/*
Pelilaudan visualisointia auttamaan:

20 x 20 matriisi

000 001 002 003 004 005 006 007 008 009 010 011 012 013 014 015 016 017 018 019
020 021 022 023 024 025 026 027 028 029 030 031 032 033 034 035 036 037 038 039
040 041 042 043 044 045 046 047 048 049 050 051 052 053 054 055 056 057 058 059
060 061 062 063 064 065 066 067 068 069 070 071 072 073 074 075 076 077 078 079
080 081 082 083 084 085 086 087 088 089 090 091 092 093 094 095 096 097 098 099
100 101 102 103 104 105 106 107 108 109 110 111 112 113 114 115 116 117 118 119
120 121 122 123 124 125 126 127 128 129 130 131 132 133 134 135 136 137 138 139
140 141 142 143 144 145 146 147 148 149 150 151 152 153 154 155 156 157 158 159
160 161 162 163 164 165 166 167 168 169 170 171 172 173 174 175 176 177 178 179
180 181 182 183 184 185 186 187 188 189 190 191 192 193 194 195 196 197 198 199
200 201 202 203 204 205 206 207 208 209 210 211 212 213 214 215 216 217 218 219
220 221 222 223 224 225 226 227 228 229 230 231 232 233 234 235 236 237 238 239
240 241 242 243 244 245 246 247 248 249 250 251 252 253 254 255 256 257 258 259
260 261 262 263 264 265 266 267 268 269 270 271 272 273 274 275 276 277 278 279
280 281 282 283 284 285 286 287 288 289 290 291 292 293 294 295 296 297 298 299
300 301 302 303 304 305 306 307 308 309 310 311 312 313 314 315 316 317 318 319
320 321 322 323 324 325 326 327 328 329 330 331 332 333 334 335 336 337 338 339
340 341 342 343 344 345 346 347 348 349 350 351 352 353 354 355 356 357 358 359
360 361 362 363 364 365 366 367 368 369 370 371 372 373 374 375 376 377 378 379
380 381 382 383 384 385 386 387 388 389 390 391 392 393 394 395 396 397 398 399
*/