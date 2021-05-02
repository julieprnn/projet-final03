class Friends {

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
      const query = `SELECT id1 FROM friends WHERE (id1 = '${id1}' AND id2 = '${id2}') OR (id1 = '${id2}' AND id2 = '${id1}') AND demanding = 1 AND accepting = 1`;
      this.db.get(query, function(err, row){
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
      const query = `SELECT id1 FROM friends WHERE id1 = '${id1}' AND id2 = '${id2}' AND demanding = 1 AND accepting = 0 `;
      this.db.get(query, function(err, row){
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
        return;
      }
      const query = `INSERT INTO friends (id1, id2, demanding, accepting) VALUES ('${id1}', '${id2}', 1, 0 )` ;
      this.db.exec(query, function(err, row){
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
        return;
      }
      const query = `UPDATE friends SET accepting = 1 WHERE id1 = '${id2}' AND id2 = '${id1}'` ;
      this.db.exec(query, function(err, row){
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
        return;
      }
      const query = `DELETE FROM friends WHERE id1 = '${id2}' AND id2 = '${id1}'` ;
      this.db.exec(query, function(err, row){
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
        return;
      }
      const query = `DELETE FROM friends WHERE (id1 = '${id1}' AND id2 = '${id2}') OR (id1 = '${id2}' AND id2 = '${id1}')` ;
      this.db.exec(query, function(err, row){
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
      const query = `SELECT id1, id2 FROM friends WHERE ( id1 = '${id}' OR id2 = '${id}' ) AND demanding = 1 AND accepting = 1 `;
      this.db.all(query, function(err, rows){
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

