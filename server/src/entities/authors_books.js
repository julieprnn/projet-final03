class AuthorsBooks {

  constructor(db) {
    this.db = db
  
    const createAuthorsTable = `CREATE TABLE IF NOT EXISTS "authors" (
      "id"	INTEGER,
      "lastname"	VARCHAR(50),
      "firstname"	VARCHAR(50),
      "alias" VARCHAR(50),
      "biography" VARCHAR(1000),
      "image" VARCHAR(50),
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
      "image" VARCHAR(50),
      PRIMARY KEY("id" AUTOINCREMENT)
    )`;
    db.exec(createBooksTable, function(err){
      if(err){
        throw err;
      }
      console.log('Books table ready');
    })
  
  }

  createAuthor(firstname, lastname, alias, biography, image) {
    return new Promise((resolve, reject) => {
      let query;
      if (alias != undefined){
        if (lastname != undefined){
          query = `INSERT INTO authors (id, firstname, lastname, alias, biography, image) VALUES (null, '${firstname}', '${lastname}', '${alias}', '${biography}', '${image}')` ;
        } else {
          query = `INSERT INTO authors (id, firstname, lastname, alias, biography, image) VALUES (null, null, null, '${alias}', '${biography}', '${image}')` ;
        }
      } else {
        query = `INSERT INTO authors (id, firstname, lastname, alias, biography, image) VALUES (null, '${firstname}', '${lastname}', null, '${biography}', '${image}' )` ;
      }
      this.db.exec(query, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  createBook(id_author, title, image) {
    return new Promise((resolve, reject) => {
      const query = `INSERT INTO books (id, id_author, title, image) VALUES (null, '${id_author}', '${title}', '${image}')` ;
      this.db.exec(query, function(err) {
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
      const query = `SELECT id FROM authors WHERE (firstname = '${firstname}' AND lastname = '${lastname}') OR alias = '${alias}'`;
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

  getIdBook(id_author, title) {
    return new Promise((resolve, reject) => {
      const query = `SELECT id FROM books WHERE id_author = '${id_author}' AND title = '${title}'`;
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

  entityExists(entity_id, entity) {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM '${entity}' WHERE id = '${entity_id}'`;
      this.db.get(query, function(err, row){
        if(err) {
          reject(err);
        } else {
          resolve(row != undefined);  
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

}

exports.default = AuthorsBooks;

