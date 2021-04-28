const Datastore = require('nedb');
const messages = new Datastore();
messages.loadDatabase();

function insertMsg(msg) {
  messages.insert(msg, function(err, result) {
    if (err) {
      throw err;
    }
    console.log(`Insert OK: ${result._id}`);
  });
}

const msg = {
  id_user: 1,
  message: 'Vivement la fin du couvre-feu',
  date: new Date(),
}

const msg2 = {
  id_user: 1,
  message: 'Regardez mes photos de Saint-Malo',
  photos: [ 'imgs/photo1.jpg '],
  date: new Date(),
}

insertMsg(msg);
insertMsg(msg2);

messages.find({}, function(err, result) {
  console.log(result);
});
