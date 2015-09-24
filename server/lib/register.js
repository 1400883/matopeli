var connection;

function Register(sqlConnection) {
  connection = sqlConnection;
  this.IoOnRegister = IoOnRegister;
}

function IoOnRegister(socket, userData) {
  // Pura asiakkaalta tulleesta viestistä käyttäjänimi ja salasana-hash
  var parsedData = JSON.parse(userData);
  var username = parsedData.username;
  var hash = parsedData.password;
  // Tee MySQL-kysely, jolla haetaan tietokannasta käyttäjän syöttämää 
  // käyttäjänimeä.
  connection.query(
    "SELECT name FROM user WHERE name = ?",
    [username],
    function(err, rows) {
      SQLSelectCallback(err, rows, socket, username, hash);
    }
  );
}

function SQLSelectCallback(err, rows, socket, username, hash) {
  if (rows.length) {
    // Käyttäjänimi löytyi jo tietokannasta.
    // Palauta asiakkaan selaimelle tieto varatusta käyttäjänimestä.
    socket.emit("IoOnRegisterResponse", JSON.stringify({ username: username, result: false }));
  }
  else {
    // Käyttäjänimi on vapaana. Lisää käyttäjänimi ja enkryptattu
    // salasana tietokantaan.
    connection.query(
      "INSERT INTO user (name, password) VALUES (?, ?)", 
      [username, hash],
      function(err, result) {
        SQLInsertCallback(err, result, socket, username);
      }
    );
  }
}

function SQLInsertCallback(err, result, socket, username) {
  if (result.affectedRows) {
    // Käyttäjätiedot syötetty onnistuneesti tietokantaan.
    // Välitä asiakaalle tieto onnistuneesta rekisteröinnistä.
    socket.emit("IoOnRegisterResponse", JSON.stringify({ username: username, result: true }));
  }
}

module.exports = Register;