function RegisterDialog() {
  var _this = this;
  this.dialogContext = this;

  // Socket.io callback, joka ottaa vastaan palvelimen lähettämän
  // viestin, mikäli syötetty käyttäjänimi on jo tietokannassa.
  socket.on("OnDuplicateUsername", function(username) { 
    _this.OnDuplicateUsername(username);
  });
  // Socket.io callback, johon palvelin viestittää onnistuneesta 
  // käyttäjätunnuksen rekisteröinnistä.
  socket.on("OnSuccess", function(username) {
    _this.OnSuccess(username);
  });

  this.isLoginValidation;
  this.minPasswordLength = 8;

  // Hae tarvittavat kenttien elementtiviitteet
  this.loginUsername = document.getElementById("login-username");
  this.loginPassword = document.getElementById("login-password");
  this.loginUsernameValidity = document.getElementById("login-username-validation");
  this.loginPasswordValidity = document.getElementById("login-password-validation");
  this.loginButton = document.getElementById("login-button");

  this.registerUsername = document.getElementById("register-username");
  this.registerPassword = document.getElementById("register-password");
  this.registerUsernameValidity = document.getElementById("register-username-validation");
  this.registerPasswordValidity = document.getElementById("register-password-validation");
  // Alusta rekisteröinti-popupin asetukset
  this.registerDialog = document.getElementById("register-dialog");
  $("#register-dialog").dialog({
    autoOpen: false,
    draggable: false,
    resizable: false,
    modal: true,
    buttons: [
      {
        text: "Rekisteröidy",
        click: function() {
          _this.OnRegisterButton();
        }
      },
    ],
    width: 450
  });
  
  // Luo rekisteröinnin onnistumistekstin sisältävä div-elementti jQuery UI:n sisälle
  this.registerDialogSuccess = document.createElement("div");
  this.registerDialogSuccess.setAttribute("id", "register-success-text");
  this.registerDialogSuccess.innerHTML = "&nbsp;";
  document.getElementsByClassName("ui-dialog-buttonpane")[0].insertBefore(
    this.registerDialogSuccess, 
    document.getElementsByClassName("ui-dialog-buttonset")[0]);
  this.registerDialogButton = document.getElementsByClassName("ui-dialog-buttonset")[0].getElementsByTagName("button")[0];
  
  var registerLink = document.getElementById("register-link");
  registerLink.addEventListener("click", this.Show);
}

RegisterDialog.prototype.OnRegisterButton = function() {
  var _this = this;
  // Tyhjennä virheellisistä syötteistä ilmoittavat kentät
  this.registerUsernameValidity.innerHTML = "&nbsp;";
  this.registerPasswordValidity.innerHTML = "&nbsp;";
  // Kyseessä on rekistöintisyötteen - ei sisäänkirjautumisen - validointi
  this.isLoginValidation = false;
  // Poista kentät ja painike käytöstä käyttäjänimen ja salasanan validoinnin
  // sekä mahdollisen palvelinpäässä tapahtuvan tarkistuksen/lisäyksen ajan.
  // Kentät aktivoidaan validointivirheen tai palvelimen vastauksen tultua.
  this.registerUsername.disabled = true;
  this.registerPassword.disabled = true;
  this.registerDialogButton.disabled = true;
  // Jatka validointia hetken päästä, kun virhetekstikentät on ensin
  // tyhjennetty yllä. Lyhyen tauon tarkoitus on välittää käyttäjälle 
  // kokemus, että mahdollinen edellinen virheellinen syöte on kuitattu
  // ja järjestelmä suorittaa uuden syötetarkistuksen.
  setTimeout(function() {
   _this.Validate(); 
  }, 100);
}

// Avaa Rekisteröidy-linkkiä klikattaessa 
// käyttäjätunnuksen rekisteröinti-popup-ikkuna
RegisterDialog.prototype.Show = function() {
  $("#register-dialog").dialog("open");
  // Näytä ikkunan HTML-sisältö.
  // registerDialog.style.visibility = "visible";
}

