const express = require('express');
const RdvLecture = require("./entities/rdvLecture");
const followers = require("./entities/followers"); //check si ça marche
const users = require("./entities/users"); //check si ça marche
const handlingRes = require("./entities/handlingRes");
const router = express.Router();


function init(dbSqLite, dbMongo) {

    // On utilise JSON
    router.use(express.json());
    
    // simple logger for this router's requests
    // all requests to this router will first hit this middleware
    router.use((req, res, next) => {
        console.log('----------------------------------------------------');
        console.log('API_RDV-LECTURE -----> method : %s, path : %s', req.method, req.path);
        console.log('\nBody :', req.body);
        next();
    });


//-------------------------------------------------------------------------------------------------
const rdvLecture = new RdvLecture.default(dbMongo);
//-------------------------------------------------------------------------------------------------

    router
        .put("/", async (req, res) => {
            try{
                const {user_id, speaker, title, text, bookId, authorId, image, dateStart, dateStop, link} = req.body;

                // Erreur : paramètre manquant
                if (!user_id || !speaker || !title || !bookId || !authorId || !dateStart || !dateStop || !link) {
                    handlingRes.default(res, 400);
                    return;
                }
                // Insertion de l'utilisateur dans la BD
                else {    
                    rdvLecture.createRdvLecture(user_id, speaker, title, text, bookId, authorId, image, dateStart, dateStop, link)
                    .then((title) => res.status(200).send({ title: title }))
                    .catch((err) => res.status(500).send(err));

                    let tabIdFollowers = await users.getFollowersList(authorId, "authors");
                    if (tabIdFollowers.length != 0) {                    
                        tabIdFollowers.forEach((row) => {
                            await users.addNotification(row, "salut ca t interesse!");
                        });
                    }
                    tabIdFollowers = await users.getFollowersList(bookId, "books");
                    if (tabIdFollowers.length != 0) {                    
                        tabIdFollowers.forEach((row) => {
                            await users.addNotification(row, "salut ca t interesse!");
                        });
                    }
                }
            } catch{
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne",
                    //details: (e || "Erreur inconnue").toString()
                });
            }
        });

    router
        //modify
        .post("/:rdvLecture_id", async (req, res) => {
            try {
                const rdvLectureId = req.params.rdvLecture_id;
                const { speaker, title, text, image, dateStart, dateStop, userId, link } = req.body;
                
                // Erreur : paramètre manquant
                if (!speaker || !title || !text || !image || !dateStart || !dateStop || !userId || !link) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                if(!await rdvLecture.rdvIsMine(userId, rdvLectureId)) {
                    res.status(401).json({
                        status: 401,
                        message: "rdv not mine non 6 autorizzato"
                    });
                    return;
                }

                if(! await rdvLecture.modifyRdvLecture(rdvLectureId, speaker, title, text, image, dateStart, dateStop, link)) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant modif rdv"
                    });

                } else {
                    console.log('rdv modif');
                    res.status(200).json({
                        status: 200,
                        message: "rdv modif"
                    });
                }
            }
            catch (e) {
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });

    router
        .delete("/:rdvLecture_id", async (req, res) => {

            try {
                const rdvLectureId = req.params.rdvLecture_id;
                const { user_id } = req.body;
                
                console.log(rdvLectureId, user_id);

                // Erreur : paramètre manquant
                if (!user_id) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                if(!await rdvLecture.rdvIsMine(user_id, rdvLectureId)) {
                    res.status(401).json({
                        status: 401,
                        message: " not mine non 6 autorizzato"
                    });
                    return;
                }

                if(! await rdvLecture.deleteRdvLecture(rdvLectureId)) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant suppression rdv"
                    });

                } else {
                    console.log('rdv supprimee');
                    res.status(200).json({
                        status: 200,
                        message: "rdv supprimee"
                    });
                }
            }
            catch (e) {
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });


    //-------------------------------------------------------------------------------------------------
    // const followers = new Followers.default(dbSqLite);
    //-------------------------------------------------------------------------------------------------

    router
        //Follow rdv
        .put("/search/rdvLecture/:rdvLecture_id", async (req, res) => {

            try {
                const { userId } = req.body;
                const rdvLectureId = req.params.rdvLecture_id;
                
                // Erreur : paramètre manquant
                if (!userId) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et book nécessaires"
                    });
                    return;
                }

                // Verification si l' existe
                if(! await rdvLecture.existsRdvLecture(rdvLectureId)) {
                    res.status(401).json({
                        status: 401,
                        message: "rdv inconnu"
                    });
                    return;
                }

                // Verification si l' existe
                if(await followers.alreadyFollowed(userId, rdvLectureId, "rdvLecture")) {
                    res.status(401).json({
                        status: 401,
                        message: "dejà followed"
                    });
                    return;
                }

                if(! await followers.follow(userId, rdvLectureId, "rdvLecture")) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant following"
                    });

                } else{
                    console.log('followed');
                    res.status(200).json({
                        status: 200,
                        message: "followed"
                    });
                }
            }
            catch (e) {
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });

        //liste rdv que je suis
    router
        .get("/:user_id/rdvLectureList", async (req, res) => {
            try {
                const userId = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!userId) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                // Verification si l'utilisateur existe
                let tabRdvLecture = await followers.getFollowedList(userId, "rdvLecture");
                
                if (tabRdvLecture.length != 0) {                    
                    let tabRDV = tabRdvLecture.toString();
                    res.status(200).json({
                        status: 200,
                        message: "liste rdv trouvée",
                        listAuthors: tabRDV
                    });
                }
                else {
                    res.status(401).json({
                        status: 401,
                        message: "liste rdv inexistant"
                    });
                return;
                }
            }
            catch (e) {
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });     

        //unfollow
    router
        .delete("/:user_id/rdvLectureList/:rdvLecture_id", async (req, res) => {
            try {
                const userId = req.params.user_id;
                const rdvLectureId = req.params.rdvLecture_id;

                // Erreur : paramètre manquant
                if (!userId) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                // Verification si l' existe
                if(! await rdvLecture.existsRdvLecture(rdvLectureId)) {
                    res.status(401).json({
                        status: 401,
                        message: "rdv inconnu"
                    });
                    return;
                }

                // Verification si l' existe
                if(!await followers.alreadyFollowed(userId, rdvLectureId, "rdvLecture")) {
                    res.status(401).json({
                        status: 401,
                        message: "tu ne le follow pas"
                    });
                    return;
                }

                if(! await followers.unFollow(userId, rdvLectureId, "rdvLecture")) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant unfollowing"
                    });

                } else{
                    console.log('unfollowed');
                    res.status(200).json({
                        status: 200,
                        message: "unfollowed"
                    });
                }
            }
            catch (e) {
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });

    router
        .get("/:entity/:entity_id/rdvLectureList", async (req, res) => {
            try {

                let { n } = req.body; //n = nombre de lignes à visualiser
                const entity = req.params.entity;
                const entityId = req.params.entity_id;
                
                // Erreur : paramètre manquant
                if (!entity || !entityId) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et book nécessaires"
                    });
                    return;
                }
                
                // Erreur : paramètre manquant
                if (entity != "books" && entity != "authors") {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : entity inconnue"
                    });
                    return;
                }

                if(! await users.entityExists(entity_id, entity)) {
                    res.status(401).json({
                        status: 401,
                        message: "non trouve"
                    });
                    return;
                }

                if (!n) {
                    n = 10;
                }

                // Verification si l'utilisateur existe
                let tabRdvLecture = await rdvLecture.getThisEntityRdvList(entityId, entity, n);
                                
                if (tabRdvLecture.length != 0) {                    
                    let tabRDV = tabRdvLecture.toString();
                    res.status(200).json({
                        status: 200,
                        message: "liste rdv trouvée",
                        listAuthors: tabRDV
                    });
                }
                else {
                    res.status(401).json({
                        status: 401,
                        message: "liste rdv inexistant"
                    });
                return;
                }
            }
            catch (e) {
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });     

    return router;
}

exports.default = init;

