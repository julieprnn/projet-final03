const express = require('express');
const Plumes = require("./entities/plumes");
const handlingRes = require("./entities/handlingRes");

const router = express.Router();



function init(db) {

    // On utilise JSON
    router.use(express.json());
    
    // Affichage pour toute requête sur http://localhost:4000/plumes
    router.use((req, res, next) => {
        console.log('----------------------------------------------------');
        console.log('API_PLUMES -----> method : %s, path : %s', req.method, req.path);
        console.log('\nBody :', req.body);
        next();
    });


    //-------------------------------------------------------------------------------------------------
    //                                        Plumes management
    //-------------------------------------------------------------------------------------------------

    // Instanciation de la classe Plumes en passant en paramètre le database mongoDB
    const plumes = new Plumes.default(db);



    router
        .put("/", async (req, res) => {

            try {
                const {userId, typeText, text, image, date, entityId, typeEntity, comments, spoiler} = req.body;

                // Erreur : paramètre manquant
                if (!userId || !typeText || !text) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, typeText, text>");
                    return;
                } 
                
                if(!await plumes.postPlume(userId, typeText, text, image, date,  entityId, typeEntity, comments, spoiler)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion de la plume dans la base de données");
                    return;
                } else {
                    handlingRes.default(res, 200, "Insertion de la plume dans la base de données plumes réussie!");
                }

                let tabIdFollowers = await users.getFollowersList(entityId, typeEntity);
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
        .put("/:plume_id/comment", async (req, res) => {
            try {
                const plumeId = req.params.plume_id;
                const {userId, text} = req.body;
                let {spoiler} = req.body;

                // Erreur : paramètre manquant
                if (!plumeId || !userId || !text) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <plumeId, userId, text>");
                    return;
                } 

                if(!await plumes.existsPlume(plumeId)) {
                    res.status(401).json({
                        status: 401,
                        message: "plume inexistante"
                    });
                    return;
                } 

                if (spoiler === undefined) {
                    spoiler = false ;
                } 

                if(!await plumes.commentPlume(plumeId, userId, text, spoiler)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion du commentaire dans la base de données");
                    return;
                } else {
                    handlingRes.default(res, 200, "Insertion du commentaire dans la base de données plumes réussie!");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        .post("/:plume_id/comment", async (req, res) => {
            try {
                const plumeId = req.params.plume_id;
                const { userId, text, newText, spoiler } = req.body;
                let { newSpoiler } = req.body;

                // Erreur : paramètre manquant
                if (!plumeId || !userId || !text || !newText || !spoiler) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <plumeId, userId, text, newText, spoiler>");
                    return;
                } 

                if(!await plumes.existsPlume(plumeId)) {
                    res.status(401).json({
                        status: 401,
                        message: "plume inexistante"
                    });
                    return;
                } 

                if (newSpoiler === undefined) {
                    newSpoiler = spoiler ;
                } 

                if(!await plumes.modifyCommentPlume(plumeId, userId, text, newText, spoiler, newSpoiler)) {
                    handlingRes.default(res, 409, "Problème lors de la modification du commentaire dans la base de données");
                    return;
                } else {
                    console.log('maj ok');
                    res.status(200).json({
                        status: 200,
                        message: "maj ok"
                    });
                }
            } 
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        .delete("/:plume_id/comment", async (req, res) => {
            try {
                const plumeId = req.params.plume_id;
                const {userId, text} = req.body;

                // Erreur : paramètre manquant
                if (!plumeId || !userId || !text) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <plumeId, userId, text>");
                    return;
                } 

                if(!await plumes.existsPlume(plumeId)) {
                    res.status(401).json({
                        status: 401,
                        message: "plume inexistante"
                    });
                    return;
                } 

                if(!await plumes.deleteCommentPlume(plumeId, userId, text)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression du commentaire dans la base de données");
                    return;
                } else {
                    console.log('maj ok');
                    res.status(200).json({
                        status: 200,
                        message: "maj ok (pas forcement cancellato)"
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
        .post("/:plume_id", async (req, res) => {
            try {
                const plumeId = (req.params.plume_id);
                const { userId, text, image } = req.body;
                
                // Erreur : paramètre manquant
                if (!userId || !(text || image)) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, text ou image>");
                    return;
                }

                if(!await plumes.plumeIsMine(userId, plumeId)) {
                    res.status(401).json({
                        status: 401,
                        message: "plume not mine non 6 autorizzato"
                    });
                    return;
                }

                if(! await plumes.modifyPlume(plumeId, text, image)) {
                    handlingRes.default(res, 409, "Problème lors de la modification de la plume dans la base de données");
                } else {
                    console.log('plume modif');
                    res.status(200).json({
                        status: 200,
                        message: "plume modif"
                    });
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        .get("/", async (req, res) => {

            try {
                let { userId, tabIdAmis, tabIdFollowedAuthors, tabIdFollowedBooks, n } = req.body; //n = nombre de lignes à visualiser
                
                // Erreur : paramètre manquant
                if (!userId || !tabIdAmis || !tabIdFollowedAuthors || !tabIdFollowedBooks) { //les tab peuvent etre vides, pas soucis, mais pas undefined
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, tabIdAmis, tabIdFollowedAuthors, tabIdFollowedBooks>");
                    return;
                }

                // Paramètre initialisé avec une valeur par defaut
                if (!n) {
                    n = 10;
                }

                let tabPlumes = await plumes.getHomePlumesList(userId, tabIdAmis, tabIdFollowedAuthors, tabIdFollowedBooks, n);

                if (tabPlumes.length != 0) {                    
                    res.status(200).json({
                        status: 200,
                        message: "liste de plumes trouvée",
                        listPlumes: tabPlumes
                    });
                }
                else {
                    res.status(401).json({
                        status: 401,
                        message: "liste inexistant"
                    });
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        .get("/:user_id", async (req, res) => {

            try {
                const login = req.params.user_id;
                const { userId } = req.body;
                let { n } = req.body;   // n = nombre de lignes à visualiser
                
                // Erreur : paramètre manquant
                if (! login || !userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, userId>");
                    return;
                }

                if (!n) {
                    n = 10;
                }

                let tabPlumes = await plumes.getThisUserPlumesList(userId, n);

                if (tabPlumes.length != 0) {                    
                    res.status(200).json({
                        status: 200,
                        message: "liste de plumes trouvée",
                        listPlumes: tabPlumes
                    });
                }
                else {
                    res.status(401).json({
                        status: 401,
                        message: "liste inexistant"
                    });
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        .get("/:entity/:entity_id", async (req, res) => {    

            try {
                const entity = req.params.entity;
                const entityId = req.params.entity_id;
                let { spoiler, n } = req.body;  //n = nombre de lignes à visualiser
                
                // Erreur : paramètre manquant
                if (!entity || !entityId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <entity, entityId>");
                    return;
                }
                
                if (entity != "books" && entity != "authors") {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : entity inconnue"
                    });
                    return;
                }

                if (spoiler === undefined) {
                    spoiler = false ;
                }

                if (!n) {
                    n = 10;
                }

                let tabPlumes = await plumes.getAllPlumesList(entityId, entity, spoiler, n);

                if (tabPlumes.length != 0) {                    
                    res.status(200).json({
                        status: 200,
                        message: "liste de plumes trouvée",
                        listPlumes: tabPlumes
                    });
                }
                else {
                    res.status(401).json({
                        status: 401,
                        message: "liste inexistant euh"
                    });
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        .delete("/:plume_id", async (req, res) => {
            try {
                const plumeId = (req.params.plume_id);
                const { userId } = req.body;
                
                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
                    return;
                }

                if(!await plumes.plumeIsMine(userId, plumeId)) {
                    res.status(401).json({
                        status: 401,
                        message: "plume not mine non 6 autorizzato"
                    });
                    return;
                }

                if(! await plumes.deletePlume(plumeId)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression de la plume dans la base de données");
                } else {
                    console.log('plume supprimee');
                    res.status(200).json({
                        status: 200,
                        message: "plume supprimee"
                    });
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

