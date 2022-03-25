require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
require('./database');
const router = require('./routes');

const app = express();
const port = process.env.PORT

exports.app = app;

//Afin que le token soit disponible sur req.cookies , j'utilise cookie-parser
app.use(cookieParser());
require('./config/jwt.config');


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(router);

app.listen(port,() => {
    console.log(`http://localhost:${port}`)
});
