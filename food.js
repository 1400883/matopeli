function Food(game) {
  //  Ruokaan liittyviä muuttujia
  this.game = game;
  this.pos;
  this.color = "orange";
}

///////////////////////////////////////////////////////////
// RUOAN PIIRTO- JA SIJAINTIFUNKTIOT //////////////////////
///////////////////////////////////////////////////////////
Food.prototype.Draw = function() {
  // Hae jokin tyhjillään oleva pelilaudan ruutu ja piirrä ruoka siihen
  this.pos = this.GetNewPos();
  if (this.pos !== undefined)
    document.getElementById(this.pos).style.backgroundColor = this.color;
  else
    return false;
  return true;
}

Food.prototype.GetNewPos = function() {
  // Ota kopio kaikki id:t sisältävästä taulukosta
  var foodIdList = this.game.gameboard.idList.slice();
  // Ota kopio madon täyttämät ruudut sisältävästä taulukosta ja järjestä
  // suuremmasta pienempään, jolloin silmukassa voi poistaa id-taulukon
  // alkioita huoletta silmukan suorituksen aikana
  var orderedPos = this.game.worm.pos.slice().sort(this.SortHighToLow);
  // Poista listan kopiosta madon kehon valtaamien solujen id:t
  for (var i = 0; i < orderedPos.length; ++i)
    foodIdList.splice(orderedPos[i], 1);
  
  // Palauta pelikentän vapaat id-arvot sisältävistä 
  // listan alkioista sattumanvaraisesti jokin id
  return foodIdList.length
    ? foodIdList[Math.round(Math.random() * (foodIdList.length - 1))]
    : undefined; // Mato täyttää jo kentän!
}

Food.prototype.SortHighToLow = function(a, b) {
  return b - a;
}