// Jos rekisteröinti
RegisterDialog.prototype.OnDuplicateUsername = function(username) {
  // Ilmoita asiakkaalle varatusta käyttäjänimestä.
  this.registerUsernameValidity.textContent = "Käyttäjänimi \"" + username + "\" on varattu.";
  // Palauta kentät ja painike
  this.registerUsername.disabled = false;
  this.registerPassword.disabled = false;
  this.registerDialogButton.disabled = false;
}

RegisterDialog.prototype.OnSuccess = function(username) {
  var _this = this;
  this.registerDialogSuccess.textContent = "Luotiin käyttäjä \"" + username + "\"";
  $("#register-dialog").dialog("option", "buttons", 
    [ 
      { 
        text: "Jatka", 
        click: function() {
          // Sulje rekisteröinti-ikkuna.
          $("#register-dialog").dialog("close");
          // Palauta kentät vasta Sulje-painikkeen painalluksen jälkeen
          _this.registerUsername.disabled = false;
          _this.registerPassword.disabled = false;
        }
      } 
    ]
  );
  // Palauta painike
  this.registerDialogButton.disabled = false;
}


// Sisäänkirjaus-/rekisteröintisyötteen validointi
RegisterDialog.prototype.Validate = function() {
  var usernameField = this.isLoginValidation ? this.loginUsername : this.registerUsername;
  var passwordField = this.isLoginValidation ? this.loginPassword : this.registerPassword;
  var usernameValidityField = this.isLoginValidation ? this.loginUsernameValidity : this.registerUsernameValidity;
  var passwordValidityField = this.isLoginValidation ? this.loginPasswordValidity : this.registerPasswordValidity;
  // console.log(this, this.isLoginValidation, usernameValidityField);
  var isInputValid = true;
  var errorMsg;
  // Tarkista käyttäjänimikenttä. Kenttä ei saa olla tyhjä.
  try {
    errorMsg = "&nbsp;";
    if (!usernameField.value.length) {
      throw "Anna käyttäjänimi";
    }
  }
  catch (err) {
    // Käyttäjänimi on tyhjä
    errorMsg = err;
    isInputValid = false;
  }
  finally {
    // Näytä virheilmoitus.
    usernameValidityField.innerHTML = errorMsg;
  }

  // Jos käyttäjänimi on ok. tarkista salasanakenttä. 
  // Kentän minimimerkkimäärä on määritetty muuttujassa.
  if (isInputValid) {
    try {
      errorMsg = "&nbsp;";
      if (passwordField.value.length < this.minPasswordLength) {
        throw "Salasanan minimipituus on " + this.minPasswordLength + " merkkiä.";
      }
    }
    catch (err) {
      // Salasana on liian lyhyt
      errorMsg = err;
      isInputValid = false;
    }
    finally {
      // Näytä virheilmoitus
      passwordValidityField.innerHTML = errorMsg;
    }
  }
  if (isInputValid) { 
    // Jos käyttäjänimi ja salasana ovat ok, muodosta salasanasta 64
    // merkkiä pitkä SHA256-salaus-hash, jossa muodossa salasana 
    // lähetetään palvelimelle tietokantaan tallennettavaksi,
    // mikäli syötetty käyttäjänimi on vapaana.
    var hash = CryptoJS.SHA256(passwordField.value).toString();
    // Lähetä käyttäjänimi ja enkryptattu salasana palvelimelle.
    socket.emit("IoOnRegister", JSON.stringify({ username: usernameField.value, password: hash }));
    // Tyhjennä kentät. Sivu jää näkyviin odottamaan mahdollista
    // varatusta käyttäjänimestä johtuvaa palvelimen virheilmoitusta. 
    // Tällöin käyttäjä voi syöttää uuden käyttäjänimen ja salasanan
    // tyhjiin kenttiin.
    usernameField.value = "";
    passwordField.value = "";
  }
  else {
    // Validointi epäonnistui -> Palauta kentät ja painike
    usernameField.disabled = false;
    passwordField.disabled = false;
    this.registerDialogButton.disabled = false;
    // Tyhjennä salasanakenttä
    passwordField.value = "";
  }
}