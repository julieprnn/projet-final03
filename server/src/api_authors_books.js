const express = require('express');
const users = require("./entities/users");
const AuthorsBooks = require("./entities/authors_books");
const Followers = require("./entities/followers");
const handlingRes = require("./entities/handlingRes");

const router = express.Router();



function init(db) {

    // On utilise JSON
    router.use(express.json());
    
    // Affichage pour toute requête sur http://localhost:4000/birdy
    router.use((req, res, next) => {
        console.log('----------------------------------------------------');
        console.log('API_AUTHORS_BOOKS -----> method : %s, path : %s', req.method, req.path);
        console.log('\nBody :', req.body);
        next();
    });


    //-------------------------------------------------------------------------------------------------
    //                                      Authors & books management
    //-------------------------------------------------------------------------------------------------

    // Instanciation de la classe AuthorsBooks en passant en paramètre le database sqlite
    const authorsBooks = new AuthorsBooks.default(db);



    router
        // Création d'un nouveau livre
        .put("/insertNewBook", async (req, res) => {
            try {
                const login = req.params.user_login;
                const { firstnameAuthor, lastnameAuthor, aliasAuthor, title } = req.body;

                // Erreur : paramètre manquant
                if (!login || !title || !(aliasAuthor || (firstnameAuthor && lastnameAuthor))) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, title, aliasAuthor ou (firstnameAuthor and lastnameAuthor)>");
                    return;
                }
                
                // Obtention de l'identifiant de l'auteur dans la table authors
                const idA = await authorsBooks.getIdAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor);

                if (idA){
                    // Obtention de l'identifiant du livre dans la table books
                    const idB = await authorsBooks.getIdBook(idA, title);
                    if (!idB){
                        // Insertion du livre dans la table books
                        if (! await authorsBooks.createBook(idA, title)){
                            handlingRes.default(res, 409, "Problème lors de l'insertion du livre dans la base de données");
                            return;
                        } 
                        else {
                            handlingRes.default(res, 200, "Insertion du livre dans la base de données books réussie!");

                            // Envoi d'une notification à tous les lecteurs (user) intéressés par l'auteur du livre
                            const tabIdFollowers = await users.getFollowersList(idA, "authors");
                            if (tabIdFollowers.length != 0) {                    
                                tabIdFollowers.forEach((row) => {
                                    users.addNotification(row, "Lecture conseillée : '" + title + "'");
                                });
                            }
                        }
                    } 
                    else {
                        // Erreur : le livre est déjà présent dans la table books
                        handlingRes.default(res, 409, "Livre déjà existant dans la base de données");
                    }
                } 
                else {
                    // Erreur : l'auteur n'est pas présent dans la table authors
                    handlingRes.default(res, 404, "Auteur non trouvé dans la base de données");
                    return;
                }
            } 
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Création d'un nouvel auteur
        .put("/insertNewAuthor", async (req, res) => {
            try{
                const login = req.params.user_login;
                const { firstnameAuthor, lastnameAuthor, aliasAuthor} = req.body;

                // Erreur : paramètre manquant
                if (!login || !(aliasAuthor || (firstnameAuthor && lastnameAuthor))) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, aliasAuthor ou (firstnameAuthor and lastnameAuthor)>");
                    return;
                }
                // Obtention de l'identifiant de l'auteur dans la table authors
                const idA = await authorsBooks.getIdAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor);

                if (!idA){
                    // Insertion de l'auteur dans la table authors
                    if (! await authorsBooks.createAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor)){
                        handlingRes.default(res, 409, "Problème lors de l'insertion de l'auteur dans la base de données");
                        return;
                    } 
                    else {
                        handlingRes.default(res, 200, "Insertion de l'auteur dans la base de données authors réussie!");
                    }
                } 
                else {
                    // Erreur : l'auteur est déjà présent dans la table authors 
                    handlingRes.default(res, 409, "Auteur déjà existant dans la base de données");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
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
                if (! await authorsBooks.entityExists(entityId, entity)) {
                    handlingRes.default(res, 404, "Entité non trouvée dans la base de données");
                    return;
                }

                // Obtention de l'identifiant du lecteur (user) dans la table users
                let idU = await users.getIdUser(login);

                // Obtention de l'identifiant de l'entité dans la table followers
                let idE = await authorsBooks.getIdBook(entityId);

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
                if (! await authorsBooks.entityExists(entityId, entity)) {
                    handlingRes.default(res, 404, "Entité non trouvée dans la base de données");
                    return;
                }

                // Obtention de l'identifiant du lecteur (user) dans la table users
                let idU = await users.getIdUser(login);

                // Obtention de l'identifiant de l'entité dans la table authors ou books
                let idE = await authorsBooks.getIdEntity(entityId, entity);

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



    //-------------------------------------------------------------------------------------------------
    //                                        Search management
    //-------------------------------------------------------------------------------------------------

    router
        // Recherche d'un livre ou d'un auteur
        .get("/search/:entity", async (req, res) => {
    
            try {
                const entity = req.params.entity;

                // Erreur : entité non réconnue
                if (entity != "books" && entity != "authors") {
                    handlingRes.default(res, 406, "Entité non réconnue");
                    return;
                }

                // Obtention de la liste des entités preferées (livre ou auteurs) du lecteur (user) dans la table followers
                let tabE = await authorsBooks.getEntitiesList(entity);               
                if (tabE.length != 0) {                    
                    handlingRes.default(res, 200, "Liste " + entity + " trouvée dans la base de données", tabE);
                }
                else {
                    handlingRes.default(res, 404, "Liste " + entity + " vide dans la base de données");
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

