class Users {
  constructor(db) {
    this.db = db

  const createUserTable = `CREATE TABLE IF NOT EXISTS users ( 
    login VARCHAR(50) NOT NULL PRIMARY KEY,
    password VARCHAR(50) NOT NULL,
    lastname VARCHAR(50) NOT NULL,
    firstname VARCHAR(50) NOT NULL
  )`; 
  db.exec(createUserTable, function(err){
    if(err){
      throw err;
    }
    console.log('User table ready');
  })
}

  // Implementée au TME4
  create(login, password, lastname, firstname) {
    return new Promise((resolve, reject) => {
      const insertUser = `INSERT INTO users VALUES ('${login}', '${password}', '${lastname}', '${firstname}')` ;
      
      //let userid = 1; // À remplacer par une requête bd
      this.db.exec(insertUser, function(err) {
        if (err) {
          //erreur
          reject(err);
        } else {
          resolve(login);
        }
      });
    });
  }

  get(userid) {
    return new Promise((resolve, reject) => {
      const user = {
         login: "pikachu",
         password: "1234",
         lastname: "chu",
         firstname: "pika"
      }; // À remplacer par une requête bd

      if(false) {
        //erreur
        reject();
      } else {
        if(userid == 1) {
          resolve(user);
        } else {
          resolve(null);
        }
      }
    });
  }

  async exists(login) {
    return new Promise((resolve, reject) => {
      const selectUser = `SELECT login FROM users WHERE login = '${login}'`;
      this.db.get(selectUser, function(err, row){
        if(err) {
          //erreur
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  checkpassword(login, password) {
    return new Promise((resolve, reject) => {
      //let userid = 1; // À remplacer par une requête bd
      const checkLoginPwd = `SELECT login FROM users WHERE login = '${login}' AND password = '$(password)'` ;
      this.db.get(checkLoginPwd, function(err, row){
        if(err) {
          //erreur
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

}

exports.default = Users;

