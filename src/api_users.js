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

    // Instanciation de la classe Users avec le database sqlite
    const users = new Users.default(db);


    // Création d'un nouvel utilisateur
    router.put("/", async (req, res) => {
        try{
            const { login, password, lastname, firstname } = req.body;

            // Erreur : paramètre manquant
            if (!login || !password) {
                handlingRes.default(res, 412, "Requête invalide : paramètre manquant, login et password nécessaires");
                return;
            } 
            
            // Erreur : il existe déjà un utilisateur avec ce login
            else if (await users.exists(login)){
                handlingRes.default(res, 409, "Utilisateur déjà existant");
            }
            
            // Insertion de l'utilisateur dans la BD
            else {    
                users.create(login, password, lastname, firstname)
                .then((user_id) => res.status(200).send({ id: user_id }))
                .catch((err) => res.status(500).send(err));
            }
        }
        catch {
            // Erreur : erreur du server
            handlingRes.default(res, 500);
        }
    });

    // Création d'un nouveau book
    router
        .put("/:user_id/insertNewBook", async (req, res) => {
            try{
                const login = req.params.user_id;
                const { firstnameAuthor, lastnameAuthor, aliasAuthor, title } = req.body;

                // Erreur : paramètre manquant
                if (!login || !title || !(aliasAuthor || (firstnameAuthor && lastnameAuthor))) {
                    handlingRes.default(res, 412, "Requête invalide : paramètre manquant");
                    return;
                }
                
                // Obtention de l'identifiant de l'auteur dans la table authors
                let idA = await users.getIdAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor);

                if (idA){
                    // Obtention de l'identifiant du livre dans la table books
                    let idB = await users.getIdBook(idA, title);
                    if (!idB){
                        // Erreur : insertion du livre non réussie dans la table books
                        if (! await users.createBook(idA, title)){
                            handlingRes.default(res, 409, "Problème insertion du livre dans la base de données");
                            return;
                        } 
                        else {
                            // Insertion du livre réussie dans la table books
                            handlingRes.default(res, 200, "Insertion du livre dans la base de données");
                            let tabIdFollowers = await users.getFollowersList(bookId, "books");
                            if (tabIdFollowers.length != 0) {                    
                                tabIdFollowers.forEach((row) => {
                                    await users.addNotification(row, "salut ca t interesse!");
                                });
                            }
                            await users.addNotification(id2, "Nouveau livre pour toi!");
                        }
                    } 
                    else {
                        // Erreur : le livre est déjà présent dans la table books
                        handlingRes.default(res, 409, "Livre déjà existant dans la base de données");
                    }
                } 
                else {
                    // Erreur : l'auteur n'est pas présent dans la table authors
                    handlingRes.default(res, 404, "Auteur inexistant dans la base de données");
                    return;
                }
            } 
            catch {
                // Erreur : erreur du server
                handlingRes.default(res, 500);
            }
        });

    router
        .put("/:user_id/insertNewAuthor", async (req, res) => {
            try{
                const login = req.params.user_id;
                const { firstnameAuthor, lastnameAuthor, aliasAuthor} = req.body;

                // Erreur : paramètre manquant
                if (!login || !(aliasAuthor || (firstnameAuthor && lastnameAuthor))) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login et title nécessaires"
                    });
                    return;
                }

                idA = await users.getIdAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor);

                if (!idA){
                    if (! await users.createAuthor(firstnameAuthor, lastnameAuthor, aliasAuthor)){
                        res.status(400).json({
                            status: 400,
                            "message": "Requête invalide : probleme insertion autheur"
                        });
                        return;
                    } else {
                        res.status(200).json({
                            status: 200,
                            "message": "insertion author ok"
                        });
                    }
                } else {
                    res.status(400).json({
                        status: 400,
                        "message": "author deja existant"
                    });
                }
            }
            catch{
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne",
                    //details: (e || "Erreur inconnue").toString()
                });
            }
        });

    // Login : accès à un compte utilisateur  
    router.post("/login", async (req, res, next) => {

        try {
            const { login, password } = req.body;
            
            // Erreur : paramètre manquant
            if (!login || !password) {
                res.status(400).json({
                    status: 400,
                    "message": "Requête invalide : paramètre manquant, login et password nécessaires"
                });
                return;
            }

            // Verification si l'utilisateur existe
            if(! await users.exists(login)) {
                res.status(401).json({
                    status: 401,
                    message: "Utilisateur inconnu"
                });
                return;
            }

            // Verification si le password est correct
            let userid = await users.checkpassword(login, password);
            
            // S'il existe un user avec tel login et password :
            // connexion avec middleware express-session
            if (userid) {
                // set a cookie
                // check if client sent cookie
                console.log('ici');
                let cookie = req.cookies.cookieName;
                if (cookie === undefined) {
                    // no: set a new cookie
                    var randomNumber=Math.random().toString();
                    randomNumber=randomNumber.substring(2,randomNumber.length);
                    res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
                    console.log('cookie created successfully');
                } else {
                    // yes, cookie was already present 
                    console.log('Cookie exists', cookie);
                    res.status(200).json({
                        status: 200,
                        message: "Login effectué"
                    });
                } 
                return;
            } else {
                res.status(401).json({
                    status: 401,
                    message: "Utilisateur inconnu X"
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
        .route("/:user_id")
        .get(async (req, res, next) => {
            try {
                const login = req.params.user_id;
                if (!login){
                    res.status(400).json({
                        status: 400,
                        "message": "User non trouvé"
                    });
                }
                else {
                    res.send("Page profil de l'utilisateur");
                    next();
                }
            }
            catch (e) {
                res.status(500).send(e);
            }
        })

    router
        .post("/settings/modify-password/:user_id", async (req, res) => {
            try {
                const { password, new_password } = req.body;
                const login = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!login || !password || !new_password ) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login et password nécessaires"
                    });
                    return;
                }
    
                // Verification si l'utilisateur existe
                if(! await users.exists(login)) {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur inconnu"
                    });
                    return;
                }
    
                // Verification si le password est correct
                let userid = await users.checkpassword(login, password);
                
                if (userid) {
                    if(! await users.modifyUser(login, password, new_password)) {
                        res.status(400).json({
                            status: 400,
                            message: "Erreur pendant update"
                        });
                    }
                    else{
                        console.log('update ok');
                        res.status(200).json({
                            status: 200,
                            message: "update ok"
                        });
                    }
                } else {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur inconnu X"
                    });
                }
                return;
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
        .delete("/settings/delete-account/:user_id", async (req, res) => {
            try {
                const { password } = req.body;
                const login = req.params.user_id;
                
                
                // Erreur : paramètre manquant
                if (!login || !password) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login et password nécessaires"
                    });
                    return;
                }
    
                // Verification si l'utilisateur existe
                if(! await users.exists(login)) {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur inconnu"
                    });
                    return;
                }
    
                // Verification si le password est correct
                let userid = await users.checkpassword(login, password);
                
                if (userid) {
                    if(! await users.deleteUser(login, password)) {
                        res.status(400).json({
                            status: 400,
                            message: "Erreur pendant suppression"
                        });
                    }
                    else{
                        console.log('User supprimé');
                        res.status(200).json({
                            status: 200,
                            message: "User supprimé"
                        });
                    }
                } else {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur inconnu X"
                    });
                }
                return;
            }
            catch (e) {
                // Toute autre erreur
                res.status(500).json({
                    status: 500,
                    message: "Erreur interne L",
                    details: (e || "Erreur inconnue").toString()
                });
                return;
            }
        });

