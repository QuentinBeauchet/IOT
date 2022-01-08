import dotenv from "dotenv";
dotenv.config();
import { resolve, parse, join } from "path";
const __dirname = resolve();
import { connect } from "mqtt";
import { MongoClient } from "mongodb";
import express from "express";
import bodyParser from "body-parser";
const { urlencoded, json } = bodyParser;
import geoip from "geoip-lite";
import fetch from "node-fetch";

// Topics MQTT
const TOPIC_LIGHT = "sensors/light";
const TOPIC_TEMP = "sensors/temp";

var dbo;

//----------------------------------------------------------------
// asynchronous function named main() where we will connect to our
// MongoDB cluster, call functions that query our database, and
// disconnect from our cluster.
async function main() {
  const mongoName = "IoT"; //Nom de la base
  const mongoUri = `mongodb+srv://${process.env.MONGOUSERNAME}:${process.env.MONGOPASSWORD}@iot.6ehzb.mongodb.net/${mongoName}?retryWrites=true&w=majority`;

  //Now that we have our URI, we can create an instance of MongoClient.
  const mg_client = new MongoClient(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Connect to the MongoDB cluster
  mg_client.connect(function (err, mg_client) {
    if (err) throw err; // If connection to DB failed.

    // Print databases in our cluster
    mg_client
      .db()
      .admin()
      .listDatabases()
      .then((response) => {
        console.log("Databases in Mongo Cluster : \n");
        response.databases.forEach((db) => console.log(` - ${db.name}`));
      });

    dbo = mg_client.db(mongoName);

    // Remove "old collections : temp and light
    dbo.listCollections({ name: "temp" }).next(function (err, collinfo) {
      if (collinfo) {
        dbo.collection("temp").drop();
      }
    });

    dbo.listCollections({ name: "light" }).next(function (err, collinfo) {
      if (collinfo) {
        dbo.collection("light").drop();
      }
    });

    // Connexion au broker MQTT distant
    const mqtt_url = "http://test.mosquitto.org:1883";
    var client_mqtt = connect(mqtt_url);

    // Des la connexion, le serveur NodeJS s'abonne aux topics MQTT
    client_mqtt.on("connect", function () {
      client_mqtt.subscribe(TOPIC_LIGHT, function (err) {
        if (!err) {
          console.log("Node Server has subscribed to ", TOPIC_LIGHT);
        }
      });
      client_mqtt.subscribe(TOPIC_TEMP, function (err) {
        if (!err) {
          console.log("Node Server has subscribed to ", TOPIC_TEMP);
        }
      });
    });

    // Callback de la reception des messages MQTT
    client_mqtt.on("message", function (topic, message) {
      console.log("\nMQTT msg on topic : ", topic.toString());
      console.log("Msg payload : ", message.toString());

      // Parsing du message recu au format JSON
      message = JSON.parse(message);
      var new_entry = {
        date: new Date().toLocaleString("fr-FR", {
          timeZone: "Europe/Paris",
        }),
        who: message.who,
        value: message.value,
      };

      // Ecriture dans la base de données MongoDB
      var key = parse(topic.toString()).base;
      dbo.collection(key).insertOne(new_entry, function (err, res) {
        if (err) throw err;
        console.log(
          "\nItem : ",
          new_entry,
          "\ninserted in db in collection :",
          key
        );
      });
    });

    // Fermeture de la connexion avec la DB lorsque le NodeJS se termine.
    process.on("exit", (code) => {
      if (mg_client && mg_client.isConnected()) {
        console.log("mongodb connection is going to be closed ! ");
        mg_client.close();
      }
    });
  });
}

//================================================================
//==== Demarrage BD et MQTT =======================
//================================================================
main();

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());
app.use(express.static(join(__dirname, "/")));
app.use(function (request, response, next) {
  //Pour eviter les problemes de CORS/RESTx
  response.header("Access-Control-Allow-Origin", "*");
  response.header("Access-Control-Allow-Headers", "*");
  response.header(
    "Access-Control-Allow-Methods",
    "POST, GET, OPTIONS, PUT, DELETE"
  );
  next();
});

//================================================================
// Answering GET request on this node ... probably from navigator.
// => REQUETES HTTP reconnues par le Node
//================================================================

app.get("/", function (req, res) {
  res.sendFile(join(__dirname + "/index.html"));
});

// Request to esp/light or esp/temp.
app.get("/esp/:what", function (req, res) {
  var new_request = {
    date: new Date().toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
    }),
    who: req.query.who,
    what: req.params.what,
    ip: req.ip,
    originalUrl: req.originalUrl,
  };
  console.log("\nNew Request:", new_request);
  //console.log(req.headers["x-forwarded-for"], req.socket.remoteAddress);

  var geo = geoip.lookup("88.169.220.78");

  //console.log(geo);

  if (new_request.what != "light" && new_request.what != "temp") {
    res.sendStatus(404);
  }

  // Recupere les informations de la base de données MongoDB.
  dbo
    .collection(new_request.what)
    .find({ who: new_request.who })
    .sort({ _id: -1 })
    .limit(200)
    .toArray()
    .then((arr) => res.json(arr));
});

// Request the API call of a city temperature.
app.get("/city/:what", function (req, res) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${req.params.what}&appid=${process.env.openWeatherAPIKey}&units=metric`
  )
    .then((response) => response.json())
    .catch(() => res.json({ temp: "?" }))
    .then((json) =>
      res.json({ temp: json.cod == "404" ? "?" : json.main.temp })
    );
});

//================================================================
//==== Demarrage du serveur Web  =======================
//================================================================

var listener = app
  .set("trust proxy", true)
  .listen(process.env.PORT || 5501, function () {
    console.log("Express Listening on port " + listener.address().port);
  });
