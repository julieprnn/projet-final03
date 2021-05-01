const express = require('express');
const Users = require("./entities/users");
const Friends = require("./entities/friends");
const Followers = require("./entities/followers");
const handlingRes = require("./entities/handlingRes");

const router = express.Router();



function init(db) {

    // On utilise JSON
    router.use(express.json());
    
    // Affichage pour toute requête sur http://localhost:4000/users 
    router.use((req, res, next) => {
        console.log('----------------------------------------------------');
        console.log('API_FOLLOWERS -----> method : %s, path : %s', req.method, req.path);
        console.log('\nBody :', req.body);
        next();
    });



    //-------------------------------------------------------------------------------------------------
    //                                        Followers management
    //-------------------------------------------------------------------------------------------------

    // Instanciation de la classe Followers en passant en paramètre le database sqlite
    const followers = new Followers.default(db);



    router
        // Ajout d'un livre ou d'un auteur à la liste des favoris (follow)
        .put(":entity/:entity_id", async (req, res) => {

            try {
                const { login } = req.body;
                const entity = req.params.entity;
                const entityId = req.params.entity_id;
                
                // Erreur : paramètre manquant
                if (!login || !entity || !entityId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, entity, entityId>");
                    return;
                }
                
                // Erreur : entité non réconnue
                if (entity != "books" && entity != "authors") {
                    handlingRes.default(res, 406, "Entité non réconnue");
                    return;
                }

                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }

                // Erreur : l'entité n'est pas présente dans la table books ou authors
                if (! await users.entityExists(entityId, entity)) {
                    handlingRes.default(res, 404, "Entité non trouvée dans la base de données");
                    return;
                }

                // Obtention de l'identifiant du lecteur (user) dans la table users
                let idU = await users.getIdUser(login);

                // Obtention de l'identifiant de l'entité dans la table followers
                let idE = await users.getIdBook(entityId);

                // Erreur : la préference est déjà présente dans la table followers
                if (await followers.alreadyFollowed(idU,idE, entity)) {
                    handlingRes.default(res, 409, "Préference déjà existante dans la base de données");
                    return;
                }

                // Insertion de la préference pour cette entité dans la table followers (follow)
                if (! await followers.follow(idU, idE, entity)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion de la préférence dans la base de données (follow)");
                }
                else {
                    handlingRes.default(res, 200, "Entité ajoutée aux favorites (follow)");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Suppression d'un livre ou d'un auteur de la liste des favoris (unfollow)
        .delete(":entity/:entity_id", async (req, res) => {

            try {
                const { login } = req.body;
                const entity = req.params.entity;
                const entityId = req.params.entity_id;
                
                // Erreur : paramètre manquant
                if (!login || !entity || !entityId) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, entity, entityId>");
                    return;
                }
                
                // Erreur : entité non réconnue
                if (entity != "books" && entity != "authors") {
                    handlingRes.default(res, 406, "Entité non réconnue");
                    return;
                }

                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }

                // Erreur : l'entité n'est pas présente dans la table books ou authors
                if (! await users.entityExists(entityId, entity)) {
                    handlingRes.default(res, 404, "Entité non trouvée dans la base de données");
                    return;
                }

                // Obtention de l'identifiant du lecteur (user) dans la table users
                let idU = await users.getIdUser(login);

                // Obtention de l'identifiant de l'entité dans la table followers
                let idE = await followers.getIdEntity(entityId, entity);

                // Erreur : la préference n'est pas présente dans la table followers
                if (! await followers.alreadyFollowed(idU, idE, entity)) {
                    handlingRes.default(res, 404, "Préference non trouvée dans la base de données");
                    return;
                }

                // Suppression de la préference pour cette entité de la table followers (unfollow)
                if (! await followers.unFollow(idU, idE, entity)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression de la préférence dans la base de données (unfollow)");
                } 
                else{
                    handlingRes.default(res, 200, "Entité retirée des favorites (unfollow)");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Obtention de la liste des livres favoris
        .get("/:user_login/booksList", async (req, res) => {
            try {
                const login = req.params.user_login;
                
                // Erreur : paramètre manquant
                if (!login) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login>");
                    return;
                }

                // Obtention de l'identifiant du lecteur (user) dans la table users
                let idU= await users.getIdUser(login);

                // Obtention de la liste de livres favoris du lecteur (user) dans la table followers
                let tabBooks = await followers.getFollowedList(idU, "books"); 
                if (tabBooks.length != 0) {                    
                    let tabB = tabBooks.toString();
                    handlingRes.default(res, 200, "Liste de livres trouvée dans la base de données", tabB);
                }
                else {
                    handlingRes.default(res, 404, "Liste de livres vide dans la base de données");
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Obtention de la liste d'auteurs favoris
        .get("/:user_login/authorsList", async (req, res) => {

            try {
                const login = req.params.user_login;
                
                // Erreur : paramètre manquant
                if (!login) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login>");
                    return;
                }

                // Obtention de l'identifiant du lecteur (user) dans la table users
                let idU = await users.getIdUser(login);

                // Obtention de la liste d'auteurs favoris du lecteur (user) dans la table followers
                let tabAuthors = await followers.getFollowedList(idU, "authors");
                if (tabAuthors.length != 0) {                    
                    let tabA = tabAuthors.toString();
                    handlingRes.default(res, 200, "Liste d'auteurs trouvée dans la base de données", tabA);
                }
                else {
                    handlingRes.default(res, 404, "Liste d'auteurs vide dans la base de données");
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

