var express = require('express');
var app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const api_users = require('./api/api_users');
const api_authors_books = require('./api/api_authors_books');
const api_plumes = require('./api/api_plumes');
const api_rdvLecture = require('./api/api_rdvLecture');



//----------------------INITIALISATION DATABASE SQLITE3----------------------

const path = require('path');
const dbPath = path.resolve(__dirname, 'db_SQLite.db')

console.log('Création de la bases de donnees SQLite...');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connexion à SQLite3 réussie !");
});


//----------------------INITIALISATION DATABASE MONGODB----------------------

console.log('Création de la bases de donnees MongoDB...');
const db2 = require('mongoose');
db2.connect('mongodb+srv://user01:mongoBirdy@mongobirdy.o6ci8.mongodb.net/BirdyDB?retryWrites=true&w=majority',
{ useNewUrlParser: true,
useUnifiedTopology: true })
.then(()=> console.log('Connexion à Mongo DB réussie!'))
.catch(()=> console.log('Connexion à MongoDB échouée!'));


//--------------------------DEFINITION ROUTES BIRDY--------------------------

app.get('/', (req,res,next) => {
    res.send('Ceci est la home de Birdy');
    next();
});

app.use('/users', api_users.default(db)); // gestion des users, friends, followers avec sqlite3
app.use('/birdy', api_authors_books.default(db)); // gestion des authors et des livres avec sqlite3
app.use('/plumes', api_plumes.default(db2)); // gestion des plumes avec mongoDB
app.use('/rdv', api_rdvLecture.default(db2)); // gestion des rdvLecture avec mongoDB


//---------------------------------------------------------------------------

// Démarre le serveur
app.on('close', () => {
});

exports.default = app;

