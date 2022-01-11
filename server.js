import dotenv from "dotenv";
dotenv.config();
import { resolve, parse, join } from "path";
const __dirname = resolve();
import { connect } from "mqtt";
import { MongoClient } from "mongodb";
import express from "express";
import bodyParser from "body-parser";
const { urlencoded, json } = bodyParser;
import fetch from "node-fetch";

// Topics MQTT
const TOPIC_LIGHT = "sensors/light";
const TOPIC_TEMP = "sensors/temp";
const TOPIC_CLIENT = "client";

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

    // Remove "old collections
    const resetCollection = (collection) =>
      dbo.listCollections({ name: collection }).next(function (err, collinfo) {
        if (collinfo) {
          dbo.collection(collection).drop();
        }
      });

    resetCollection("temp");
    resetCollection("light");
    resetCollection("client");

    // Connexion au broker MQTT distant
    const mqtt_url = "http://test.mosquitto.org:1883";
    var client_mqtt = connect(mqtt_url);

    // Des la connexion, le serveur NodeJS s'abonne aux topics MQTT
    client_mqtt.on("connect", function () {
      const subTopic = (topic) =>
        client_mqtt.subscribe(topic, function (err) {
          if (!err) {
            console.log("Node Server has subscribed to ", topic);
          }
        });

      subTopic(TOPIC_TEMP);
      subTopic(TOPIC_LIGHT);
      subTopic(TOPIC_CLIENT);
    });

    // Callback de la reception des messages MQTT
    client_mqtt.on("message", function (topic, message) {
      console.log("------------------------------------");
      console.log("MQTT msg on topic : ", topic.toString());
      console.log("Msg payload : ", message.toString());
      console.log("------------------------------------");

      // Parsing du message recu au format JSON
      message = JSON.parse(message);
      var new_entry = {
        date: new Date().toLocaleString("fr-FR", {
          timeZone: "Europe/Paris",
        }),
        who: message.who,
      };
      if (topic != TOPIC_CLIENT) {
        new_entry.value = message.value;
      }

      // Ecriture dans la base de données MongoDB
      var key = parse(topic.toString()).base;
      dbo.collection(key).insertOne(new_entry);
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
  res.sendFile(join(__dirname + "/client/index.html"));
});

// Request to esp/light or esp/temp.
app.get("/esp/:what", function (req, res) {
  var new_request = {
    date: new Date().toLocaleString("fr-FR", {
      timeZone: "Europe/Paris",
    }),
    who: req.query.who,
    what: req.params.what,
    originalUrl: req.originalUrl,
  };
  console.log("\nNew Request:", new_request);

  // Recupere les informations de la base de données MongoDB.
  if (new_request.what == "light" || new_request.what == "temp") {
    dbo
      .collection(new_request.what)
      .find({ who: new_request.who })
      .sort({ _id: -1 })
      .limit(200)
      .toArray()
      .then((arr) => res.json(arr));
  } else if (new_request.what == "client") {
    dbo
      .collection(new_request.what)
      .distinct("who")
      .then((list) => res.json(list));
  } else {
    res.sendStatus(404);
  }
});

// Request the API call of a city temperature.
app.get("/city", function (req, res) {
  fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${req.query.cityName}&appid=${process.env.openWeatherAPIKey}&units=metric`
  )
    .then((response) => response.json())
    .catch(() => res.json({ temp: "?" }))
    .then((json) =>
      res.json(
        json.cod == "200"
          ? {
              name: json.name,
              lat: json.coord.lat,
              long: json.coord.lon,
              temp: json.main.temp,
              country: json.sys.country,
            }
          : {}
      )
    );
});

//================================================================
//==== Demarrage du serveur Web  =======================
//================================================================

var listener = app
  .set("trust proxy", true)
  .listen(process.env.PORT || 5500, () =>
    console.log("Express Listening on port ", listener.address().port)
  );
