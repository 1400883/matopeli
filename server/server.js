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

// Luo yhteys MySQL-palvelimeen.
var connection = mysql.createConnection({
  host: process.env.OPENSHIFT_MYSQL_DB_HOST || "localhost",
  port: process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
  user: process.env.OPENSHIFT_MYSQL_USERNAME || "root",
  password: process.env.OPENSHIFT_MYSQL_PASSWORD || "test1234",
  database: "matopeli",
});

var authentication = new (require("./lib/authentication"))();
var login = new (require("./lib/login"))(authentication, connection);
var cookieManager = new (require("./lib/cookie"))(authentication, login);
var register = new (require("./lib/register"))(connection);
var chat = new (require("./lib/chat"))(connection, io);

var portNumber = process.env.OPENSHIFT_NODEJS_PORT || 3000;

///////////////////////////////////////////////////////////
// EXPRESS-MODUULIN REITITYSTEN ASETUS
///////////////////////////////////////////////////////////
// Määritä palvelin palauttamaan asiakkaan tarvitsemia tiedostoja
// (mm. palvelimella sijaitsevat asiakaspäässä tarvittavat 
// css- ja javascript-tiedostot, joihin matopeli-HTML-tiedosto
// viittaa). 
// Asiakastiedostojen juurisijainti on suhteessa palvelimen  
// juurihakemistoon (__dirname) yksi hakemistotaso ylöspäin 
// sijaitsevassa client-hakemistossa:
// 
// __dirname == joitain/hakemistoja/server
// asiakastiedostosijainti == joitain/hakemistoja/client
var clientDir = __dirname.replace(/^(.*)server$/, "$1client");
expressApp.use("/", express.static(clientDir));
// Ota asiakkaalta tuleva HTTP-GET-pyyntö (=selain siirtyy 
// sivustolle) vastaan OnGet()-metodissa.
expressApp.get("/", OnGet);

function OnGet(req, res) {
  console.log("OnGet");
  
  var cookie = cookieManager.GetClientCookie(req);
  if (cookie == null || !cookieManager.IsKnownCookie(cookie))
    // Luo ja lähetä asiakasselaimelle siltä puuttuva validi keksi
    res.cookie(cookieManager.cookieName, cookieManager.CreateUniqueCookie());

  // Palauta selaimelle palvelimen asiakastiedostohakemistosta 
  // löytyvä matopeli.html-tiedosto.
  res.sendFile("/matopeli.html", { root: clientDir });
}

///////////////////////////////////////////////////////////
// SOCKET.IO CALLBACKIT
///////////////////////////////////////////////////////////
io.on("connect", OnConnect);
// Asiakasselaimen kytkeytyessä
function OnConnect(socket) {
  console.log("Asiakas kytkeytynyt osoitteesta", 
              GetClientAddressFromSocket(socket) + ".");
  // Kuuntele asiakaspäässä tapahtuvaa yhteyden katkaisua sekä 
  // muita räätälöityjä ilmoituksia
  socket.on("disconnect", OnDisconnect);
  socket.on("IoOnCookieResponse", function(cookieData) { 
    cookieManager.IoOnCookieResponse(socket, cookieData); });
  socket.on("IoOnLoginRequest", function(userData) { login.IoOnLoginRequest(socket, userData); });
  socket.on("IoOnLoginStateUpdateResponse", login.IoOnLoginStateUpdateResponse);
  socket.on("IoOnLogoffRequest", function(username) { login.IoOnLogoffRequest(socket, username); });
  socket.on("IoOnRegister", function(userData) { register.IoOnRegister(socket, userData); });
  socket.on("IoOnChatMessage", function(message) { chat.IoOnChatMessage(message); });

  // Lähetä asiakkaalle pyyntö palauttaa matopelikeksi
  socket.emit("IoOnCookieRequest", cookieManager.cookieRegex.source);
}

function OnDisconnect() {
  console.log("Asiakas osoitteessa", 
              GetClientAddressFromSocket(this), 
              "katkaisi yhteyden.");
}

///////////////////////////////////////////////////////////
// HTTP-palvelin
///////////////////////////////////////////////////////////
// HTTP-palvelimen käynnistys. Palvelimen listen()-metodi pitää 
// palvelin-javascript-tiedoston suorituksen käynnissä ja 
// palvelimen asiakaspyyntöjen vastaanottotilassa aina ja iankaiken.
http.listen(portNumber, function() {
  console.log("Odotetaan asiakkaita portissa", portNumber + "...");
});

////////////////////////////////////////////////////////////////
// ETC
////////////////////////////////////////////////////////////////
// Funktio purkaa socket.io-soketista asiakkaan 
// IP-osoitteen regexiä käyttäen.
function GetClientAddressFromSocket(socket) {
  return socket.handshake.address == "::1"
    ? "localhost"
    : socket.handshake.address.replace(/.*:(.*)/, "$1");
};