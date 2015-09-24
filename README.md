# Matopeli

Tähän haaraan matopelin lähdekoodi

Dokumentaatiolle on oma haaransa:  
https://github.com/1400883/matopeli/tree/dokumentaatio

# Asennus

Etene seuraavien vaiheiden mukaan:
- Asenna ensimmäiseksi koneellesi NodeJS ympäristö: https://nodejs.org/en/download/
- Seuraavaksi lataa repository koneellesi haluamaasi kansioon.
- Avaa komentokehoite (CMD) vaikka Windows hakuvalikosta ja etsi kansio komennoilla esimerkiksi näin:
1. Etsitään oikea asema kirjoittamalla aseman kirjain ja kaksoispiste: "G:"
2. Mennään oikeaan kansioon "cd" komennolla, "cd Koodausta" -> "cd Verkkosovelluskehitys" -> "cd matopeli"
- Asennetaan oikeat Node moduulit suorittamalla komento "npm install" tai "npm install package.json"

Näiden vaiheiden jälkeen käynnistetään palvelu menemällä /Server/ kansioon ja startataan "Server.js" palvelu komennolla "node server.js".

## MySQL

Palvelu tarvitsee rekisteröitymistä, chattia, sekä huippupisteitä varten MySQL palvelimen, jonka asennustiedosto voidaan hakeaa täältä:
http://dev.mysql.com/downloads/windows/installer/

Kun MySQL ohjelmisto on asennettu avaa se ja tee uusi "instanssi" ja avaa yhteys. Yhteyden avauksen jälkeen aukeaa "Workbench" ja valitse "File" -> "Open SQL Script..." ja etsi db.sql tiedosto kansiosta /Matopeli/Server/db/db.sql.
