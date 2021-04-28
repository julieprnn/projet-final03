const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(':memory:');

// On met la requete SQLite dans une constante
const req1 = `
  CREATE TABLE IF NOT EXISTS users(
    login VARCHAR(256) NOT NULL PRIMARY KEY,
    password VARCHAR(256) NOT NULL,
    lastname VARCHAR(256) NOT NULL,
    firstname VARCHAR(256) NOT NULL);
`;
// exec() permet d'executer la requete req1
db.exec(req1, (err) => {
  if(err) {
    throw err;
  }
});

const req2 = `
  CREATE TABLE IF NOT EXISTS followers(
    login VARCHAR(256),
    login_follower VARCHAR(256),
    timestamp TIMESTAMP,
    PRIMARY KEY ('login', 'login_follower')
  );
`;
db.exec(req2, (err) => {
  if(err) {
    throw err;
  }
});

const req3 = db.prepare(`
  INSERT INTO users VALUES(?, ?, ?, ?);
`);
req3.run(['pikachu', '1234', 'chu',  'pika'], (err) => {
  if(err) {
    throw err;
  } else {
    console.log('pikachu : ' + req3.lastID);
  }
});

const req3b = db.prepare(`
  INSERT INTO users VALUES(?, ?, ?, ?);
`);
req3b.run(['goldorak', '12345', 'rak',  'goldo'], (err) => {
  if(err) {
    throw err;
  } else {
    console.log('goldorak : ' + req3b.lastID);
  }
});



const req4 = db.prepare(`
  SELECT login FROM users WHERE login=?;
`);
req4.run(['pikachu'], (err, row) => {
  if(err) {
    console.log('Erreur SQL: ', err);
    throw err;
  } else {
    console.log(row);
    console.log(row != undefined);
  }
});

const req = `
  SELECT * FROM users
  WHERE lastname < 'toto'
`;

db.all(req, [], (err, rows) => {
  if(err) {
    throw err;
  }
  rows.forEach( (row) => {
    console.log(row);
  });
});


