// Globaalit muuttujat
// Socket.io-asiakasolio
var socket = io();
var game;
var DEBUGMODE = true;

// onload-metodi suoritetaan sivun latauduttua asiakasselaimeen
onload = function() {
  // Luo peliolio ja käynnistä peli
  game = new Game();
  game.Start(game.boardSizeDim.average, game.boardSizeDim.average);
}

// Socket.io:n palvelimeen kytkeytymis-callback
socket.on("connect", function() {
  console.log("Yhteys palvelimeen muodostettu");
});