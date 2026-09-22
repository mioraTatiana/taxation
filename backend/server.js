const express = require("express");
const cors = require("cors")
const app = express();

app.use(express.json());

const zone = require('./Route/Zone');


app.use("./zone",zone)

app.get("/", (req, res) => {
    res.send("Serveur Express fonctionne !");
});

app.listen(8082, () => {
    console.log("Serveur démarré sur http://localhost:8082");
});