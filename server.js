///////////////////////////////////////////////////////////
// ALUSTUKSET
///////////////////////////////////////////////////////////
// Hae express-moduuli asiakaspyyntöjen reititystä
// ym helpottamaan.
var express = require("express");
var expressApp = express();
// HTTP-palvelinolio, jonka callback-metodiksi
// on määritetty express-moduuli.
var http = require("http").createServer(expressApp);
// Hae socket.io-moduuli ja kytke HTTP-palvelimeen.
var io = require("socket.io")(http);
// Hae MySQL-moduuli.
var mysql = require("mysql");

var portNumber = 3000;

// Luo yhteys MySQL-palvelimeen.
var connection = mysql.createConnection({
  host : "192.168.1.41",
  user : "root",
  password: "test1234",
  database: "matopeli"
});

///////////////////////////////////////////////////////////
// EXPRESS-MODUULIN REITITYSTEN ASETUS
///////////////////////////////////////////////////////////
// Määritä palvelin palauttamaan asiakkaan tarvitsemia tiedostoja
// (mm. asiakkaalle välitettävän HTML-tiedoston viittaamat 
// node.js-palvelimella sijaitsevat javascript-tiedostot). 
// Tiedostojen sijainti on palvelimen  juurihakemisto (__dirname). 
// Lisäksi index.html-tiedostoa ei palauteta automaattisesti.
expressApp.use("/", express.static(__dirname, { index: false }));

// Ota asiakkaalta tuleva HTTP-GET-pyyntö (=selain siirtyy sivustolle) 
// vastaan OnGet()-metodissa.
expressApp.get("/", OnGet);

function OnGet(req, res) {
  // Palauta selaimelle palvelimen juurihakemistossa oleva
  // matopeli.html-tiedosto.
  res.sendFile("/matopeli.html", { root: __dirname });
}

///////////////////////////////////////////////////////////
// SOCKET.IO CALLBACKIT
///////////////////////////////////////////////////////////
io.on("connect", OnConnect);
// Asiakasselaimen kytkeytyessä
function OnConnect(socket) {
  console.log("Asiakas kytkeytynyt osoitteesta", GetClientAddressFromSocket(socket) + ".");
  // Kuuntele asiakaspäässä tapahtuvaa yhteyden katkaisua sekä 
  // käyttäjänimen rekisteröinti-ilmoitusta
  socket.on("disconnect", OnDisconnect);
  socket.on("OnIoRegister", OnIoRegister);
}

function OnIoRegister(userData) {
  // Pura asiakkaalta tulleesta viestistä käyttäjänimi ja salasana-hash
  var parsedData = JSON.parse(userData);
  var username = parsedData["username"];
  var hash = parsedData["password"];
  
  // Tee MySQL-kysely, jolla haetaan tietokannasta käyttäjän syöttämää 
  // käyttäjänimeä.
  connection.query(
    "SELECT name FROM user WHERE name = ?",
    [username],
    function(err, row, db) {
      if (row.length) {
        // Käyttäjänimi löytyi jo tietokannasta.
        // Palauta asiakkaan selaimelle tieto varatusta käyttäjänimestä.
        io.emit("OnDuplicateUsername", username);
      }
      else {
        // Käyttäjänimi on vapaana. Lisää käyttäjänimi ja enkryptattu
        // salasana tietokantaan.
        connection.query(
          "INSERT INTO user (name, password) VALUES (?, ?)", 
          [username, hash],
          function(err, result) {
            if (result.affectedRows) {
              // Käyttäjätiedot syötetty onnistuneesti tietokantaan.
              // Välitä asiakaalle tieto onnistuneesta rekisteröinnistä.
              io.emit("OnRegisterSuccess", username);
            }
          }
        );
      }
    }
  );
}

function OnDisconnect(par) {
  console.log("Asiakas osoitteessa", GetClientAddressFromSocket(this), "katkaisi yhteyden.");
}

///////////////////////////////////////////////////////////
// HTTP-palvelin
///////////////////////////////////////////////////////////
// HTTP-palvelimen käynnistys. Palvelimen listen()-metodi pitää 
// palvelin-javascript-tiedoston suorituksen käynnissä ja 
// palvelimen asiakaspyyntöjen vastaanottotilassa aina ja iankaiken.
http.listen(portNumber, function() {
  console.log("Odotetaan asiakkaita portissa", portNumber + "...");
})


////////////////////////////////////////////////////////////////
// ETC
////////////////////////////////////////////////////////////////

// Funktio purkaa socket.io-soketista asiakkaan 
// IP-osoitteen regexiä käyttäen.
function GetClientAddressFromSocket(socket) {
  return socket.handshake["address"] == "::1"
    ? "localhost"
    : socket.handshake["address"].replace(/.*:(.*)/, "$1");
}