function RegisterDialog() {
  var _this = this;
  this.validityPlaceholderHTML = "&nbsp;";
  this.minPasswordLength = 8;

  // Socket.io callback, joka ottaa vastaan palvelimen lähettämän
  // vastauksen rekisteröintitoimintoon. 
  // registerData == { username: käyttäjänimi, result: true/false }, jossa
  // result-ominaisuuden arvo on true, mikäli käyttäjänimi oli vapaana
  // (= rekisteröinti onnistui) tai false, mikäli käyttäjänimi oli
  // varattu (= rekisteröinti epäonnistui)
  socket.on("IoOnRegisterResponse", function(registerData) { 
    _this.IoOnRegisterResponse(registerData);
  });

  // Rekisteröintikenttien elementtiviitteet
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
        click: function() {_this.OnRegisterButton(); }
      },
    ],
    close: function() {
      // Tyhjennä kentät ja validointiviestit, palauta painikkeen teksti 
      // sekä vapauta painikkeet popupin sulkeutuessa
      _this.registerUsername.value = "";
      _this.registerPassword.value = "";
      _this.registerUsername.disabled = false;
      _this.registerPassword.disabled = false;
      _this.registerUsernameValidity.innerHTML = _this.validityPlaceholderHTML;
      _this.registerPasswordValidity.innerHTML = _this.validityPlaceholderHTML;
      _this.registerDialogSuccess.textContent = "";
      $("#register-dialog").dialog("option", "buttons", 
        [{
          text: "Rekisteröidy", 
          click: function() {_this.OnRegisterButton(); }
        }]
      );
    },
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
  
  // Rekisteröintilinkin painikekuuntelija
  var registerLink = document.getElementById("register-link");
  registerLink.addEventListener("click", function() { _this.Show(); });
};

RegisterDialog.prototype.OnRegisterButton = function() {
  var _this = this;
  // Tyhjennä virheellisistä syötteistä ilmoittavat kentät
  this.registerUsernameValidity.innerHTML = "&nbsp;";
  this.registerPasswordValidity.innerHTML = "&nbsp;";
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
  }, 500);
};

// Avaa rekisteröintilinkkiä klikattaessa 
// käyttäjätunnuksen rekisteröinti-popup
RegisterDialog.prototype.Show = function() {
  $("#register-dialog").dialog("open");
  // Css-tyylitiedostossa rekisteröinti-ikkunan input-kentät
  // on piilotettu sivun latauksessa ilmenevän hetkellisen 
  // välähtämisen estämiseksi. Paljasta kentät vasta tässä.
  this.registerDialog.style.visibility = "visible";
};

// Palvelimelta tulleen asiakkaan käyttäjänimen rekisteröintipyynnön vastauskäsittely
RegisterDialog.prototype.IoOnRegisterResponse = function(registerData) {
  var _this = this;
  var parsedData = JSON.parse(registerData);
  var username = parsedData.username;
  var result = parsedData.result;

  if (result) {
    // Käyttäjänimen rekisteröinti onnistui
    this.registerDialogSuccess.textContent = "Luotiin käyttäjä \"" + username + "\"";
    $("#register-dialog").dialog("option", "buttons", 
      [{
        text: "Jatka", 
        click: function() {
          // Sulje rekisteröinti-ikkuna
          $("#register-dialog").dialog("close");
        }
      }]
    );
    // Palauta painike
    this.registerDialogButton.disabled = false;
  }
  else {
    // Rekisteröinti epäonnistui, ilmoita asiakkaalle varatusta käyttäjänimestä
    this.registerUsernameValidity.textContent = "Käyttäjänimi \"" + username + "\" on varattu.";
    // Palauta kentät ja painike
    this.registerUsername.disabled = false;
    this.registerPassword.disabled = false;
    this.registerDialogButton.disabled = false;
  }
};

// Rekisteröintisyötteen validointi
RegisterDialog.prototype.Validate = function() {
  var isInputValid = true;
  var errorMsg;
  // Tarkista käyttäjänimikenttä. Kenttä ei saa olla tyhjä.
  try {
    errorMsg = "&nbsp;";
    if (!this.registerUsername.value.length) {
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
    this.registerUsernameValidity.innerHTML = errorMsg;
  }

  // Jos käyttäjänimi on ok. tarkista salasanakenttä. 
  // Kentän minimimerkkimäärä on määritetty muuttujassa.
  if (isInputValid) {
    try {
      errorMsg = this.validityPlaceholderHTML;
      if (this.registerPassword.value.length < this.minPasswordLength) {
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
      this.registerPasswordValidity.innerHTML = errorMsg;
    }
  }
  if (isInputValid) { 
    // Jos käyttäjänimi ja salasana ovat ok, muodosta salasanasta 64
    // merkkiä pitkä SHA256-salaus-hash, jossa muodossa salasana 
    // lähetetään palvelimelle tietokantaan tallennettavaksi,
    // mikäli syötetty käyttäjänimi on vapaana.
    var hash = CryptoJS.SHA256(this.registerPassword.value).toString();
    // Lähetä käyttäjänimi ja enkryptattu salasana palvelimelle.
    socket.emit("IoOnRegister", JSON.stringify({ username: this.registerUsername.value, password: hash }));
    // Tyhjennä kentät. Sivu jää näkyviin odottamaan mahdollista
    // varatusta käyttäjänimestä johtuvaa palvelimen virheilmoitusta. 
    // Tällöin käyttäjä voi syöttää uuden käyttäjänimen ja salasanan
    // tyhjiin kenttiin.
    this.registerUsername.value = "";
    this.registerPassword.value = "";
  }
  else {
    // Validointi epäonnistui -> Palauta kentät ja painike
    this.registerUsername.disabled = false;
    this.registerPassword.disabled = false;
    this.registerDialogButton.disabled = false;
    // Tyhjennä salasanakenttä
    this.registerPassword.value = "";
  }
};