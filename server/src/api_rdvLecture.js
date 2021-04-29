const express = require('express');
const RdvLecture = require("./entities/RdvLecture");
const followers = require("./entities/followers");
const users = require("./entities/users");
const handlingRes = require("./entities/handlingRes");

const router = express.Router();



function init(db) {

    // On utilise JSON
    router.use(express.json());
    
    // Affichage pour toute requête sur http://localhost:4000/rdv
    router.use((req, res, next) => {
        console.log('----------------------------------------------------');
        console.log('API_RDV-LECTURE -----> method : %s, path : %s', req.method, req.path);
        console.log('\nBody :', req.body);
        next();
    });


    //-------------------------------------------------------------------------------------------------
    //                                        RdvLecture management
    //-------------------------------------------------------------------------------------------------

    // Instanciation de la classe RdvLecture en passant en paramètre le database mongoDB
    const rdvLecture = new RdvLecture.default(db);



    router
        .put("/", async (req, res) => {
            try{
                const { userId, speaker, title, text, bookId, authorId, image, dateStart, dateStop, link} = req.body;

                // Erreur : paramètre manquant
                if (!userId || !speaker || !title || !bookId || !authorId || !dateStart || !dateStop || !link) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, speaker, title, bookId, authorId, dateStart, dateStop, link>");
                    return;
                }
                // Insertion de l'utilisateur dans la BD
                if(!await rdvLecture.createRdvLecture(userId, speaker, title, text, bookId, authorId, image, dateStart, dateStop, link)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion du rdvLecture dans la base de données");
                    return;
                } else {
                    handlingRes.default(res, 200, "Insertion du rdvLecture dans la base de données rdvLecture réussie!");
                }

                let tabIdFollowers = await users.getFollowersList(authorId, "authors");
                if (tabIdFollowers.length != 0) {                    
                    tabIdFollowers.forEach((row) => {
                        users.addNotification(row, "salut ca t interesse!");
                    });
                }
                tabIdFollowers = await users.getFollowersList(bookId, "books");
                if (tabIdFollowers.length != 0) {                    
                    tabIdFollowers.forEach((row) => {
                        users.addNotification(row, "salut ca t interesse!");
                    });
                }
            } 
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        //modify
        .post("/:rdvLecture_id", async (req, res) => {
            try {
                const rdvLectureId = req.params.rdvLecture_id;
                const { userId, speaker, title, text, image, dateStart, dateStop, link } = req.body;
                
                // Erreur : paramètre manquant
                if (!userId || !speaker || !title || !text || !image || !dateStart || !dateStop || !link) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, speaker, title, text, image, dateStart, dateStop, link>");
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
                    handlingRes.default(res, 409, "Problème lors de la modification du rdvLecture dans la base de données");
                } else {
                    console.log('rdv modif');
                    res.status(200).json({
                        status: 200,
                        message: "rdv modif"
                    });
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        .delete("/:rdvLecture_id", async (req, res) => {

            try {
                const rdvLectureId = req.params.rdvLecture_id;
                const { userId } = req.body;
                
                console.log(rdvLectureId, user_id);

                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
                    return;
                }

                if(!await rdvLecture.rdvIsMine(userId, rdvLectureId)) {
                    res.status(401).json({
                        status: 401,
                        message: " not mine non 6 autorizzato"
                    });
                    return;
                }

                if(! await rdvLecture.deleteRdvLecture(rdvLectureId)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression du rdvLecture dans la base de données");
                } else {
                    console.log('rdv supprimee');
                    res.status(200).json({
                        status: 200,
                        message: "rdv supprimee"
                    });
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
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
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
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
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

        //liste rdv que je suis
    router
        .get("/:user_id/rdvLectureList", async (req, res) => {
            try {
                const userId = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
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
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
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
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
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
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
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
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <entity, entityId>");
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

                if(! await users.entityExists(entityId, entity)) {
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
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });     


 
    return router;
}

exports.default = init;

