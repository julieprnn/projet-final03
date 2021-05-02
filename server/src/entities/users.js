class Users {

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

  getUser(login) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM users WHERE login = '${login}'`;
      this.db.get(query, function(err, row){
        if(err) {
          reject(err);
        } else {
          if (row === undefined){
            resolve(row != undefined);
          } else {
            resolve(JSON.stringify(row));
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
  
  checkpassword(login, password) {
    return new Promise((resolve, reject) => {
      const query = `SELECT id FROM users WHERE login = '${login}' AND password = '${password}'` ; 
      this.db.get(query, function(err, row){
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
      const query = `UPDATE users SET password = '${new_password}' WHERE login = '${login}' AND password = '${password}'` ;
      this.db.exec(query, function(err, row){
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

  deleteNotificationsList(userId, n) { // n = nombre de notifications à laisser
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

