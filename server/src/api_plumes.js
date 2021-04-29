const express = require('express');
const Plumes = require("./entities/plumes");
const handlingRes = require("./entities/handlingRes");
const router = express.Router();


function init(db) {

    // On utilise JSON
    router.use(express.json());
    
    // simple logger for this router's requests
    // all requests to this router will first hit this middleware
    router.use((req, res, next) => {
        console.log('----------------------------------------------------');
        console.log('API_PLUMES -----> method : %s, path : %s', req.method, req.path);
        console.log('\nBody :', req.body);
        console.log(db.version);
        next();
    });


    const plumes = new Plumes.default(db);

    // {"userId":"055", "typeText":"plume", "text":"Ciao mamma ti voglio bene", "image":"cuore.jpg", "comments":"[]", "likes":"0"}

    router
        .put("/", async (req, res) => {
            try{
                const {userId, typeText, text, image, date, entity_id, typeEntity, comments, spoiler} = req.body;

                // Erreur : paramètre manquant
                if (!userId || !typeText || !text) {
                    handlingRes.default(res, 400);
                    return;
                } 
                
                // Insertion de l'utilisateur dans la BD
                else {    
                    plumes.postPlume(userId, typeText, text, image, date,  entity_id, typeEntity, comments, spoiler)
                    .then((user_id) => res.status(200).send({ id: user_id }))
                    .catch((err) => res.status(500).send(err));
                
                    let tabIdFollowers = await users.getFollowersList(entity_id, typeEntity);
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
        .put("/:plume_id/comment", async (req, res) => {
            try {
                const plumeId = req.params.plume_id;
                const {userId, text} = req.body;
                let {spoiler} = req.body;

                // Erreur : paramètre manquant
                if (!plumeId || !userId || !text) {
                    handlingRes.default(res, 400);
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
                    res.status(401).json({
                        status: 401,
                        message: "commento non inserito"
                    });
                    return;
                } else {
                    console.log('comment inserito');
                    res.status(200).json({
                        status: 200,
                        message: "comment inserito"
                    });
                }
            } catch{
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne"
                    //details: (e || "Erreur inconnue").toString()
                });
            }
        });

    router
        .post("/:plume_id/comment", async (req, res) => {
            try {
                const plumeId = req.params.plume_id;
                const { userId, text, newText, spoiler } = req.body;
                let {newSpoiler} = req.body;

                // Erreur : paramètre manquant
                if (!plumeId || !userId || !text || !newText || !spoiler) {
                    handlingRes.default(res, 400);
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
                    res.status(401).json({
                        status: 401,
                        message: "commento modif probleme"
                    });
                    return;
                } else {
                    console.log('maj ok');
                    res.status(200).json({
                        status: 200,
                        message: "maj ok"
                    });
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
        .delete("/:plume_id/comment", async (req, res) => {
            try {
                const plumeId = req.params.plume_id;
                const {userId, text} = req.body;

                // Erreur : paramètre manquant
                if (!plumeId || !userId || !text) {
                    handlingRes.default(res, 400);
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
                    res.status(401).json({
                        status: 401,
                        message: "commento cancellazione probleme"
                    });
                    return;
                } else {
                    console.log('maj ok');
                    res.status(200).json({
                        status: 200,
                        message: "maj ok (pas forcement cancellato)"
                    });
                }
            } catch{
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne"
                    //details: (e || "Erreur inconnue").toString()
                });
            }
        });

    router
        //modify
        .post("/:plume_id", async (req, res) => {
            try {
                const plumeId = (req.params.plume_id);
                const { user_id, text, image } = req.body;
                
                // Erreur : paramètre manquant
                if (!user_id || !(text || image)) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                if(!await plumes.plumeIsMine(user_id, plumeId)) {
                    res.status(401).json({
                        status: 401,
                        message: "plume not mine non 6 autorizzato"
                    });
                    return;
                }

                if(! await plumes.modifyPlume(plumeId, text, image)) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant modif plume"
                    });

                } else {
                    console.log('plume modif');
                    res.status(200).json({
                        status: 200,
                        message: "plume modif"
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
        .get("/", async (req, res) => {

            try {
                // nb. impossible calculer l id a partir d ici... on rentre le bon id depuis le front!
                // il faut donc s assurer d abord que l user existe
                let { user_id, tabIdAmis, tabIdFollowed_authors, tabIdFollowed_books, n } = req.body; //n = nombre de lignes à visualiser
                
                // Erreur : paramètre manquant
                if (!user_id || !tabIdAmis || !tabIdFollowed_authors || !tabIdFollowed_books) { //les tab peuvent etre vides, pas soucis, mais pas undefined
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                // paramètre manquant
                if (!n) {
                    n = 10;
                }

                let tabPlumes = await plumes.getHomePlumesList(user_id, tabIdAmis, tabIdFollowed_authors, tabIdFollowed_books, n);

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
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });

    router
        .get("/:user_id", async (req, res) => {

            try {
                const login = req.params.user_id;
                // nb. impossible calculer l id a partir d ici... on rentre le bon id depuis le front!
                // il faut donc s assurer d abord que l user existe
                let { user_id, n } = req.body; //n = nombre de lignes à visualiser
                
                // Erreur : paramètre manquant
                if (! login || !user_id) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                // paramètre manquant
                if (!n) {
                    n = 10;
                }

                let tabPlumes = await plumes.getThisUserPlumesList(user_id, n);

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
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });

    router
        .get("/:entity/:entity_id", async (req, res) => {    

            try {

                // nb. impossible calculer l id a partir d ici... on rentre le bon id depuis le front!
                // il faut donc s assurer d abord que l user existe
                const entity = req.params.entity;
                const entity_id = req.params.entity_id;
                let { spoiler, n } = req.body; //n = nombre de lignes à visualiser
                
                // Erreur : paramètre manquant
                if (!entity || !entity_id) {
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

                if (spoiler === undefined) {
                    spoiler = false ;
                }

                // paramètre manquant
                if (!n) {
                    n = 10;
                }

                console.log("ce qu on envoie a la fonction :", entity_id, entity, spoiler, n);
                let tabPlumes = await plumes.getAllPlumesList(entity_id, entity, spoiler, n);

                console.log("tab = ", tabPlumes);
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
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
            }
        });

    router
        .delete("/:plume_id", async (req, res) => {
            try {
                const plumeId = (req.params.plume_id);
                const { user_id } = req.body;
                
                // Erreur : paramètre manquant
                if (!user_id) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                if(!await plumes.plumeIsMine(user_id, plumeId)) {
                    res.status(401).json({
                        status: 401,
                        message: "plume not mine non 6 autorizzato"
                    });
                    return;
                }

                if(! await plumes.deletePlume(plumeId)) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant suppression plume"
                    });

                } else {
                    console.log('plume supprimee');
                    res.status(200).json({
                        status: 200,
                        message: "plume supprimee"
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


    return router;
}

exports.default = init;

