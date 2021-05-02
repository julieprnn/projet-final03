class Followers {

  constructor(db) {
    this.db = db

    const createFollowersTable = `CREATE TABLE IF NOT EXISTS "followers" (
      "id1"	INTEGER NOT NULL,
      "id2"	INTEGER NOT NULL,
      "entity" VARCHAR(50) NOT NULL,
      PRIMARY KEY ("id1" , "id2", "entity")
      FOREIGN KEY ("id1") REFERENCES "users" ("id") ON DELETE CASCADE
    )`;
    db.exec(createFollowersTable, function(err){
      if(err){
        throw err;
      }
      console.log('Followers table ready');
    })
    
  }

  alreadyFollowed(id1,id2, entity) {
    return new Promise((resolve, reject) => {
      const query = `SELECT id1 FROM followers WHERE id1 = '${id1}' AND id2 = '${id2}' AND entity = '${entity}'`;
      this.db.get(query, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  follow(id1, id2, entity) {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO followers (id1, id2, entity) VALUES ('${id1}', '${id2}', '${entity}')` ;
      this.db.exec(query, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(id1);  
        }  
      })
    });
  }

  unFollow(id1, id2, entity) {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM followers WHERE id1 = '${id1}' AND id2 = '${id2}' AND entity = '${entity}'` ;
      this.db.exec(query, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(id1);  
        }  
      })
    });
  }

  getFollowedList(id, entity) { 
    return new Promise((resolve, reject) => {
      const query = `SELECT id1 FROM followers WHERE id2 = '${id}' AND entity = '${entity}'`;
      this.db.all(query, function(err, rows){
        if(err) {
          reject(err);
        } else {
          var tab = [];
          if (rows != undefined){ 
            rows.forEach((row) => {
                tab.push(row.id1);
            })
            resolve(tab);
          }
        }
      });
    });
  }

  getFollowersList(idEntity, entity) { 
    return new Promise((resolve, reject) => {
      const query = `SELECT id1 FROM followers WHERE id2 = '${idEntity}' AND entity = '${entity}'`;
      this.db.all(query, function(err, rows){
        if(err) {
          reject(err);
        } else {
          var tab = [];
          if (rows != undefined){ 
            rows.forEach((row) => {
                tab.push(row.id1);
            })
            resolve(tab);
          }
        }
      });
    });
  }

}

exports.default = Followers;

