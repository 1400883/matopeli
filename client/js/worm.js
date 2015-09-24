function Worm(game) {
  this.game = game;
  // Madon ominaisuusmuuttujia
  this.pos = []; 
  this.hasJustEatenFood = false;
  this.startLen = 5;
  // Värjätään mato usealla värillä etupään sijainnin ja  
  // liikesuunnan paremmin hahmottamiseksi, kun mato on
  // yhdellä väkkärällä.
  this.color = { 
    head: "#ff0000", 
    neck: "#c50f74", 
    shoulder: "#4e3ca9",
    body: "darkblue",
  };
  this.movesPerSecond = 3;
  this.hasMovedSinceLastKey = false;
};

///////////////////////////////////////////////////////////
// MADON ALUSTUSFUNKTIO ///////////////////////////////////
///////////////////////////////////////////////////////////

Worm.prototype.Init = function() {
  // Madon suunta
  this.dir = "d";
  // Määritä madon aloitussijainti pelilaudan keskelle
  var wormPart = this.game.gameboard.GetMiddlePoint();
  var nextPos = wormPart;
  this.pos = [];
  this.pos.push(wormPart);
  for (var i = 0; i < this.startLen - 1; ++i) {
    nextPos = this.game.gameboard.getNextPos[this.dir](nextPos);
    this.pos.unshift(2 * wormPart - nextPos);
  }
};

///////////////////////////////////////////////////////////
// MADON SUUNNANMUUTOSFUNKTIOT ////////////////////////////
///////////////////////////////////////////////////////////
Worm.prototype.ChangeDirection = function(pressedKey) {
  // Muuta kulkusuunta, jos pelaaja ei yritä liikkua tulo- 
  // tai menosuuntaan
  var previousDir = this.dir;
  this.dir = 
      pressedKey == this.game.keyboardControl.keyCode.left  ? this.dir != "r" ? "l" : this.dir
    : pressedKey == this.game.keyboardControl.keyCode.right ? this.dir != "l" ? "r" : this.dir
    : pressedKey == this.game.keyboardControl.keyCode.up    ? this.dir != "d" ? "u" : this.dir
    : this.dir != "u" ? "d" : this.dir; // <-- event.keyCode == this.game.keyboardControl.keyCode.down
  
  return this.dir != previousDir; // Palauta tieto, muuttuiko kulkusuunta
};

Worm.prototype.IsValidDirectionChange = function(input, keycodes) {
  var wormDir = this.game.worm.dir;
  return (input == keycodes.left && wormDir != "l" && wormDir != "r")
      || (input == keycodes.right && wormDir != "l" && wormDir != "r")
      || (input == keycodes.up && wormDir != "u" && wormDir != "d")
      || (input == keycodes.down && wormDir != "u" && wormDir != "d");
};

///////////////////////////////////////////////////////////
// MADON PIIRTO- JA TAUSTAN PYYHKIMISFUNKTIOT /////////////
///////////////////////////////////////////////////////////
// function DrawWorm(needsEntireBodyDrawn) {
Worm.prototype.Draw = function() {
  document.getElementById(this.pos[this.pos.length - 1]).style.backgroundColor = this.color.head;
  document.getElementById(this.pos[this.pos.length - 2]).style.backgroundColor = this.color.neck;
  document.getElementById(this.pos[this.pos.length - 3]).style.backgroundColor = this.color.shoulder;
  for (var i = this.pos.length - 4; i >= 0; --i) {
    document.getElementById(this.pos[i]).style.backgroundColor = this.color.body;
  }
};

Worm.prototype.RestoreBackground = function() {
  document.getElementById(this.pos[0]).style.backgroundColor = "";
};