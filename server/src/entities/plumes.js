class Plumes {
  
  constructor(db) {
    this.db = db

    const plumesSchema = db.Schema({
      // id genere automatiquement par mongoose
      userId : {type : String, required : true},
      typeText : {type : String, required : true},
      text : {type : String, required : true},
      image : {type : String},
      date : {type : Date, default: Date.now},
      entity_id : {type : String, required : true}, // id livre ou author
      typeEntity : {type : String, required : true}, // livre ou author
      comments : [],
      spoiler : {type : Boolean, default: false}
    });
    // Compiler le schema en modèle
    this.Plume = db.model('Plume', plumesSchema);
    console.log("Plumes table ready");
  }

  postPlume(userId, typeText, text, image, date,  entity_id, typeEntity, comments, spoiler) {
    return new Promise((resolve, reject) => {
      const p = new this.Plume({
        'userId' : userId,
        'typeText' : typeText,
        'text' : text,
        'image' : image,
        'date' : date,
        'entity_id' : entity_id,
        'typeEntity' : typeEntity,
        'comments' : comments,
        'spoiler' : spoiler
      })
      p.save(function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(userId);
        }
      });
    });
  }

  existsPlume(plumeId){
    return new Promise((resolve, reject) => {
      const query = { _id : plumeId };
      this.Plume.findOne(query, function(err, row){
        if (err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  plumeIsMine(user_id, plumeId){
    return new Promise((resolve, reject) => {
      const query = { _id : plumeId, userId : user_id};
      this.Plume.findOne(query, function(err, row){
        if (err) {
          reject(err);
        } else {
          resolve(row != undefined); 
        }  
      })
    });
  }

  modifyPlume(plumeId, newText, newImage){
    return new Promise((resolve, reject) => {
      const query = { _id : plumeId };
      let update;
      if (!newText){
        update = { _id : plumeId, image : newImage};
      } else if (!newImage){
        update = { _id : plumeId, text : newText };
      } else {
        update = { _id : plumeId, text : newText, image : newImage};
      }
      
      this.Plume.updateOne( query, update, function(err){
        if (err) {
          reject(err);
        } else {
          resolve(plumeId);  
        }  
      })
    });
  }

  deletePlume(plumeId){
    return new Promise((resolve, reject) => {
      const query = { _id : plumeId };
      this.Plume.deleteOne( query, function(err){
        if (err) {
          reject(err);
        } else {
          resolve(plumeId);  
        }  
      })
    });
  }

  commentPlume(plumeId, userId, text, spoiler){
    return new Promise((resolve, reject) => {
      const query = { _id : plumeId };
      let update;
      if (spoiler === true){
        update = { spoiler : spoiler, $push: { comments : { userId : userId, text : text, spoiler : spoiler } } };  
      } else {
        update = { $push: { comments : { userId : userId, text : text, spoiler : spoiler } } };
      }
      this.Plume.updateOne( query,  update, function(err){
        if (err) {
          reject(err);
        } else {
          resolve(plumeId);  
        }  
      })
    });
  }

  modifyCommentPlume(plumeId, userId, text, newText, spoiler, newSpoiler){
    return new Promise((resolve, reject) => {
      const query = { _id : plumeId , comments : { userId : userId, text : text, spoiler : spoiler } };
      const update = { $set: { "comments.$" : { userId : userId, text : newText, spoiler : newSpoiler } } };
      this.Plume.updateOne( query,  update, function(err){
        if (err) {
          reject(err);
        } else {
          resolve(plumeId);
        }  
      })
    });
  }

  deleteCommentPlume(plumeId, userId, text){
    return new Promise((resolve, reject) => {
      const query = { _id : plumeId };
      const update = { $pull: { comments : { userId : userId, text : text } } };
      this.Plume.updateOne( query,  update, function(err){
        if (err) {
          reject(err);
        } else {
          resolve(plumeId);
        }  
      })
    });
  }

  getHomePlumesList(userId, tabIdAmis, tabIdFollowed_authors, tabIdFollowed_books, n) {
    return new Promise((resolve, reject) => {
      const cond1 = { userId : userId };
      const cond2 = { userId : { $in: tabIdAmis } };
      const cond3 = { $and: [ { entity : { $in: tabIdFollowed_authors } } , { typeEntity : "authors"} ] };
      const cond4 = { $and: [ { entity : { $in: tabIdFollowed_books } } , { typeEntity : "books"} ] };
      const query = { $or: [ cond1, cond2, cond3, cond4] };
      this.Plume.find(query, function(err, tab){
        if(err) {
          reject(err);
        } else {
          resolve(tab);
        }
      }).sort({date: -1}).limit(n); // affiche les n resultats les plus recents
    });
  }
  
  getAllPlumesList(entity_id, typeEntity, spoiler, n) {
    return new Promise((resolve, reject) => {
      const query = { $and: [ {entity_id : entity_id}, {typeEntity : typeEntity}, {spoiler : spoiler} ] };
      this.Plume.find(query, function(err, tab){
        if(err) {
          reject(err);
        } else {
          resolve(tab);
        }
      }).sort({date: -1}).limit(n); // affiche les n resultats les plus recents
    });
  }

  getThisUserPlumesList(userId, n) {
    return new Promise((resolve, reject) => {
      const query = { userId : userId };
      this.Plume.find(query, function(err, tab){
        if(err) {
          reject(err);
        } else {
          resolve(tab);
        }
      }).sort({date: -1}).limit(n); // affiche les n resultats les plus recents
    });
  }

}

exports.default = Plumes;

