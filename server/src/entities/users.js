class Users {

  // Constructeur de la classe Users (instanciation): creation d'une table 'users'
  // constituée des champs id (autoincremental), login, password, lastname (nom), firstname (prenom)
  constructor(db) {
    this.db = db

    const createUserTable = `CREATE TABLE IF NOT EXISTS "users" (
      "id"	INTEGER,
      "login"	VARCHAR(50) NOT NULL,
      "password"	VARCHAR(50) NOT NULL,
      "lastname"	VARCHAR(50) NOT NULL,
      "firstname"	VARCHAR(50) NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    )`;
    db.exec(createUserTable, function(err){
      if(err){
        throw err;
      }
      console.log('User table ready');
    })

    const createAuthorsTable = `CREATE TABLE IF NOT EXISTS "authors" (
      "id"	INTEGER,
      "lastname"	VARCHAR(50),
      "firstname"	VARCHAR(50),
      "alias" VARCHAR(50),
      PRIMARY KEY("id" AUTOINCREMENT)
    )`;
    db.exec(createAuthorsTable, function(err){
      if(err){
        throw err;
      }
      console.log('Authors table ready');
    })

    const createBooksTable = `CREATE TABLE IF NOT EXISTS "books" (
      "id"	INTEGER,
      "id_author" INTEGER NOT NULL,
      "title"	VARCHAR(50) NOT NULL,
      PRIMARY KEY("id" AUTOINCREMENT)
    )`;
    db.exec(createBooksTable, function(err){
      if(err){
        throw err;
      }
      console.log('Books table ready');
    })

    const createNotificationsTable = `CREATE TABLE IF NOT EXISTS "notifications" (
      "id"	INTEGER,
      "userId" INTEGER NOT NULL,
      "text"	VARCHAR(50) NOT NULL,
      "date" TEXT,
      PRIMARY KEY("id" AUTOINCREMENT)
    )`;
    db.exec(createNotificationsTable, function(err){
      if(err){
        throw err;
      }
      console.log('Notifications table ready');
    })
  }

  create(login, password, lastname, firstname) {
    return new Promise((resolve, reject) => {
      const insertUser = `INSERT INTO users (id, login, password, lastname, firstname) VALUES (null, '${login}', '${password}', '${lastname}', '${firstname}')` ;
      this.db.exec(insertUser, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(login);
        }
      });
    });
  }
  
  getIdUser(login) {
    return new Promise((resolve, reject) => {
      console.log('eheheh');
      const sql_id = `SELECT id FROM users WHERE login = '${login}'`;
      this.db.get(sql_id, function(err, row){
        if(err) {
          reject(err);
        } else {
          if (row === undefined){
            resolve(row != undefined);
          } else {
            resolve(row.id);
          } 
        }
      })
    });
  }

  getIdEntity(entity_id, entity) {
    return new Promise((resolve, reject) => {
      const query = `SELECT id FROM '${entity}' WHERE id = '${entity_id}'`;
      this.db.get(query, function(err, row){
        if(err) {
          reject(err);
        } else {
          if (row === undefined){
            resolve(row != undefined);
          } else {
            resolve(row.id);
          } 
        }
      })
    });
  }

  exists(login) {
    return new Promise((resolve, reject) => {
      const selectUser = `SELECT login FROM users WHERE login = '${login}'`;
      this.db.get(selectUser, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  entityExists(entity_id, entity) {
    return new Promise((resolve, reject) => {
      const selectUser = `SELECT * FROM '${entity}' WHERE id = '${entity_id}'`;
      this.db.get(selectUser, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }
  
  checkpassword(login, password) {
    return new Promise((resolve, reject) => {
      const checkLoginPwd = `SELECT id FROM users WHERE login = '${login}' AND password = '${password}'` ; 
      this.db.get(checkLoginPwd, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  modifyUser(login, password, new_password) {
    return new Promise((resolve, reject) => {
      const mod = `UPDATE users SET password = '${new_password}' WHERE login = '${login}' AND password = '${password}'` ;
      this.db.exec(mod, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(login);  
        }  
      })
    });
  }

  deleteUser(login, password) {
    return new Promise((resolve, reject) => {
      const del = `DELETE FROM users WHERE login = '${login}' AND password = '${password}'` ;
      this.db.exec(del, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(login);  
        }  
      })
    });
  }

//---------------------------------------------------------------

  createAuthor(firstname, lastname, alias) {
    return new Promise((resolve, reject) => {
      let insertUser;
      console.log(firstname, lastname, alias);
      if (alias != undefined){
        if (lastname != undefined){
          console.log("alors", firstname, lastname, alias);
          insertUser = `INSERT INTO authors (id, firstname, lastname, alias) VALUES (null, '${firstname}', '${lastname}', '${alias}')` ;
        } else {
          console.log("alors", alias);
          insertUser = `INSERT INTO authors (id, firstname, lastname, alias) VALUES (null, null, null, '${alias}')` ;
        }
      } else {
        console.log("alors", firstname, lastname);
        insertUser = `INSERT INTO authors (id, firstname, lastname, alias) VALUES (null, '${firstname}', '${lastname}', null )` ;
      }
      console.log(insertUser);
      this.db.exec(insertUser, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  getIdAuthor(firstname, lastname, alias) {
    return new Promise((resolve, reject) => {
      const sql_id = `SELECT id FROM authors WHERE (firstname = '${firstname}' AND lastname = '${lastname}') OR alias = '${alias}'`;
      this.db.get(sql_id, function(err, row){
        if(err) {
          reject(err);
        } else {
          if (row === undefined){
            resolve(row != undefined);
          } else {
            resolve(row.id);
          }
        }  
      })
    });
  }

  createBook(id_author, title) {
    return new Promise((resolve, reject) => {
      const insertUser = `INSERT INTO books (id, id_author, title) VALUES (null, '${id_author}', '${title}')` ;
      this.db.exec(insertUser, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  getIdBook(id_author, title) {
    return new Promise((resolve, reject) => {
      const sql_id = `SELECT id FROM books WHERE id_author = '${id_author}' AND title = '${title}'`;
      this.db.get(sql_id, function(err, row){
        if(err) {
          reject(err);
        } else {
          if (row === undefined){
            resolve(row != undefined);
          } else {
            resolve(row.id);
          }
        }
      })
    });
  }

  getEntitiesList(entity) { 
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM '${entity}'`;
      this.db.all(query, function(err, rows){
        if(err) {
          reject(err);
        } else {
          var tab = [];
          if (rows != undefined){ 
            rows.forEach((row) => {
                tab.push(JSON.stringify(row));
            })
            resolve(tab);
          }
        }
      });
    });
  }

  addNotification(userId, text) {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO notifications (id, userId, text, date) VALUES (null, '${userId}', '${text}', datetime('now', 'localtime'))` ;
      this.db.exec(query, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  getNotificationsList(userId) { 
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM notifications WHERE userId = '${userId}' ORDER BY date DESC`; //works?
      this.db.all(query, function(err, rows){
        if(err) {
          reject(err);
        } else {
          var tab = [];
          if (rows != undefined){ 
            rows.forEach((row) => {
                tab.push(JSON.stringify(row));
            })
            resolve(tab);
          }
        }
      });
    });
  }

  deleteNotificationsList(userId, n) { // n nombre notif a laisser
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM notifications WHERE ROWID IN (SELECT ROWID FROM notifications WHERE userId = '${userId}' ORDER BY ROWID DESC LIMIT -1 OFFSET '${n}') ` ;
      this.db.exec(query, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(userId);  
        }  
      })
    });
  }



}






exports.default = Users;

