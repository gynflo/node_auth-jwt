# Authentification JWT

Dans les authentifications fondées sur des tokens, aucune session n'est persistée coté serveur:

    1. Les identifiants utilisateur sont envoyés et le serveur retourne un token.
    2. Ce token peut-etre sauvegardé coté client de la meme manière qu'un id de session(dans les cookies par exemple).
    Mais à la différence de l'authentification basée sur les sessions, il n'y a pas besoin d'enregistrer le token en base de données(ni quoi que ce soit).Le token permet de s'assurer de l'authentification à lui seul.
    3. Le token est renvoyé dans le cookie et est controlé à chaque requete par le serveur (middleware).

Quelles sont ses caractéristiques ?

1. Un token JWT est un fichier au format JSON encodé en Base64url et signé.
2. Il comprend trois parties : un header, un payload et une signature.
3. Pour savoir si le token est valide, le serveur n'a qu'à l'inspecter (en le décodant et en vérifiant la signature) : il n'a pas besoin de contacter un autre serveur ou une base de données.
4. Le payload contient généralement l'id de l'utilisateur, la date d'expiration du token et des permissions dans un scope.
5. Attention ! Il faut bien comprendre que le header et le payload sont encodés en base64 et non pas chiffrés ! Tout le monde peut les lire.

L'intérêt du token est de pouvoir vérifier sa provenance grâce à la signature, c'est-à-dire s'assurer que le paquet provient bien de la personne authentifiée et qu'il n'a pas été modifié par un tiers.

En effet, personne ne peut changer quoique ce soit dans le header ou le payload sans que le token soit reconnu immédiatement comme invalide. Seul le serveur connaît le secret permettant de créer la bonne signature à partir du contenu.

La signature est en fait une encryption du header et du payload en utilisant un secret.

Si une personne n'a pas le secret, alors il lui est impossible de modifier le payload car la signature ne correspondrait plus au nouveau contenu.

**Attention un token peut-etre lu par tout le monde mais ne peut etre modifié sans que le serveur ne le sache.**

## Processus

1. Installez le package

```sh
npm i jsonwebtoken
```

2. Initialisez un secret

3. Création des tokens ainsi qu'une durée de vie 

```js
//jwt.config.js
const createJwtToken = ({ user = null, id = null }) => {
  const jwtToken = jwt.sign(
    {
      //le payload contient la claim sub & exp
      // sub: Identifiant unique de l'utilisateur du token
      sub: id || user._id.toString(),
      // Durée de vie pour test de 10 secondes
      exp: Math.floor(Date.now() / 1000) + 10,
    },
    secret
  );
  return jwtToken;
};
```

4. Récupération du token dans les cookies

```sh
npm i cookie-parser
```

5. Vérification du token dans un middleware

```js
//jwt.config.js
const extractUserFromToken = async (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    try {
      let decodedToken = jwt.verify(token, secret, { ignoreExpiration: true });
      decodedToken = checkExpirationToken(decodedToken, res);
      const user = await findUserPerId(decodedToken.sub);
      if (user) {
        req.user = user;
        next();
      } else {
        res.clearCookie("jwt");
        res.redirect("/");
      }
    } catch (error) {
      res.clearCookie("jwt");
      res.redirect("/");
    }
  } else {
    next();
  }
};
```

6. Ajout de méthodes utiles sur l'objet req

```js
//jwt.config.js
const addJwtFeatures = (req, res, next) => {
  // si user connecté, retournera true si l'objet req comporte une clé user
  req.isAuthenticated = () => !!req.user;
  req.logout = () => res.clearCookie("jwt");
  req.login = (user) => {
    const token = createJwtToken({ user });
    res.cookie("jwt", token);
  };
  next();
};
```

7. Mise en places des routes & des controlleurs

```js
//auth.controller.js
const { findUserPerEmail } = require("../queries/user.queries");

exports.signinForm = (req, res, next) => {
  res.render("signin", { error: null });
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await findUserPerEmail(email);
    if (user) {
      const match = await user.comparePassword(password);
      if (match) {
        req.login(user);
        res.redirect("/protected");
      } else {
        res.render("signin", { error: "Wrong password" });
      }
    } else {
      res.render("signin", { error: "User not found" });
    }
  } catch (e) {
    next(e);
  }
};

exports.signout = (req, res, next) => {
  req.logout();
  res.redirect("/");
};
```


