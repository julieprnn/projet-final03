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
        console.log('API_USERS -----> method : %s, path : %s', req.method, req.path);
        console.log('\nBody :', req.body);
        next();
    });


    //-------------------------------------------------------------------------------------------------
    //                                        Users management
    //-------------------------------------------------------------------------------------------------

    // Instanciation de la classe Users en passant en paramètre le database sqlite
    const users = new Users.default(db);



    router
        // Création d'un nouvel lecteur (user)
        .put("/", async (req, res) => {
            try {
                const { login, password, lastname, firstname } = req.body;

                // Erreur : paramètre manquant
                if (!login || !password) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, password>");
                    return;
                } 
                
                // Erreur : il existe déjà un lecteur (user) avec ce login
                if (await users.exists(login)){
                    handlingRes.default(res, 409, "Il existe déjà un lecteur (user) avec ce login");
                    return;
                }
                
                // Insertion du lecteur (user) dans la table users
                if (!await users.create(login, password, lastname, firstname)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion du lecteur (user) dans la base de données");
                    return;
                } 
                else {
                    handlingRes.default(res, 200, "Insertion du lecteur (user) dans la base de données users réussie!");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Création d'un nouveau livre
        .put("/:user_login/insertNewBook", async (req, res) => {
            try {
                const login = req.params.user_login;
                const { firstnameAuthor, lastnameAuthor, aliasAuthor, title } = req.body;

                // Erreur : paramètre manquant
                if (!login || !title || !(aliasAuthor || (firstnameAuthor && lastnameAuthor))) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, title, aliasAuthor ou (firstnameAuthor and lastnameAuthor)>");
                    return;
                }
                
                // Obtention de l'identifiant de l'auteur dans la table authors
                const idA = await users.getIdAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor);

                if (idA){
                    // Obtention de l'identifiant du livre dans la table books
                    const idB = await users.getIdBook(idA, title);
                    if (!idB){
                        // Insertion du livre dans la table books
                        if (! await users.createBook(idA, title)){
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
        .put("/:user_login/insertNewAuthor", async (req, res) => {
            try{
                const login = req.params.user_login;
                const { firstnameAuthor, lastnameAuthor, aliasAuthor} = req.body;

                // Erreur : paramètre manquant
                if (!login || !(aliasAuthor || (firstnameAuthor && lastnameAuthor))) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, aliasAuthor ou (firstnameAuthor and lastnameAuthor)>");
                    return;
                }
                // Obtention de l'identifiant de l'auteur dans la table authors
                const idA = await users.getIdAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor);

                if (!idA){
                    // Insertion de l'auteur dans la table authors
                    if (! await users.createAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor)){
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

    
    router
        // Login : accès à un compte utilisateur  
        .post("/login", async (req, res, next) => {
            try {
                const { login, password } = req.body;
                
                // Erreur : paramètre manquant
                if (!login || !password) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, password>");
                    return;
                }

                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }

                // Vérification si le mot de passe est correct
                let userid = await users.checkpassword(login, password);
                
                // S'il existe un lecteur (user) avec tel login et mot de passe : connexion à la session du lecteur (user)
                if (userid) {
                    // Vérification si un cookie est présent dans la réquête
                    let cookie = req.cookies.cookieName;
                    if (cookie === undefined) {
                        // Création d'un nouveau cookie
                        var randomNumber=Math.random().toString();
                        randomNumber=randomNumber.substring(2,randomNumber.length);
                        res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
                        handlingRes.default(res, 200, "Nouveau cookie crée avec succés!");
                    } else {
                        // Le cookie est déjà existant
                        handlingRes.default(res, 200, "Cookie existant : login effectué!");
                    } 
                    return;
                } else {
                    // Erreur : le lecteur (user) n'est pas présent dans la table users
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;  
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        .route("/:user_login")
        // Obtention de la page profil du lecteur (user)
        .get(async (req, res, next) => {
            try {
                const login = req.params.user_login;
                if (!login){
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login>");
                    return;
                }
                else {
                    res.send("____Page profil de l'utilisateur____");
                    next();
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        })

    router
        // Modification du mot de passe du lecteur (user)
        .post("/settings/modify-password/:user_login", async (req, res) => {
            try {
                const { password, newPassword } = req.body;
                const login = req.params.user_login;
                
                // Erreur : paramètre manquant
                if (!login || !password || !newPassword ) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, password, newPassword>");
                    return;
                }
    
                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }
    
                // Vérification si le mot de passe est correct
                let userid = await users.checkpassword(login, password);
                
                if (userid) {
                    // Mise à jour du mot de passe dans la table users
                    if (! await users.modifyUser(login, password, newPassword)) {
                        handlingRes.default(res, 409, "Problème lors de la modification du mot de passe");
                    }
                    else {
                        handlingRes.default(res, 200, "Mot de passe modifié avec succès!");
                    }
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });
    
    router
        // Désinscription : suppression du lecteur (user)
        .delete("/settings/delete-account/:user_login", async (req, res) => {
            try {
                const { password } = req.body;
                const login = req.params.user_login;
                
                // Erreur : paramètre manquant
                if (!login || !password) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login, password>");
                    return;
                }
    
                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }
    
                // Vérification si le mot de passe est correct
                let userid = await users.checkpassword(login, password);
                
                if (userid) {
                    // Suppression du lecteur (user) de la table users
                    if (! await users.deleteUser(login, password)) {
                        handlingRes.default(res, 409, "Problème lors de la désinscription du lecteur (user) dans la base de données");
                    }
                    else {
                        handlingRes.default(res, 409, "Désinscription lecteur (user) effectuée avec succès");
                    }
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });



    //-------------------------------------------------------------------------------------------------
    //                                        Friends management
    //-------------------------------------------------------------------------------------------------

    const friends = new Friends.default(db);


    router
        // Envoie d'une demande d'amitié vers un lecteur cible
        .put("/:user_login", async (req, res) => {

            try {
                const { login } = req.body;         // user demandeur
                const login2 = req.params.user_login;  // user cible
                
                // Erreur : paramètre manquant
                if (!login || !login2) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login>");
                    return;
                }

                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login2)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }

                // Obtention des identifiants des deux lecteurs (users) dans la table users
                let id1 = await users.getIdUser(login);
                let id2 = await users.getIdUser(login2);

                // Erreur : le demandeur et la cible sont le même lecteur (user)
                if (id1 === id2) {
                    handlingRes.default(res, 406, "Demande d'amitié non autorisée");
                    return;
                }

                // Erreur : les deux lecteurs (user) sont déjà amis
                if (await friends.existsFriendship(id1,id2)) {
                    handlingRes.default(res, 409, "Demande d'amitié non autorisée : amitié déjà existant dans la base de données");
                    return;
                }

                // Si le lecteur cible (user) avait déjà envoyé une demande d'amitié à ce lecteur (user) précedemment,
                // alors ce lecteur accepte directement la demande en attente du lecteur cible
                // Mise à jour de la table friends : demanding = 1, accepting = 1
                if (await friends.existsDemanding(id2,id1)) {
                    await friends.acceptFriend(id1, id2);
                    handlingRes.default(res, 200, "Nouvelle amitié confirmée!");

                    // Envoie d'une notification au lecteur demandeur (user)
                    await users.addNotification(id2, login + " a accepté ta demande d'amitié"); 
                    return;
                }
                
                // Insertion de la demande d'amitié dans la table friends : demanding = 1, accepting = 0
                if (! await friends.addFriend(id1, id2)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion de la demande d'amitié dans la base de données");
                } 
                else {
                    handlingRes.default(res, 200, "Demande d'amitié envoyée");

                    // Envoie d'une notification au lecteur cible (user)
                    await users.addNotification(id2, login + " te propose une demande d'amitié"); 
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Affichage de la liste des notifications les plus récentes
        .get("/:user_login/notifications", async (req, res) => {

            try {
                const login = req.params.user_login;
                let { n } = req.body;
                
                // Erreur : paramètre manquant
                if (!login) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login>");
                    return;
                }

                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }

                // Obtention de l'identifiant du lecteur (user) dans la table users
                let userId = await users.getIdUser(login);

                // Obtention de la liste de notifications du lecteur (user)
                let tabN = await users.getNotificationsList(userId)
                if (tabN.length != 0) {                    
                    handlingRes.default(res, 200, "Liste de notifications trouvée dans la base de données", tabN);
                }
                else {
                    handlingRes.default(res, 404, "Liste de notifications vide dans la base de données");
                    return;
                }
                
                // Paramètre manquant : initialisation par défaut
                if (!n){
                    n = 10;
                }

                // Suppression automatique des notifications anciennes de la table notifications : on ne garde que les n notifications les plus récentes
                await users.deleteNotificationsList(userId, n);
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Acceptation de la demande d'amitié en attente de la part d'un lecteur demandeur (user)
        .put("/:user_login/notifications", async (req, res) => {

            try {
                const { login2 } = req.body;        // user demandant
                const login = req.params.user_login;   // user cible
                
                // Erreur : paramètre manquant
                if (!login || !login2) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login2>");
                    return;
                }

                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login2)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }

                // Obtention des identifiants des deux lecteurs (users) dans la table users
                let id1 = await users.getIdUser(login);
                let id2 = await users.getIdUser(login2);

                // Vérification si une demande d'amitié existe dans la table friends
                if (!await friends.existsDemanding(id2,id1)) {
                    handlingRes.default(res, 404, "Demande d'amitié non trouvée dans la base de données");
                    return;
                }

                // Mise à jour de la table friends : demanding = 1, accepting = 1
                if (! await friends.acceptFriend(id1, id2)) {
                    handlingRes.default(res, 409, "Problème lors de l'insertion de la demande d'amitié dans la base de données");
                } 
                else{
                    handlingRes.default(res, 200, "Demande d'amitié acceptée");

                    // Envoie d'une notification au lecteur demandeur (user)
                    await users.addNotification(id2, login + " a accepté ta demande d'amitié"); 
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Rejet de la demande d'amitié en attente de la part d'un lecteur demandeur (user)
        .delete("/:user_login/notifications", async (req, res) => {

            try {
                const { login2 } = req.body;        // user demandant
                const login = req.params.user_login;   // user cible
                
                // Erreur : paramètre manquant
                if (!login || !login2) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login2>");
                    return;
                }

                // Vérification si un lecteur (user) avec ce login existe
                if (! await users.exists(login2)) {
                    handlingRes.default(res, 404, "Lecteur (user) non trouvé dans la base de données");
                    return;
                }

                // Obtention des identifiants des deux lecteurs (users) dans la table users
                let id1 = await users.getIdUser(login);
                let id2 = await users.getIdUser(login2);

                // Vérification si une demande d'amitié existe dans la table friends
                if(!await friends.existsDemanding(id2,id1)) {
                    handlingRes.default(res, 404, "Demande d'amitié non trouvée dans la base de données");
                    return;
                }

                // Suppression de la demande d'amitié de la table friends
                if (! await friends.rejectFriend(id1, id2)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression de la demande d'amitié de la base de données");
                } 
                else {
                    handlingRes.default(res, 200, "Demande d'amitié correctement rejetée");
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Affichage de la liste des amis du lecteur (user)
        .get("/:user_login/friendsList", async (req, res) => {

            try {
                const login = req.params.user_login;
                
                // Erreur : paramètre manquant
                if (!login) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login>");
                    return;
                }

                // Obtention de l'identifiant du lecteur (user) dans la table users
                let id = await users.getIdUser(login);

                // Obtention de la liste d'amis du lecteur dans la table friends
                let tabFriends = await friends.getFriendsList(id);
                if (tabFriends.length != 0) {                    
                    let tabF = tabFriends.toString();
                    handlingRes.default(res, 200, "Liste d'amis trouvée dans la base de données", tabF);
                }
                else {
                    handlingRes.default(res, 404, "Liste d'amis vide dans la base de données");
                return;
                }
            }
            catch (e) {
                // Erreur : erreur du server
                handlingRes.default(res, 500, e.toString());
            }
        });

    router
        // Suppression d'un lecteur ami (user) de la liste d'amis
        .delete("/:user_login/friendsList", async (req, res) => {

            try {
                const login = req.params.user_login;   // user qui supprime
                const { login2 } = req.body;        // user à supprimer
                
                // Erreur : paramètre manquant
                if (!login || !login2) {
                    handlingRes.default(res, 412, "Paramètre manquant. Usage : <login2>");
                    return;
                }

                // Obtention des identifiants des deux lecteurs (users) dans la table users
                let id1 = await users.getIdUser(login);
                let id2 = await users.getIdUser(login2);

                // Vérification si l'amitié existe dans la table friends
                if (!await friends.existsFriendship(id1,id2)) {
                    handlingRes.default(res, 404, "Amitié non trouvée dans la base de données");
                    return;
                }

                // Suppression de l'amitié de la table friends
                if (! await friends.rejectFriendship(id1, id2)) {
                    handlingRes.default(res, 409, "Problème lors de la suppression de l'amitié de la base de données");
                } 
                else {
                    handlingRes.default(res, 200, "Amitié correctement supprimée");
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
        // Affichage de la liste des livres favoris
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
        // Affichage de la liste d'auteurs favoris
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
                let tabE = await users.getEntitiesList(entity);               
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

