DROP DATABASE IF EXISTS matopeli;
CREATE DATABASE matopeli;

USE matopeli;

CREATE TABLE user (
  id INT AUTO_INCREMENT,
  name varchar(15) NOT NULL,
  password char(64) NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

INSERT INTO user (name, password) VALUES ("nimetön")
CREATE TABLE topscore (
	id INT AUTO_INCREMENT,
	user INT NOT NULL,
	score INT NOT NULL,
	boardsize INT NOT NULL,
	speed INT NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY (user) 
		REFERENCES user(id)
		ON DELETE CASCADE
		ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chat (
	id INT AUTO_INCREMENT,
	msg varchar(120) NOT NULL,
	sender varchar(15) NOT NULL,
	PRIMARY KEY (id)
) ENGINE=InnoDB;