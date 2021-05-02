const express = require('express');
const RdvLecture = require("../entities/RdvLecture");
const users = require("../entities/users");
const Followers = require("../entities/followers");
const AuthorsBooks = require("../entities/authors_books");
const handlingRes = require("../handlingRes");

const router = express.Router();



function init(db, dbSQL) {

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

    // Instanciation de la classe Followers en passant en paramètre le database SQLite
    const followers = new Followers.default(dbSQL);

    // Instanciation de la classe AuthorsBooks en passant en paramètre le database sqlite
    const authorsBooks = new AuthorsBooks.default(dbSQL);

    router
        // Création d'un nouveau rdvLecture
        .put("/", async (req, res) => {
            try{
                const { userId, speaker, title, text, bookId, authorId, image, dateStart, dateStop, link} = req.body;

                // Erreur : paramètre manquant
                if (!userId || !speaker || !title || !bookId || !authorId || !dateStart || !dateStop || !link) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, speaker, title, bookId, authorId, dateStart, dateStop, link>");
                    return;
                }

                // Erreur : l'auteur n'est pas présente dans la table authors
                if (! await authorsBooks.entityExists(authorId, "authors")) {
                    handlingRes.default(res, 404, "Auteur non trouvé dans la base de données");
                    return;
                }

                // Erreur : le livre n'est pas présente dans la table books
                if (! await authorsBooks.entityExists(bookId, "books")) {
                    handlingRes.default(res, 404, "Livre non trouvé dans la base de données");
                    return;
                }

                // Insertion du rdvLecture dans la table rdvlectures
                if(!await rdvLecture.createRdvLecture(userId, speaker, title, text, bookId, authorId, image, dateStart, dateStop, link)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion du rdvLecture dans la base de données");
                    return;
                } else {
                    handlingRes.default(res, 200, "Insertion du rdvLecture dans la base de données rdvLecture réussie!");
                }

                // Envoi d'une notification à tous les lecteurs (user) intéressés par l'auteur mentionné
                let tabIdFollowers = await users.getFollowersList(authorId, "authors");
                if (tabIdFollowers.length != 0) {                    
                    tabIdFollowers.forEach((row) => {
                        users.addNotification(row, "Nouveau rdvLecture conseillé de la part de " + speaker + "!");
                    });
                }

                // Envoi d'une notification à tous les lecteurs (user) intéressés par le livre mentionné
                tabIdFollowers = await users.getFollowersList(bookId, "books");
                if (tabIdFollowers.length != 0) {                    
                    tabIdFollowers.forEach((row) => {
                        users.addNotification(row, "Nouveau rdvLecture conseillé de la part de " + speaker + "!");
                    });
                }
            } 
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Modification d'un rdvLecture
        .post("/:rdvLecture_id", async (req, res) => {
            try {
                const rdvLectureId = req.params.rdvLecture_id;
                const { userId, speaker, title, text, image, dateStart, dateStop, link } = req.body;
                
                // Erreur : paramètre manquant
                if (!userId || !speaker || !title || !text || !image || !dateStart || !dateStop || !link) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId, speaker, title, text, image, dateStart, dateStop, link>");
                    return;
                }

                // Vérification si ce lecteur (user) est l'auteur du rdv dans la table rdvlectures
                if(!await rdvLecture.rdvIsMine(userId, rdvLectureId)) {
                    handlingRes.default(res, 406, "Modification du rdvLecture non authorisé");
                    return;
                }

                // Mise à jour du rdvLecture dans la table rdvlectures
                if(! await rdvLecture.modifyRdvLecture(rdvLectureId, speaker, title, text, image, dateStart, dateStop, link)) {
                    handlingRes.default(res, 409, "Problème lors de la modification du rdvLecture dans la base de données");
                } else {
                    handlingRes.default(res, 200, "Mise à jour du rdvLecture dans la base de données effectuée");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Suppression d'un rdvLecture
        .delete("/:rdvLecture_id", async (req, res) => {

            try {
                const rdvLectureId = req.params.rdvLecture_id;
                const { userId } = req.body;

                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
                    return;
                }

                // Vérification si ce lecteur (user) est l'auteur du rdv dans la table rdvlectures
                if(!await rdvLecture.rdvIsMine(userId, rdvLectureId)) {
                    handlingRes.default(res, 406, "Modification du rdvLecture non authorisée");
                    return;
                }

                // Suppression du rdvLecture de la table rdvlectures
                if(! await rdvLecture.deleteRdvLecture(rdvLectureId)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression du rdvLecture dans la base de données");
                } else {
                    handlingRes.default(res, 200, "rdvLecture annulé avec succès!")
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Ajout d'un rdv à la liste des favoris (follow)
        .put("/search/rdvLecture/:rdvLecture_id", async (req, res) => {

            try {
                const { userId } = req.body;
                const rdvLectureId = req.params.rdvLecture_id;
                
                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
                    return;
                }

                // Vérification si le rdvLecture existe dans la table rdvLecture
                if (! await rdvLecture.existsRdvLecture(rdvLectureId)) {
                    handlingRes.default(res, 404, "rdvLecture non trouvé dans la base de données");
                    return;
                }

                // Erreur : la préference est déjà présente dans la table followers
                if(await followers.alreadyFollowed(userId, rdvLectureId, "rdvLecture")) {
                    handlingRes.default(res, 409, "Préference déjà existante dans la base de données");
                    return;
                }

                // Insertion de la préference pour ce rdv dans la table followers (follow)
                if(! await followers.follow(userId, rdvLectureId, "rdvLecture")) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion de la préférence dans la base de données (follow)");
                } else{
                    handlingRes.default(res, 200, "rdvLecture ajoutée aux favorites (follow)");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Obtention des rdvLecture favoris
        .get("/:user_id/rdvLectureList", async (req, res) => {
            try {
                const userId = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
                    return;
                }

                // Obtention de la liste de rdvLecture favoris du lecteur (user) dans la table followers
                let tabRdvLecture = await followers.getFollowedList(userId, "rdvLecture");
                if (tabRdvLecture.length != 0) {                    
                    let tabRDV = tabRdvLecture.toString();
                    handlingRes.default(res, 200, "Liste de rdvLecture trouvée dans la base de données", tabRDV);
                }
                else {
                    handlingRes.default(res, 404, "Liste de rdvLecture vide dans la base de données");
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });     

    router
        // Suppression d'un rdvLecture de la liste des favoris (unfollow)
        .delete("/:user_id/rdvLectureList/:rdvLecture_id", async (req, res) => {
            try {
                const userId = req.params.user_id;
                const rdvLectureId = req.params.rdvLecture_id;

                // Erreur : paramètre manquant
                if (!userId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <userId>");
                    return;
                }

                // Vérification si le rdvLecture existe dans la table rdvLecture
                if (! await rdvLecture.existsRdvLecture(rdvLectureId)) {
                    handlingRes.default(res, 404, "rdvLecture non trouvé dans la base de données");
                    return;
                }

                // Vérification si la préférence existe dans la table followers
                if(await followers.alreadyFollowed(userId, rdvLectureId, "rdvLecture")) {
                    handlingRes.default(res, 404, "Préférence non trouvée dans la base de données");
                    return;
                }

                // Suppression de la préference pour ce rdvLecture de la table followers (unfollow)
                if (! await followers.unFollow(userId, rdvLectureId, "rdvLecture")) {
                    handlingRes.default(res, 409, "Problème lors de la suppression de la préférence dans la base de données (unfollow)");
                } 
                else{
                    handlingRes.default(res, 200, "rdvLecture retirée des favorites (unfollow)");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Obtention de la liste des rdvLecture favoris
        .get("/:entity/:entity_id/rdvLectureList", async (req, res) => {
            try {

                let { n } = req.body; // n = nombre de lignes à visualiser
                const entity = req.params.entity;
                const entityId = req.params.entity_id;
                
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

                // Vérification si l'entité (livre ou auteur) existe dans les tables books ou authors
                if(! await users.entityExists(entityId, entity)) {
                    handlingRes.default(res, 404, "Entité non trouvée dans la base de données");
                    return;
                }

                // Paramètre manquant : initialisation par défaut
                if (!n) {
                    n = 10;
                }

                // Obtention de la liste de rdvLecture concernant cette entité (auteur ou livre)  
                let tabRdvLecture = await rdvLecture.getThisEntityRdvList(entityId, entity, n);          
                if (tabRdvLecture.length != 0) {                    
                    let tabRDV = tabRdvLecture.toString();
                    handlingRes.default(res, 200, "Liste de rdvLecture trouvée dans la base de données", tabRDV);
                }
                else {
                    handlingRes.default(res, 404, "Liste de rdvLecture vide dans la base de données");
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

