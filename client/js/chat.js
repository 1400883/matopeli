function Chat(game) {
  var _this = this;
  this.game = game;
  this.keyCode = { enter: 13 };

  this.chatTable = document.getElementById("chat-table");
  this.chatTableBody = this.chatTable.firstElementChild;
  this.messageInput = document.getElementById("message-input");
  this.messageInput.addEventListener("keydown", function(event) {
    _this.OnKeyDown(event);
  });
  socket.on("IoOnChatMessage", function(msg) { _this.IoOnChatMessage(msg); });
};

Chat.prototype.OnKeyDown = function(event) {
  var messageText = this.messageInput.value;
  if (event.keyCode == this.keyCode.enter && messageText != "") {
    var message = { text: messageText, author: this.game.login.username != null ? this.game.login.username : "Anonyymi" };
    // Tyhjennä viestikenttä
    this.messageInput.value = "";
    socket.emit("IoOnChatMessage", JSON.stringify(message));
  }
};

Chat.prototype.IoOnChatMessage = function(msg) {
  var message = JSON.parse(msg);
  // Tallenna vierityspalkin sijainti ennen uutta chat-viestiä.
  // Jos viestinäkymä oli ääriala-asennossa, vieritä 
  // viestinäkymä automaattisesti uuden viestin saavuttua
  // pohjaan niin, että uudet viestit jäävät näkyviin.
  var entireChatAreaHeight = this.chatTable.scrollHeight;
  var visibleChatAreaHeight = parseInt(getComputedStyle(this.chatTable, null).height);
  var scrollPos = this.chatTable.scrollTop;
  var wasScrolledToBottom = scrollPos == entireChatAreaHeight - visibleChatAreaHeight;
  // Lisää uusi viesti chat-ikkunaan
  this.chatTable.innerHTML = this.chatTable.innerHTML.replace(
    /([\s\S]*?)(<\/tbody>)/, 
    "$1<tr><td>" + message.author + ": " + message.text + "</td></tr>$2");
  if (wasScrolledToBottom) {
    // Vierityspalkki oli ala-asennossa -> pidä palkki alhaalla
    entireChatAreaHeight = this.chatTable.scrollHeight;
    this.chatTable.scrollTop = entireChatAreaHeight;
  }
};