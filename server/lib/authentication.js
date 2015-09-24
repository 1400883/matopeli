var clientData = {};
function Authentication() {
  // clientData-olion rakenne:
  // keksiarvo: { id: asiakasId, loginName: käyttäjänimi/null }
  // jossa
  // - keksiarvo: on ~ 20 merkkiä pitkä uniikki numeerinen palvelimen 
  //   luoma satunnaisluku-hash, joka tallennetaan selaimen keksin arvoksi.
  // - id: pelisivun latauskertojen välillä vaihtuva asiakaspään
  //   socket.io:n määrittämä id.
  // - loginName: sisäänkirjautuneen asiakkaan käyttäjänimi. 
  //   null == ei-sisäänkirjautunut anonyymi käyttäjä
  this.clientData = clientData;
}

module.exports = Authentication;