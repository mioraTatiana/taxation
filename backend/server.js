const express = require("express");
const cors = require("cors")
const app = express();

app.use(express.json());

const zone = require('./Route/Zone');



app.use("/zone",zone)
app.use("/typetrain", require("./Route/typetrain"));
app.use("/typemarchandise", require("./Route/typemarchandise"));
app.use("/client", require("./Route/client"));
app.use("/user", require("./Route/usertable"));
app.use("/train", require("./Route/train"));
app.use("/marchandise", require("./Route/marchandise"));
app.use("/tarif", require("./Route/tarif"));
app.use("/destination", require("./Route/destination"));

app.get("/", (req, res) => {
    res.send("Serveur Express fonctionne !");
});

app.listen(8082, () => {
    console.log("Serveur démarré sur http://localhost:8082");
});