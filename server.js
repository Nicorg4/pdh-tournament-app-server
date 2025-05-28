// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require("path");
const usersRoutes = require('./routes/users');
const playersRoutes = require('./routes/players');
const auctionsRoutes = require('./routes/auctions');
const teamRoutes = require('./routes/team');
const groupRoutes = require('./routes/groups');
const playoffsRoutes = require('./routes/playoffs');
const { connectToDatabase } = require("./dbConnection");

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(bodyParser.json());
app.use("/images", express.static(path.join(__dirname, "images")));

connectToDatabase()
  .then((message) => {
    console.log(message);

    app.get('/', (req, res) => {
      res.send('Bienvenido a mi servidor');
    });

    app.use('/users', usersRoutes);
    app.use('/players', playersRoutes);
    app.use('/auctions', auctionsRoutes);
    app.use('/teams', teamRoutes);
    app.use('/groups', groupRoutes);
    app.use('/playoffs', playoffsRoutes);

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al conectar a la base de datos:', error);
  });
