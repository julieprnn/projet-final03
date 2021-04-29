class RdvLecture {
  
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
    // Compilation du schéma en modèle
    this.rdvLecture = db.model('rdvLecture', rdvLecturesSchema);
    console.log("rdvLecture table ready");
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

  // affiche les premiers n results
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
      }).sort({date: -1}).limit(n);
    });
  }

}

exports.default = RdvLecture;

