class Friends {

  // Constructeur de la classe Friends (instanciation): creation d'une table 'friends'
  // constituée des champs id (autoincremental), login, password, lastname (nom), firstname (prenom) A MODIFIER!!!!!!!!!
  constructor(db) {
    this.db = db

    const createFriendsTable = `CREATE TABLE IF NOT EXISTS "friends" (
      "id1"	INTEGER NOT NULL,
      "id2"	INTEGER NOT NULL,
      "demanding" INTEGER NOT NULL,
      "accepting" INTEGER NOT NULL,
      PRIMARY KEY("id1" , "id2")
    )`;
    db.exec(createFriendsTable, function(err){
      if(err){
        throw err;
      }
      console.log('Friends table ready');
    })
    
  }

  async existsFriendship(id1,id2) {
    return new Promise((resolve, reject) => {
      const selectFriends = `SELECT id1 FROM friends WHERE (id1 = '${id1}' AND id2 = '${id2}') OR (id1 = '${id2}' AND id2 = '${id1}') AND demanding = 1 AND accepting = 1`;
      this.db.get(selectFriends, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  async existsDemanding(id1,id2) {
    return new Promise((resolve, reject) => {
      const selectFriends = `SELECT id1 FROM friends WHERE id1 = '${id1}' AND id2 = '${id2}' AND demanding = 1 AND accepting = 0 `;
      this.db.get(selectFriends, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  addFriend(id1, id2) {
    return new Promise((resolve, reject) => {
      if (id1 === undefined || id2 === undefined){
        console.log("id undefined");
        return;
      }
      const sql_addF = `INSERT INTO friends (id1, id2, demanding, accepting) VALUES ('${id1}', '${id2}', 1, 0 )` ;
      this.db.exec(sql_addF, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(id1);  
        }  
      })
    });
  }

  acceptFriend(id1, id2) {
    return new Promise((resolve, reject) => {
      if (id1 === undefined || id2 === undefined){
        console.log("id undefined");
        return;
      }
      const sql_accF = `UPDATE friends SET accepting = 1 WHERE id1 = '${id2}' AND id2 = '${id1}'` ;
      this.db.exec(sql_accF, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(id1);  
        }  
      })
    });
  }

  rejectFriend(id1, id2) {
    return new Promise((resolve, reject) => {
      if (id1 === undefined || id2 === undefined){
        console.log("id undefined");
        return;
      }
      const sql_rejF = `DELETE FROM friends WHERE id1 = '${id2}' AND id2 = '${id1}'` ;
      this.db.exec(sql_rejF, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(id1);  
        }  
      })
    });
  }

  rejectFriendship(id1, id2) {
    return new Promise((resolve, reject) => {
      if (id1 === undefined || id2 === undefined){
        console.log("id undefined");
        return;
      }
      const sql_rejF = `DELETE FROM friends WHERE (id1 = '${id1}' AND id2 = '${id2}') OR (id1 = '${id2}' AND id2 = '${id1}')` ;
      this.db.exec(sql_rejF, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(id1);  
        }  
      })
    });
  }

  getFriendsList(id) {
    return new Promise((resolve, reject) => {
      const sql_FrList = `SELECT id1, id2 FROM friends WHERE ( id1 = '${id}' OR id2 = '${id}' ) AND demanding = 1 AND accepting = 1 `;
      this.db.all(sql_FrList, function(err, rows){
        if(err) {
          reject(err);
        } else {
          var tab = [];
          if (rows != undefined){ 
            rows.forEach((row) => {
              if (row.id1 === id){
                tab.push(row.id2);
              } else {
                tab.push(row.id1);
              }
            })
            resolve(tab);
          }
        }
      });
    });
  }

}

exports.default = Friends;

