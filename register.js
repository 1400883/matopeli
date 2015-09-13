// Elementtiviittausmuuttujat
var loginUsername;
var loginPassword;
var loginUsernameValidity;
var loginPasswordValidity;
var loginButton;
var registerUsername;
var registerPassword;
var registerUsernameValidity;
var registerPasswordValidity;
var registerDialogButton;
var registerDialogSuccess;

var isLoginValidation;
var minPasswordLength = 8;

// Socket.io-asiakasolio
var socket = io();

// onload-metodi suoritetaan sivun latauduttua asiakasselaimeen
onload = function() {
  // Hae tarvittavat kenttien elementtiviitteet
  loginUsername = document.getElementById("login-username");
  loginPassword = document.getElementById("login-password");
  loginUsernameValidity = document.getElementById("login-username-validation");
  loginPasswordValidity = document.getElementById("login-password-validation");
  loginButton = document.getElementById("login-button");

  registerUsername = document.getElementById("register-username");
  registerPassword = document.getElementById("register-password");
  registerUsernameValidity = document.getElementById("register-username-validation");
  registerPasswordValidity = document.getElementById("register-password-validation");

  var registerLink = document.getElementById("register-link");
  registerLink.addEventListener("click", OnRegisterDialog);
  registerDialog = document.getElementById("register-dialog");
  $("#register-dialog").dialog({
    autoOpen: false,
    draggable: false,
    resizable: false,
    modal: true,
    buttons: [
      {
        text: "Rekisteröidy",
        click: OnRegisterButton
      },
    ],
    width: 450
  });

  registerDialogSuccess = document.createElement("div");
  registerDialogSuccess.setAttribute("id", "register-success-text");
  document.getElementsByClassName("ui-dialog-buttonpane")[0].insertBefore(
    registerDialogSuccess, 
    document.getElementsByClassName("ui-dialog-buttonset")[0]);
  registerDialogButton = document.getElementsByClassName("ui-dialog-buttonset")[0].getElementsByTagName("button")[0];
  setTimeout(CreateGame, 10);
}

function OnRegisterButton() {
  console.log("reg");
  // Tyhjennä virheellisistä syötteistä ilmoittavat kentät
  registerUsernameValidity.textContent = "";
  registerPasswordValidity.textContent = "";
  // Rekistöintisyötteen - ei sisäänkirjautumisen - validointi
  isLoginValidation = false;
  // Poista kentät ja painike käytöstä käyttäjänimen ja salasanan validoinnin
  // sekä mahdollisen palvelinpäässä tapahtuvan tarkistuksen/lisäyksen ajan.
  // Kentät aktivoidaan validointivirheen tai palvelimen vastauksen tultua.
  registerUsername.disabled = true;
  registerPassword.disabled = true;
  registerDialogButton.disabled = true;
  // Jatka validointia hetken päästä, kun virhetekstikentät on ensin
  // tyhjennetty yllä. Lyhyen tauon tarkoitus on välittää käyttäjälle 
  // kokemus, että mahdollinen edellinen virheellinen syöte on kuitattu
  // ja järjestelmä suorittaa uuden syötetarkistuksen.
  setTimeout(Validate, 100);
}

// Avaa Rekisteröidy-linkkiä klikattaessa 
// käyttäjätunnuksen rekisteröinti-popup-ikkuna
function OnRegisterDialog() {
  $("#register-dialog").dialog("open");
  // Näytä ikkunan HTML-sisältö.
  // registerDialog.style.visibility = "visible";
}

// Onnistuneen rekisteröinnin jälkeen Jatka-painikkeen
// kutsuma metodi.
function OnContinueToGame() {
  // Sulje rekisteröinti-ikkuna.
  $("#register-dialog").dialog("close");
}

// Socket.io:n palvelimeen kytkeytymis-callback
socket.on("connect", function() {
  console.log("Yhteys palvelimeen muodostettu");
});

// Socket.io callback, joka ottaa vastaan palvelimen lähettämän
// viestin, mikäli syötetty käyttäjänimi on jo tietokannassa.
socket.on("OnDuplicateUsername", function(username) {
  // Ilmoita asiakkaalle varatusta käyttäjänimestä.
  registerUsernameValidity.textContent = "Käyttäjänimi \"" + username + "\" on varattu."
  // Palauta kentät ja painike
  registerUsername.disabled = false;
  registerPassword.disabled = false;
  registerDialogButton.disabled = false;
});

// Socket.io callback, johon palvelin viestittää onnistuneesta 
// käyttäjätunnuksen rekisteröinnistä.
socket.on("OnRegisterSuccess", function(username) {
  registerDialogSuccess.textContent = "Luotiin käyttäjä \"" + username + "\"";
  $("#register-dialog").dialog("option", "buttons", 
    [ 
      { 
        text: "Jatka", 
        click: OnContinueToGame
      } 
    ]
  );
  // Palauta kentät ja painike
  registerUsername.disabled = false;
  registerPassword.disabled = false;
  registerDialogButton.disabled = false;
});

// Sisäänkirjaus-/rekisteröintisyötteen validointi
function Validate() {
  var usernameField = isLoginValidation ? loginUsername : registerUsername
  var passwordField = isLoginValidation ? loginPassword : registerPassword
  var usernameValidityField = isLoginValidation ? loginUsernameValidity : registerUsernameValidity
  var passwordValidityField = isLoginValidation ? loginPasswordValidity : registerPasswordValidity
  
  var isInputValid = true;
  var errorMsg;
  // Tarkista käyttäjänimikenttä. Kenttä ei saa olla tyhjä.
  try {
    errorMsg = "";
    if (!usernameField.value.length) {
      throw "Anna käyttäjänimi";
    }
  }
  catch(err) {
    // Käyttäjänimi on tyhjä
    errorMsg = err;
    isInputValid = false;
  }
  finally {
    // Näytä virheilmoitus.
    usernameValidityField.textContent = errorMsg;
  }

  // Jos käyttäjänimi on ok. tarkista salasanakenttä. 
  // Kentän minimimerkkimäärä on määritetty muuttujassa.
  if (isInputValid) {
    try {
      errorMsg = "";
      if (passwordField.value.length < minPasswordLength) {
        throw "Salasanan minimipituus on " + minPasswordLength + " merkkiä.";
      }
    }
    catch(err) {
      // Salasana on liian lyhyt
      errorMsg = err;
      isInputValid = false;
    }
    finally {
      // Näytä virheilmoitus
      passwordValidityField.textContent = errorMsg;
    }
  }

  if (isInputValid) {
    
    // Jos käyttäjänimi ja salasana ovat ok, muodosta salasanasta 64
    // merkkiä pitkä SHA256-salaus-hash, jossa muodossa salasana 
    // lähetetään palvelimelle tietokantaan tallennettavaksi,
    // mikäli syötetty käyttäjänimi on vapaana.
    var hash = CryptoJS.SHA256(passwordField.value).toString();
    // Lähetä käyttäjänimi ja enkryptattu salasana palvelimelle.
    socket.emit("OnIoRegister", JSON.stringify({ username: usernameField.value, password: hash }));
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
    registerDialogButton.disabled = false;
    // Tyhjennä salasanakenttä
    passwordField.value = "";
  }
}