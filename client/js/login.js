function Login() {
  var _this = this;

  // Sisäänkirjauselementit ja -painikkeen kuuntelu
  this.loginForm = document.getElementById("login-form");
  this.loginReg = document.getElementById("login-reg");
  this.loginUsername = document.getElementById("login-username");
  this.loginPassword = document.getElementById("login-password");
  this.loginButton = document.getElementById("login-button");
  this.loginButton.addEventListener("click", function(event) {
    _this.OnLoginClick(event);
  });
  
  // Uloskirjauselementit ja -painikkeen kuuntelu
  this.logoffForm = document.getElementById("logoff-form");
  this.loggedUsername = document.getElementById("logged-username");
  this.logoffButton = document.getElementById("logoff-button");
  this.logoffButton.addEventListener("click", function(event) {
    _this.OnLogoffClick(event);
  });

  // Käyttäjän autentikointipäivitys palvelimelta asiakkaalle
  socket.on("IoOnLoginStateUpdate", function(loggedUsername) {
    _this.IoOnLoginStateUpdate(loggedUsername);
  });

  // Sisään- ja uloskirjauspyyntöjen vastaukset palvelimelta
  socket.on("IoOnLoginResponse", function(loginData) { _this.IoOnLoginResponse(loginData); });
  socket.on("IoOnLogoffResponse", function() { _this.IoOnLogoffResponse(); });
};

Login.prototype.IoOnLoginResponse = function(loginData) {
  var parsedData = JSON.parse(loginData);
  var username = parsedData.username;
  var result = parsedData.result;
  this.username = result ? username : null;
  // Jos käyttäjätunnus/salasana-yhdistelmä löytyi tietokannasta,
  // pyyhi syöttökentät ja vapauta painike sekä syöttökentät.
  // Jos yhdistelmää ei löytynyt, jätä käyttäjänimi kenttään ja 
  // toimi muuten samoin kuin edellä.
  if (result) {
    this.UpdateLoginBar();
    this.loginUsername.value = "";
  }
  this.loginPassword.value = "";
  this.loginUsername.disabled = false;
  this.loginPassword.disabled = false;
  this.loginButton.disabled = false;
};

// Palvelimelta tuleva ilmoitus asiakkaan uloskirjauspyynnön vastaanotosta
Login.prototype.IoOnLogoffResponse = function() {
  // Nollaa selainpää takaisin sisäänkirjaustilaan
  this.username = null;
  this.UpdateLoginBar();
};

// Tätä metodia palvelin kutsuu muulloin kuin sisään- tai uloskirjauksen
// yhteydessä tapahtuvassa autentikointitarkastuksessa.
Login.prototype.IoOnLoginStateUpdate = function(loggedUsername) {
  this.username = loggedUsername != null ? loggedUsername : null;
  this.UpdateLoginBar();
};

// Sisäänkirjauspainikkeen callback
Login.prototype.OnLoginClick = function(event) {
  var _this = this;
  this.loginUsername.disabled = true;
  this.loginPassword.disabled = true;
  this.loginButton.disabled = true;
  setTimeout(function() { _this.Send(); }, 500);
};

// Ulsokirjauspainikkeen callback
Login.prototype.OnLogoffClick = function(event) {
  var _this = this;
  socket.emit("IoOnLogoffRequest", _this.username);
};

// Sisäänkirjaustietojen lähetys palvelimelle
Login.prototype.Send = function() {
  // Enkryptaa salasana SHA256-algoritmilla ja lähetä yhdessä käyttäjänimen kanssa palvelimelle
  var hash = CryptoJS.SHA256(this.loginPassword.value).toString();
  socket.emit("IoOnLoginRequest", 
    JSON.stringify({ username: this.loginUsername.value, password: hash }));
};

// Yläpalkin päivitystoiminto. Jos käyttäjänimi on validi, piilota
// sisäänkirjausosio ja näytä kirjautumistiedot sekä uloskirjauspainike. 
// Jos käyttäjänimi on taas null, piilota uloskirjausosio ja näytä
// sisäänkirjausosio.
Login.prototype.UpdateLoginBar = function() {
  this.loginForm.style.display = this.username != null ? "none" : "block";
  this.loginReg.style.display = this.username != null ? "none" : "block";
  this.logoffForm.style.display = this.username != null ? "block" : "none";
  this.loggedUsername.textContent = this.username != null ? this.username : "";
};