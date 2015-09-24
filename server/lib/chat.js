var connection;
var io;

function Chat(sqlConnection, ioReference) {
  connection = sqlConnection;
  // Palvelinpään io-oliota tarvitaan chatviestien
  // peilaamikseksi kaikille asiakkaille
  io = ioReference;
  this.IoOnChatMessage = IoOnChatMessage;
};

function IoOnChatMessage(msg) {
  var message = JSON.parse(msg);
  // SQL-palvelin tallentaa taulun aikasarakkeeseen
  // palvelimen paikallisen ajankohdan, kun arvo
  // jätetään syöttämättä INSERTissä
  connection.query(
    "INSERT INTO chat (msg, author) VALUES (?, ?)",
    [message.text, message.author],
    function(err, result) {
      SQLInsertCallback(err, result, message);
    }
  );
};

function SQLInsertCallback(err, result, message) {
  if (result.affectedRows) {
    // Hae SQL-palvelimen chat-viestille generoima aikaleima
    connection.query(
      "SELECT time FROM chat WHERE id = " + result.insertId,
      function(err, rows) {
        SQLSelectCallback(err, rows, message);
      }
    );
  }
};

function SQLSelectCallback(err, rows, message) {
  var timestamp = rows[0].time;
  // Aikaleima on tallessa, muttei sitä käytetä vielä mihinkään.
  
  io.emit("IoOnChatMessage",
    JSON.stringify(
      { 
        text: message.text,
        author: message.author,
        time: timestamp.toLocaleString()
      }
    )
  );
};

module.exports = Chat;