//-------------------------------------------------------------------------------------------------
    const friends = new Friends.default(db);
//-------------------------------------------------------------------------------------------------


    router
        //Demander amitie
        .put("/:user_id", async (req, res) => {

            try {
                const { login } = req.body;
                const login2 = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!login || !login2) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                // Verification si l'utilisateur existe
                if(! await users.exists(login2)) {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur 2 inconnu"
                    });
                    return;
                }

                let id1 = await users.getIdUser(login);
                let id2 = await users.getIdUser(login2);

                if (id1 === id2) {
                    console.log("impossible devenir amis de soi meme");
                    res.status(401).json({
                        status: 401,
                        message: "impossible devenir amis de soi meme"
                    });
                    return;
                }

                // Verification si l'utilisateur existe
                if(await friends.existsFriendship(id1,id2)) {
                    res.status(401).json({
                        status: 401,
                        message: "Amitie dejà existante"
                    });
                    return;
                }

                if( await friends.existsDemanding(id2,id1)) {
                    await friends.acceptFriend(id1, id2);
                    res.status(200).json({
                        status: 200,
                        message: "Acceptation automatique pending frendship"
                    });
                    return;
                }

                if(! await friends.addFriend(id1, id2)) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant amitie"
                    });

                } else{
                    console.log('demande amitie envoyee');
                    res.status(200).json({
                        status: 200,
                        message: "demande amitie envoyee"
                    });
                    await users.addNotification(id2, "Nouvelle demande amitié de la part de " + login); 
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
        .get("/:user_id/notifications", async (req, res) => {

            try {
                const login = req.params.user_id;
                let { n } = req.body;
                
                // Erreur : paramètre manquant
                if (!login) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                // Verification si l'utilisateur existe
                if(! await users.exists(login)) {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur inconnu"
                    });
                    return;
                }

                let userId = await users.getIdUser(login);

                if(! await users.getNotificationsList(userId)) {
                    res.status(400).json({
                        status: 400,
                        message: "liste non trouvee"
                    });

                } else{
                    console.log('liste trouvee');
                    res.status(200).json({
                        status: 200,
                        message: "liste trouvee"
                    });                        
                    if (!n){
                        n = 10;
                    }
                    await users.deleteNotificationsList(userId, n);
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

        // accepter amitie
    router
        .put("/:user_id/notifications", async (req, res) => {

            try {
                const { login2 } = req.body; // user demandant
                const login = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!login || !login2) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                // Verification si l'utilisateur existe
                if(! await users.exists(login2)) {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur 2 inconnu"
                    });
                    return;
                }

                let id1 = await friends.getIdUser(login);
                let id2 = await friends.getIdUser(login2);

                // Verification si l'utilisateur existe
                if(!await friends.existsDemanding(id2,id1)) {
                    res.status(401).json({
                        status: 401,
                        message: "demande amitie non existante"
                    });
                    return;
                }

                if(! await friends.acceptFriend(id1, id2)) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant amitie"
                    });

                } else{
                    console.log('demande amitie acceptee');
                    res.status(200).json({
                        status: 200,
                        message: "demande amitie acceptee"
                    });
                    await users.addNotification(id2, "Maintenant toi et " + login + "etes amis!");
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
        .delete("/:user_id/notifications", async (req, res) => {

            try {
                const { login2 } = req.body; // user demandant
                const login = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!login || !login2) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                // Verification si l'utilisateur existe
                if(! await users.exists(login2)) {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur 2 inconnu"
                    });
                    return;
                }

                let id1 = await users.getIdUser(login);
                let id2 = await users.getIdUser(login2);

                // Verification si l'utilisateur existe
                if(!await friends.existsDemanding(id2,id1)) {
                    res.status(401).json({
                        status: 401,
                        message: "demande amitie prrrr"
                    });
                    return;
                }

                if(! await friends.rejectFriend(id1, id2)) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant amitie"
                    });

                } else{
                    console.log('demande amitie rejetee');
                    res.status(200).json({
                        status: 200,
                        message: "demande amitie rejetee"
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
        .get("/:user_id/friendsList", async (req, res) => {

            try {
                const login = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!login) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                let id = await friends.getIdUser(login);

                // Verification si l'utilisateur existe
                let tabFriends = await friends.getFriendsList(id);
                
                if (tabFriends.length != 0) {                    
                    let tabF = tabFriends.toString();
                    res.status(200).json({
                        status: 200,
                        message: "liste d'amis trouvée",
                        listFriends: tabF
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
        .delete("/:user_id/friendsList", async (req, res) => {
            try {
                const login = req.params.user_id;
                const { login2 } = req.body;
                
                // Erreur : paramètre manquant
                if (!login || !login2) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                let id1 = await friends.getIdUser(login);
                let id2 = await friends.getIdUser(login2);

                 // Verification si l'utilisateur existe
                 if(!await friends.existsFriendship(id1,id2)) {
                    res.status(401).json({
                        status: 401,
                        message: "Amitie inexistante"
                    });
                    return;
                }

                if(! await friends.rejectFriendship(id1, id2)) {
                    res.status(400).json({
                        status: 400,
                        message: "Erreur pendant suppression amitie"
                    });

                } else {
                    console.log('amitie supprimee');
                    res.status(200).json({
                        status: 200,
                        message: "amitie supprimee"
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
    const followers = new Followers.default(db);
//-------------------------------------------------------------------------------------------------


    router
        //Follow book
        .put(":entity/:entity_id", async (req, res) => {

            try {
                const { login } = req.body;
                const entity = req.params.entity;
                const entity_id = req.params.entity_id;
                
                // Erreur : paramètre manquant
                if (!login || !entity || !entity_id) {
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

                // Verification si l'utilisateur existe
                if(! await users.exists(login)) {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur inconnu"
                    });
                    return;
                }

                if(! await users.entityExists(entity_id, entity)) {
                    res.status(401).json({
                        status: 401,
                        message: "entity non trouve"
                    });
                    return;
                }

                let idU = await users.getIdUser(login);
                let idE = await users.getIdBook(entity_id);

                // Verification si l'utilisateur existe
                if(await followers.alreadyFollowed(idU,idE, entity)) {
                    res.status(401).json({
                        status: 401,
                        message: "dejà followed"
                    });
                    return;
                }

                if(! await followers.follow(idU, idE, entity)) {
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

    router
        //unFollow book
        .delete(":entity/:entity_id", async (req, res) => {

            try {
                const { login } = req.body;
                const entity = req.params.entity;
                const entity_id = req.params.entity_id;
                
                // Erreur : paramètre manquant
                if (!login || !entity || !entity_id) {
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

                // Verification si l'utilisateur existe
                if(! await users.exists(login)) {
                    res.status(401).json({
                        status: 401,
                        message: "Utilisateur inconnu"
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

                let idU = await users.getIdUser(login);
                let idE = await followers.getIdEntity(entity_id, entity);

                // Verification si l'utilisateur existe
                if(await followers.alreadyFollowed(idU, idE, entity)) {
                    res.status(401).json({
                        status: 401,
                        message: "dejà followed"
                    });
                    return;
                }

                if(! await followers.unFollow(idU, idE, entity)) {
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
        .get("/:user_id/booksList", async (req, res) => {

            try {
                const login = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!login) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                let idU= await users.getIdUser(login);

                // Verification si l'utilisateur existe
                let tabBooks = await followers.getFollowedList(idU, "books");
                
                if (tabBooks.length != 0) {                    
                    let tabB = tabBooks.toString();
                    res.status(200).json({
                        status: 200,
                        message: "liste books trouvée",
                        listFriends: tabB
                    });
                }
                else {
                    res.status(401).json({
                        status: 401,
                        message: "liste books inexistant"
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
        .get("/:user_id/authorsList", async (req, res) => {

            try {
                const login = req.params.user_id;
                
                // Erreur : paramètre manquant
                if (!login) {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : paramètre manquant, login1 et login2 nécessaires"
                    });
                    return;
                }

                let idU = await users.getIdUser(login);

                // Verification si l'utilisateur existe
                let tabAuthors = await followers.getFollowedList(idU, "authors");
                
                if (tabAuthors.length != 0) {                    
                    let tabA = tabAuthors.toString();
                    res.status(200).json({
                        status: 200,
                        message: "liste authors trouvée",
                        listAuthors: tabA
                    });
                }
                else {
                    res.status(401).json({
                        status: 401,
                        message: "liste authors inexistant"
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
        .get("/search/:entity", async (req, res) => {
    
            try {
                const entity = req.params.entity;

                // Erreur : paramètre manquant
                if (entity != "books" && entity != "authors") {
                    res.status(400).json({
                        status: 400,
                        "message": "Requête invalide : entity inconnue"
                    });
                    return;
                }

                let tab = await users.getEntitiesList(entity);
                console.log(tab);
                
                if (tab.length != 0) {                    
                    res.status(200).json({
                        status: 200,
                        message: "liste trouvée",
                        list: tab
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



    return router;
}

exports.default = init;



//-----------------------------TESTS-------------------------------

// test PUT { "login": "052", "password" : "bibi", "lastname":"boh", "firstname":"mela" }
// test PUT { "login":"K", "password":"albero_euh", "lastname": "Loi", "firstname": "Ale"}

//-------------------------------tab------------------------------

// tabFriends.forEach(function(element){
//     console.log(element);
// });

//-------------ROUTAGE /api SANS DATABASE--------------------------

/*
var express = require('express');
var router = express.Router();

// middleware that is specific to this router
router.use(function timeLog(req, res, next) {
  console.log('Time: ', Date.now());
  next();
});
// define the home page route
router.get('/', function(req, res) {
  res.send('Birds home page');
});
// define the about route
router.get('/about', function(req, res) {
  res.send('About birds');
});

module.exports = router;
*/

//--------------------FUNCTION INIT MINIMALE 1--------------------------

/*
function init(db) {

    //const router = express.Router();
    
    // On utilise JSON
    router.use(express.json());
    
    //simple logger for this router's requests
    //all requests to this router will first hit this middleware
    router.use((req, res, next) => {
        console.log('API: method %s, path %s', req.method, req.path);
        console.log('Body', req.body);
        next();
    });

    // middleware that is specific to this router
    router.use(function timeLog(req, res, next) {
      console.log('Time: ', Date.now());
      next();
    });
    // define the home page route
    router.get('/', function(req, res) {
      res.send('Birds home page');
    });
    // define the about route
    router.get('/about', function(req, res) {
      res.send('About birds');
    });
    
    return router;
}

exports.default = init;
*/

//--------------------FUNCTION INIT MINIMALE 2--------------------------

/*
function init(db) {

    // On utilise JSON
    router.use(express.json());

    router
        .route('/')
        //.all((req,res,next) => {
        //    next()
        //})
        .get((req,res,next) =>
            res.send('\nAlby')
        )
        .post((req,res,next) =>
            res.send('\nAlby2')
        )

    return router;
}

exports.default = init;
*/

//--------------------------------------------------------------------
