var express = require('express');
var app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());

const api_users = require('./api_users');
const api_plumes = require('./api_plumes');
const api_rdvLecture = require('./api_rdvLecture');


//-----------------------DATABASE---------------------------------

const path = require('path');
const dbPath = path.resolve(__dirname, 'db_users_friends.db')

// Détermine le répertoire de base
//const basedir = path.normalize(path.dirname(__dirname));
//console.debug(`Base directory: ${basedir}`);

// Creation d'un objet Database et ouverture d'une connection
// en memoire à la base de données sqlite3. 
console.log('Création de la bases de donnees...');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    return console.error(err.message);
  }
  console.log("Connexion réussie à la base de données 'db_users_friends.db'");

/*
// Construction database en memoire
const db = new sqlite3.Database(':memory:', function(err){
    if (err) {
        return console.err('Erreur : ', err);
    }
*/

console.log('DB sqlite3 ready!');
});

/*
Elle est créée automatiquement si elle n’existe pas encore.
Après que ce code ait été exécuté, la variable “db” est un objet Database 
du module SQlite3 qui représente la connexion à la base de données.
Cet objet va servir par la suite à accéder au contenu de la base de données
et à effectuer des requêtes sur cette base de données.
*/


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
app.use('/plumes', api_plumes.default(db2)); // gestion des plumes avec mongoDB
app.use('/rdv', api_rdvLecture.default(db2)); // gestion des rdvLecture avec mongoDB


//-----------------------TESTS ROUTES---------------------------------

/*
app.route('/book')
  .get(function(req, res) {
    res.send('Get a random book');
  })
  .post(function(req, res) {
    res.send('Add a book');
  })
  .put(function(req, res) {
    res.send('Update the book');
  });
*/

//-----------------------TESTS ROUTES---------------------------------

// app.get('/', (req,res,next) => {
//     res.status(500);
//     next();
// });

// app.get('/', (req,res,next) => {
//     res.send('\nArnold');
//     next();
// });

// app.get('/bye', (req,res,next) => {
//     res.redirect('http://google.com');
//     next();
// });

// app.get('/about', (req,res,next) => {
//     res.send("C'est Alessia!");
//     next();
// });

//---------------------TRUCS CONNEXION 1------------------------------

// const cookieParser = require('cookie-parser');
// app.use(cookieParser());

// // set a cookie
// app.use(function (req, res, next) {
//     // check if client sent cookie
//     let cookie = req.cookies.cookieName;
//     if (cookie === undefined) {
//         // no: set a new cookie
//         var randomNumber=Math.random().toString();
//         randomNumber=randomNumber.substring(2,randomNumber.length);
//         res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
//         console.log('cookie created successfully');
//     } else {
//         // yes, cookie was already present 
//         console.log('Cookie exists', cookie);
//     } 
//     next();
// });
  
// let static middleware do its job
//app.use(express.static(__dirname + '/public'));

//---------------------TRUCS CONNEXION 2------------------------------

// express = require('express');
// const app = express()
// const session = require("express-session");

// app.use(session({
//     secret: "technoweb rocks"
// }));

//------------------------NE FONCTIONNE PAS---------------------------

// Fermeture de connexion au Database db
//db.close((err) => {
//    if (err) {
//        return console.err('Erreur : ', err);
//    }
//    console.log('Fermeture DB sqlite3 !');
//});

// // Gestion des erreurs
// app.use(function(err, req, res, next) {
//     res.status(500);
//     res.sender('error he he', {error : err});
// });

//--------------------------------------------------------------------

// Démarre le serveur
app.on('close', () => {
});

exports.default = app;

