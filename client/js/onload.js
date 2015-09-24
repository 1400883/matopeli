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
};

// Socket.io:n palvelimeen kytkeytymis -callback
socket.on("connect", function() {
  console.log("Yhteys palvelimeen muodostettu");
});

socket.on("IoOnCookieRequest", function(cookieRegexPattern) {
  var cookieRegex = new RegExp(cookieRegexPattern);
  // Palauta palvelimelle tieto sen pyytämästä keksistä
  // sekä asiakkaan yksilöivä socket.io:n id
  socket.emit("IoOnCookieResponse",
    JSON.stringify(
      { 
        cookie: document.cookie.match(cookieRegex) != null 
          ? document.cookie.replace(cookieRegex, "$1")
          : null,
        id: socket.id
      }
    )
  );
});

socket.on("IoOnReloadRequest", function() {
  location.reload();
});