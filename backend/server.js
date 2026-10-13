const express = require("express");
const cors = require("cors")
const app = express();

app.use(express.json());
app.use(cors()); 



app.use("/zone",require('./Route/Admin/Zone'))
app.use("/typetrain", require("./Route/Admin/typetrain"));
app.use("/typemarchandise", require("./Route/Taxateur/typemarchandise"));
app.use("/client", require("./Route/Taxateur/client"));
app.use("/user", require("./Route/Login/usertable"));
app.use("/train", require("./Route/Admin/train"));
app.use("/marchandise", require("./Route/Taxateur/marchandise"));
app.use("/tarif", require("./Route/Taxateur/tarif"));
app.use("/destination", require("./Route/Admin/destination"));

app.get("/", (req, res) => {
    res.send("Serveur Express fonctionne !");
});

app.listen(8082, () => {
    console.log("Serveur démarré sur http://localhost:8082");
});