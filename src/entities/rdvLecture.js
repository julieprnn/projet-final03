class rdvLecture {
  
  // Constructeur de la classe Friends (instanciation): creation d'une table 'friends'
  // constituée des champs id (autoincremental), login, password, lastname (nom), firstname (prenom) A MODIFIER!!!!!!!!!
  constructor(db) {
    this.db = db

    const rdvLecturesSchema = db.Schema({
      // id genere automatiquement par mongoose
      speaker : {type : String, required : true}, //nom, prenom ou alias
      title : {type : String, required : true},
      text : {type : String, default : "Rendez-vous lecture en programme!"},
      bookId : {type : String, required : true},
      authorId : {type : String, required : true},
      image : {type : String},
      dateStart : {type : Date, required : true}, // var myDate = new Date("2016-05-18T16:00:00Z");
      dateStop : {type : Date, required : true},
      createdBy : {type : String, required : true}, //userId
      createdOn : {type : Date, default: Date.now},
      link :  {type : String, required : true}
    });
    // Compiler le schema en modèle
    this.rdvLecture = db.model('rdvLecture', rdvLecturesSchema);
    console.log("RdvLecture table ready");
  }

  createRdvLecture(userId, speaker, title, text, bookId, authorId, image, dateStart, dateStop, link) {
    return new Promise((resolve, reject) => {
      const l = new this.rdvLecture({
        'speaker' : speaker,
        'title' : title,
        'text' : text,
        'bookId' : bookId,
        'authorId' : authorId,
        'image' : image,
        'dateStart' : dateStart,
        'dateStop' : dateStop,
        'createdBy' : userId,
        'link' : link
      })
      l.save(function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(title);
        }
      });
    });
  }

  existsRdvLecture(rdvLectureId){
    return new Promise((resolve, reject) => {
      const query = { _id : rdvLectureId };
      this.rdvLecture.findOne(query, function(err, row){
        if (err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  rdvIsMine(userId, rdvLectureId){
    return new Promise((resolve, reject) => {
      const query = { $and: [{ _id : rdvLectureId }, { createdBy : userId } ] };
      console.log(query);
      this.rdvLecture.findOne( query, function(err, row){
        if (err) {
          reject(err);
        } else {
          resolve(row != undefined);  
        }  
      })
    });
  }

  modifyRdvLecture(rdvLectureId, newSpeaker, newTitle, newText, newImage, newDateStart, newDateStop, newLink){
    return new Promise((resolve, reject) => {
      const query = { _id : rdvLectureId };
      const update = { _id : rdvLectureId, speaker : newSpeaker, title : newTitle, text : newText, image : newImage, dateStart : newDateStart, dateStop : newDateStop, link : newLink };
      this.rdvLecture.updateOne( query, update, function(err){
        if (err) {
          reject(err);
        } else {
          resolve(rdvLectureId);  
        }  
      })
    });
  }


  deleteRdvLecture(rdvLectureId){
    return new Promise((resolve, reject) => {
      const query = { _id : rdvLectureId };
      this.rdvLecture.deleteOne( query, function(err){
        if (err) {
          reject(err);
        } else {
          resolve(rdvLectureId);  
        }  
      })
    });
  }

  getThisEntityRdvList(entityId, entity, n) {
    return new Promise((resolve, reject) => {
      let query;
      if (entity === "books"){
        query = { bookId : entityId };
      } else {
        query = { authorId : entityId };
      }
      this.Plume.find(query, function(err, tab){
        if(err) {
          reject(err);
        } else {
          resolve(tab);
        }
      }).sort({date: -1}).limit(n); // affiche les premiers n results
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
      
      console.log("query:",query, "update:", update);
      this.Plume.updateOne( query, update, function(err){
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
        update = { spoiler : spoiler, $push: { comments : { commentId : new this.db.Types.ObjectId(), userId : userId, text : text, spoiler : spoiler } } };  
      } else {
        update = { $push: { comments : { commentId : new this.db.Types.ObjectId(), userId : userId, text : text, spoiler : spoiler } } };
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

  // modifyCommentPlume(plumeId, commentId, newText, spoiler){
  //   return new Promise((resolve, reject) => {
  //     const query = { _id : plumeId, 'comments.commentId' : commentId, 'comments.userId' : userId };
  //     let update;
  //     if (spoiler != undefined){
  //       update = { _id : plumeId, 'comments.commentId' : commentId, 'comments.text' : newText, spoiler : spoiler} };
  //     } else {
  //       update = { _id : plumeId, comments : { commentId : commentId, text : newText} };
  //     }
      
  //     console.log("query:",query, "update:", update);
  //     this.Plume.updateOne( query, update, function(err){
  //       if (err) {
  //         reject(err);
  //       } else {
  //         resolve(plumeId);  
  //       }  
  //     })
  //   });
  // }

  // // ca ne marche pas : il fonctionn parfois avec userId, il faudrait verifier aussi le commentaireId
  // deleteCommentPlume(plumeId, commentId, userId){
  //   return new Promise((resolve, reject) => {
  //     const query = { _id : plumeId };
  //     //const update = { $pull: { comments : { commentId : commentId, userId : userId} } };
  //     const update = { $pull: { comments : { userId : userId } } };
  //     console.log("query=",query);
  //     console.log("update=",update);
  //     this.Plume.updateOne( query,  update, function(err){
  //       if (err) {
  //         reject(err);
  //       } else {
  //         resolve(plumeId);
  //       }  
  //     })
  //   });
  // }

  //remove is deprecated. Use deleteOne, deleteMany, or bulkWrite instead
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
      }).sort({date: -1}).limit(n); // affiche les premiers n results ordre decriss de date (plus recents)
    });
  }
  
  getAllPlumesList(entity_id, typeEntity, spoiler, n) {
    return new Promise((resolve, reject) => {
      const query = { $and: [ {entity_id : entity_id}, {typeEntity : typeEntity}, {spoiler : spoiler} ] };
      console.log(query);
      this.Plume.find(query, function(err, tab){
        if(err) {
          reject(err);
        } else {
          resolve(tab);
        }
      }).sort({date: -1}).limit(n); // affiche les premiers n results
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
      }).sort({date: -1}).limit(n); // affiche les premiers n results
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

}

exports.default = rdvLecture;

