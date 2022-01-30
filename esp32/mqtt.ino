void setup_mqtt_server() {
  // set server of our client
  client.setServer(MQTT_SERVER.c_str(), MQTT_PORT);
  // set callback when publishes arrive for the subscribed topic
  client.setCallback(mqtt_pubcallback);
  client.setBufferSize(2048);
}

/*============== MQTT CALLBACK ===================*/
void mqtt_pubcallback(char* topic, byte* message, unsigned int length) {
  // Byte list to String ... plus facile a traiter ensuite !
  // Mais sans doute pas optimal en performance => heap ?
  String messageTemp ;
  for (int i = 0 ; i < length ; i++) {
    messageTemp += (char) message[i];
  }

  Serial.print("Message : ");
  Serial.println(messageTemp);
  Serial.print("arrived on topic : ");
  Serial.println(topic) ;
}

/*============= CONNECT and SUBSCRIBE =====================*/
void mqtt_connect() {
  while (!client.connected()) { // Loop until we're reconnected
    Serial.print("Attempting MQTT connection...");

    // Attempt to connect => https://pubsubclient.knolleary.net/api
    if (client.connect("deathstar",NULL,NULL)) {
      Serial.println("connected");
    }
    else {
      Serial.print("failed, rc=");
      Serial.print(client.state());

      Serial.println(" try again in 5 seconds");
      delay(5000); // Wait 5 seconds before retrying
    }
  }
}

void mqtt_publish(char* topic, String temp, String light) {
  String payload = "{\"who\": \"" + MAC + "\", \"temp\": " + temp + ", \"light\": " + light + ", \"localisation\": " + "{ \"lat\" : " +  43.617 + ", \"long\" : " + 7.064 + "}}";
  client.publish(topic, payload.c_str());
  Serial.print("Sent payload: ");
  Serial.println(payload);
  Serial.print("\nOn topic: ");
  Serial.println(topic);
}
