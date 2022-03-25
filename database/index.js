
const mongoose = require('mongoose');

mongoose
  .connect(
    `${process.env.MONGO_PROTOCOLE}${process.env.MONGO_USERNAME}:${process.env.MONGO_PASS}${process.env.MONGO_HOST}${process.env.MONGO_REPO}`,
    {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log('Connexion ok !');
  })
  .catch((err) => {
    console.log(err);
  });
