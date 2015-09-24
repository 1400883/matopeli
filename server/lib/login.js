var authentication;
var connection;

function Login(authenticationReference, sqlConnection) {
  connection = sqlConnection;
  authentication = authenticationReference;
  this.UpdateClientLoginState = UpdateClientLoginState;
  this.IoOnLoginRequest = IoOnLoginRequest;
  this.IoOnLogoffRequest = IoOnLogoffRequest;
}

function IoOnLoginRequest(socket, userData) {
  // Pura asiakkaalta tulleesta viestistä käyttäjänimi ja salasana-hash
  var parsedData = JSON.parse(userData);
  var username = parsedData.username;
  var hash = parsedData.password;
  // Tee MySQL-kysely, jolla haetaan tietokannasta käyttäjän syöttämää 
  // käyttäjänimeä.
  connection.query(
    "SELECT * FROM user WHERE name = ? AND password = ?",
    [username, hash],
    function(err, rows) {
      SQLSelectCallback(err, rows, socket, username);
    }
  );
}

function IoOnLogoffRequest(socket, username) {
  // Poista uloskirjautumista pyytävän asiakkaan käyttäjänimi 
  // autentikointiolioista ja kerro asiakkaalle uloskirjauksen 
  // suorituksesta.
  for (key in authentication.clientData) {
    if (authentication.clientData[key].loginName == username) {
      authentication.clientData[key].loginName = null;
      socket.emit("IoOnLogoffResponse");
      break;
    }
  }
}

function SQLSelectCallback(err, rows, socket, username) {
  // Palauta asiakkaan selaimelle tieto sisäänkirjautumisen onnistumisesta.
  // Sisäänkirjaus onnistuu, mikäli asiakkaan syöttämillä käyttäjänimellä 
  // ja salasanalla löytyy vastaava käyttäjätieto tietokannasta.
  var result = rows.length > 0;
  socket.emit("IoOnLoginResponse",
    JSON.stringify({ username: username, result: result }));
  if (result) {
    // Sisäänkirjaus onnistui -> tallenna käyttäjänimi autentikointiolioon.
    // Käytetään asiakkaan socket.io:n id:tä kohdistamaan kirjautuminen
    // oikeaan autentikointiolion asiakastietoon.
    for (key in authentication.clientData)
      if (authentication.clientData[key].id == socket.id) {
        authentication.clientData[key].loginName = username;
        break;
      }
  }
}

function UpdateClientLoginState(socket, cookie) {
  // Kerro asiakkaalle tämän käyttäjänimi, joka voi olla validi 
  // (= sisäänkirjautunut asiakas) tai null (= anonyymi asiakas)
  socket.emit("IoOnLoginStateUpdate", authentication.clientData[cookie].loginName);
}

module.exports = Login;