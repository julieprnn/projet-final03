const express = require('express');
const Plumes = require("../entities/plumes");
const Followers = require("../entities/followers");
const handlingRes = require("../handlingRes");

const router = express.Router();



function init(db, dbSQL) {

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

    // Instanciation de la classe Followers en passant en paramètre le database SQLite
    const followers = new Followers.default(dbSQL);

    router
        // Création d'une nouvelle plume (tweet)
        .put("/", async (req, res) => {

            try {
                const {userId, typeText, text, image, date, entityId, typeEntity, comments, spoiler} = req.body;

                // Erreur : paramètre manquant
                if (!userId || !typeText || !text) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, typeText, text>");
                    return;
                } 
                
                // Insertion de la plume dans la table plumes
                if(!await plumes.postPlume(userId, typeText, text, image, date,  entityId, typeEntity, comments, spoiler)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion de la plume dans la base de données");
                    return;
                } else {
                    handlingRes.default(res, 200, "Insertion de la plume dans la base de données plumes réussie!");
                }

                // Envoi d'une notification à tous les lecteurs (user) intéressés par l'auteur ou le livre mentionné
                let tabIdFollowers = await followers.getFollowersList(entityId, typeEntity);
                if (tabIdFollowers.length != 0) {                    
                    tabIdFollowers.forEach((row) => {
                        users.addNotification(row, "Lecture conseillée : '" + title + "'");
                    });
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Création d'un commentaire lié à une plume
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

                // Vérification si la plume existe dans la table plumes
                if(!await plumes.existsPlume(plumeId)) {
                    handlingRes.default(res, 404, "Plume non trouvée dans la base de données");
                    return;
                } 

                // Paramètre manquant : initialisation par défaut
                if (spoiler === undefined) {
                    spoiler = false ;
                } 

                // Insertion du commentaire de la plume dans la table plumes
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
        // Modification d'un commentaire lié à une plume
        .post("/:plume_id/comment", async (req, res) => {
            try {
                const plumeId = req.params.plume_id;
                const { userId, text, newText, spoiler } = req.body;
                let { newSpoiler } = req.body;

                // Erreur : paramètre manquant
                if (!plumeId || !userId || !text || !newText || !spoiler) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, text, newText, spoiler>");
                    return;
                } 

                // Vérification si la plume existe dans la table plumes
                if(!await plumes.existsPlume(plumeId)) {
                    handlingRes.default(res, 404, "Plume non trouvée dans la base de données");
                    return;
                } 

                // Paramètre manquant : initialisation par défaut
                if (newSpoiler === undefined) {
                    newSpoiler = spoiler ;
                } 

                // Mise à jour des champs du commentaire de la plume dans la table plumes
                if(!await plumes.modifyCommentPlume(plumeId, userId, text, newText, spoiler, newSpoiler)) {
                    handlingRes.default(res, 409, "Problème lors de la modification du commentaire dans la base de données");
                    return;
                } else {
                    handlingRes.default(res, 200, "Mise à jour du commentaire dans la base de données réussie!");
                }
            } 
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Suppression d'un commentaire de plume
        .delete("/:plume_id/comment", async (req, res) => {
            try {
                const plumeId = req.params.plume_id;
                const {userId, text} = req.body;

                // Erreur : paramètre manquant
                if (!plumeId || !userId || !text) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <plumeId, userId, text>");
                    return;
                } 

                // Vérification si la plume existe dans la table plumes
                if(!await plumes.existsPlume(plumeId)) {
                    handlingRes.default(res, 404, "Plume non trouvée dans la base de données");
                    return;
                }

                // Suppression du commentaire de la plume de la table plumes
                if(!await plumes.deleteCommentPlume(plumeId, userId, text)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression du commentaire dans la base de données");
                    return;
                } else {
                    handlingRes.default(res, 200, "Mise à jour ou suppression du commentaire dans la base de données réussie!");
                }
            } 
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Modification d'une plume
        .post("/:plume_id", async (req, res) => {
            try {
                const plumeId = (req.params.plume_id);
                const { userId, text, image } = req.body;
                
                // Erreur : paramètre manquant
                if (!userId || !(text || image)) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, text ou image>");
                    return;
                }

                // Vérification si ce lecteur (user) est l'auteur de la plume dans la table plumes
                if(!await plumes.plumeIsMine(userId, plumeId)) {
                    handlingRes.default(res, 406, "Modification de plume non autorisé");
                    return;
                }

                if(! await plumes.modifyPlume(plumeId, text, image)) {
                    handlingRes.default(res, 409, "Problème lors de la modification de la plume dans la base de données");
                } else {
                    handlingRes.default(res, 200, "Plume modifiée avec succès dans la base de données");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Obtention de la liste des plumes : plumes d'amis, plumes des favoris, NO SPOILER
        .get("/", async (req, res) => {

            try {
                let { userId, tabIdAmis, tabIdFollowedAuthors, tabIdFollowedBooks, n } = req.body; // n = nombre de lignes à visualiser
                
                // Erreur : paramètre manquant
                if (!userId || !tabIdAmis || !tabIdFollowedAuthors || !tabIdFollowedBooks) { // les tab peuvent etre vides, pas soucis, mais pas undefined
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, tabIdAmis, tabIdFollowedAuthors, tabIdFollowedBooks>");
                    return;
                }

                // Paramètre manquant : initialisation par défaut
                if (!n) {
                    n = 10;
                }

                // Obtention de la liste de plumes du lecteur (user)
                let tabP = await plumes.getHomePlumesList(userId, tabIdAmis, tabIdFollowedAuthors, tabIdFollowedBooks, n);
                if (tabP.length != 0) {                    
                    handlingRes.default(res, 200, "Liste de plumes trouvée dans la base de données", tabP);
                }
                else {
                    handlingRes.default(res, 404, "Liste de plumes vide dans la base de données");
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Obtention de la liste des plumes personnelle : plumes écrites par ce lecteur (user)
        .get("/:user_id", async (req, res) => {

            try {
                const userId = req.params.user_id;
                let { n } = req.body;   // n = nombre de lignes à visualiser
                
                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
                    return;
                }

                // Paramètre manquant : initialisation par défaut
                if (!n) {
                    n = 10;
                }

                // Obtention de la liste de plumes du lecteur (user)
                let tabP = await plumes.getThisUserPlumesList(userId, n);
                if (tabP.length != 0) {                    
                    handlingRes.default(res, 200, "Liste de plumes trouvée dans la base de données", tabP);
                }
                else {
                    handlingRes.default(res, 404, "Liste de plumes vide dans la base de données");
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Obtention de la liste des plumes écrites sur un livre ou un auteur
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
                
                // Erreur : entité non réconnue
                if (entity != "books" && entity != "authors") {
                    handlingRes.default(res, 406, "Entité non réconnue");
                    return;
                }

                // Paramètre manquant : initialisation par défaut
                if (spoiler === undefined) {
                    spoiler = false ;
                }

                // Paramètre manquant : initialisation par défaut
                if (!n) {
                    n = 10;
                }

                // Obtention de la liste de plumes du lecteur (user)  
                let tabP = await plumes.getAllPlumesList(entityId, entity, spoiler, n);
                if (tabP.length != 0) {
                    handlingRes.default(res, 200, "Liste de plumes trouvée dans la base de données", tabP);
                }
                else {
                    handlingRes.default(res, 404, "Liste de plumes vide dans la base de données");
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Suppression d'une plume
        .delete("/:plume_id", async (req, res) => {
            try {
                const plumeId = (req.params.plume_id);
                const { userId } = req.body;
                
                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
                    return;
                }

                // Vérification si ce lecteur (user) est l'auteur de la plume dans la table plumes
                if(!await plumes.plumeIsMine(userId, plumeId)) {
                    handlingRes.default(res, 406, "Modification de plume non autorisé");
                    return;
                }

                // Suppression de la plume de la table plumes
                if(! await plumes.deletePlume(plumeId)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression de la plume dans la base de données");
                } else {
                    handlingRes.default(res, 200, "Plume supprimée avec succès !");;
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

