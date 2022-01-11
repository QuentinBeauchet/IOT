// MQTT https://pubsubclient.knolleary.net/
#include <PubSubClient.h>

PubSubClient client(espClient);

//==== MQTT TOPICS ==============
char* TOPIC_TEMP = "sensors/temp";
char* TOPIC_LIGHT = "sensors/light";
char* TOPIC_CLIENT = "client";

/*===== MQTT broker/server ========*/
String MQTT_SERVER = "test.mosquitto.org";
int MQTT_PORT = 1883;

void initClient();
void mqttCallback(char* topic, byte* message, unsigned int length);
void mqttSubscribe(char *topic);
void mqtt_publish(char* topic,String value);
