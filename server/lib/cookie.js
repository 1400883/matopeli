// Sisäänkirjauskeksin nimi ja arvon hakemis -regex-pattern
var cookieName = "R4_WormGame";
var cookieRegex = new RegExp("^.*" + cookieName + "=(\\d+).*$");
var authentication;
var login;

function Cookie(authenticationReference, loginReference) {
  authentication = authenticationReference;
  login = loginReference;

  this.cookieRegex = cookieRegex;
  this.cookieName = cookieName;
  this.IoOnCookieResponse = IoOnCookieResponse;
  this.GetClientCookie = GetClientCookie;
  this.IsKnownCookie = IsKnownCookie;
  this.CreateUniqueCookie = CreateUniqueCookie;
}

function IoOnCookieResponse(socket, data) {
  var parsedData = JSON.parse(data);
  var cookie = parsedData.cookie;
  var id = parsedData.id;
  if (cookie != null) {
    // Etsi asiakkaan keksin arvolla avainta autentikointioliosta
    var isKey = false;
    for (key in authentication.clientData) {
      if (key == cookie) {
        isKey = true;
        break;
      }
    }
    if (isKey) {
      // Tallenna keksiavaimen arvolla asiakkaan socketin päivitetty id
      authentication.clientData[cookie].id = id;
      console.log("Keksi ja avain löytyivät. id:", id);
      // Lähetä asiakkaalle autentikointioliosta keksiä vastaava käyttäjänimi,
      // joka on merkkijono (== vanha validi keksi identifioi jo sisäänkirjautuneen 
      // käyttäjän) tai undefined (== uutta keksiä vastaavaa sisäänkirjausta ei ole)
      login.UpdateClientLoginState(socket, cookie);
    }
    else {
      // Keksiavainta ei löytynyt!
      // Normaalitilanteessa palvelin on tallentanut keksiavaimen
      // HTTP GET -pyynnön yhteydessä asiakkaalle uutta keksiä
      // luotaessa.
      // Keksiavaimen puuttuminen ilmenee tilanteessa, jossa
      // asiakasselain on aiemmin saanut keksin ja pitää sitä
      // edelleen hallussaan ja pelipalvelin on
      // uudelleenkäynnistyksen yhteydessä menettänyt autentikointi-
      // olionsa datan.
      // Pakota selain lataamaan sivu uudelleen, jolloin tunnistamaton
      // keksi ylikirjoitetaan HTTP GET -pyyntöön vastattaessa.
      socket.emit("IoOnReloadRequest");
      console.log("Pakota uudelleenlataus. Syy: puuttuva keksiavain.");
    }
  }
  else {
    // Asiakasselaimella ei ole matopelin keksiä!
    // Normaalitilanteessa tässä vaiheessa selain on tehnyt
    // palvelimelle HTTP GET -sivupyynnön ja keksi on lähetetty
    // asiakasselaimelle.
    // Keksin puuttuminen voi johtua siitä, että selainkeksi on 
    // poistettu manuaalisesti ja asiakkaalla avoinna olevan 
    // pelisivun socket.io-plugin reagoi automaattisesti
    // palvelimen uudelleenkäynnistyksen yhteydessä.
    // Skenaario on tosielämässä harvinainen, mutta mahdollinen.
    // Pakota tällöin selain lataamaan sivu uudelleen, mikä
    // luo GET-pyynnön ja välittää asiakkaalle uuden keksin.
    socket.emit("IoOnReloadRequest", "Missing cookie");
    console.log("Pakota uudelleenlataus. Syy: puuttuva keksi.");
  }
};

function GetClientCookie(req) {
  // Hae asiakkaan selaimen HTTP-pyynnön headerissa
  // välittämistä kekseistä sisäänkirjauskeksin arvoa
  var cookies = req.headers.cookie;
  return cookies && cookies.match(cookieRegex) != null
    ? cookies.replace(cookieRegex, "$1") // Löytyi
    : null; // Ei löytynyt
};

function IsKnownCookie(cookie) {
  for (key in authentication.clientData)
    if (key == cookie) {
      console.log("Keksi on tunnettu.");
      return true;
    }
  console.log("Keksi on tuntematon.");
  return false;
};

function CreateUniqueCookie() {
  var cookie;
  var isDuplicate = false;
  while (true) {
    // Luo sattumanvarainen ~ 20 merkkiä pitkä numeerinen keksiarvo
    cookie =  Math.abs(HashCode(Math.random().toString())).toString() +
              Math.abs(HashCode(Math.random().toString())).toString();
    // Duplikaattitarkistus. Kaksoiskappaleen todennäköisyys on häviävän
    // pieni, mutta pakko tehdä.
    for (key in authentication.clientData) {
      if (key == cookie) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate)
      // Keksiarvo on uniikki
      break;
    else
      isDuplicate = false;
  }
  // Alusta sisäänkirjaustila
  authentication.clientData[cookie] = { loginName: null };
  console.log("Luotiin uusi keksi:", cookie);
  return cookie;
};

// http://stackoverflow.com/a/15710692
function HashCode(string) {
  return string.split("").reduce(
    function(a, b) {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
};

module.exports = Cookie;