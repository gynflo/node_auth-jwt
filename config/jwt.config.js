const secret = process.env.JWT_SECRET;
const jwt = require('jsonwebtoken');

const { app } = require('../app');
const { findUserPerId } = require('../queries/user.queries');

const createJwtToken = ({ user = null, id = null }) => {
    const jwtToken = jwt.sign({
        //le payload contient la claim sub 
        // sub: Identifiant unique de l'utilisateur du token
        sub: id || user._id.toString(),
        // Durée de vie de 10 secondes
        exp: Math.floor(Date.now() / 1000) + 10,
    }, secret);
    return jwtToken;
};


//Middleware de vérification de la validité du token 
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
                res.clearCookie('jwt');
                res.redirect('/');
            }
        } catch (error) {
            res.clearCookie('jwt');
            res.redirect('/');
        }
    } else {
        next();
    }
};

//Vérification de l'expiration du token
const checkExpirationToken = (token, res) => {
    const tokenExp = token.exp;
    const nowInSec = Math.floor(Date.now() / 1000);
    if (nowInSec <= tokenExp) {
        return token;
        //Rafraichissement du token si expiré depuis moins d'une journée 
    } else if (nowInSec > tokenExp && ((nowInSec - tokenExp) < 60 * 60 * 24)) {
        const refreshedToken = createJwtToken({ id: token.sub });
        res.cookie('jwt', refreshedToken);
        return jwt.decode(refreshedToken);
    } else {
        throw new Error('Token Expired');
    }
}

//Ajout de méthodes utiles sur l'objet req
const addJwtFeatures = (req, res, next) => {
    // si user connecté, retournera true si l'objet req comporte une clé user
    req.isAuthenticated = () => !!req.user;
    req.logout = () => res.clearCookie('jwt');
    req.login = (user) => {
        const token = createJwtToken({ user });
        res.cookie('jwt', token)
    }
    next()
};

app.use(extractUserFromToken);
app.use(addJwtFeatures);




