const express = require ('express');
const app = express();
const articles = [{title:'Exemple'}];

app.set ('port', process.env.PORT || 3000);

app.get('/articles',(req,res,next)=>{
    res.send("liste des articles");
});

app.post('/articles',(req,res,next)=>{
    res.send("creation d\'un article");
});

//code acces un article

//code suppression d'un article

app.listen(app.get('port'),()=>{
    console.log('App started on port',app.get('port'));
});

