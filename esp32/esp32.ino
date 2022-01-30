#include "ota.h"
#include "my_spiffs.h"
#include "sensors.h"
#include "wifi.h"
#include "mqtt.h"

/*=============== SETUP =====================*/
void setup () {
  Serial.begin(9600);
  while (!Serial); // wait for a serial connection. Needed for native USB port only

  // Connexion Wifi
  connect_wifi();
  print_network_status();

  // Initialize the Sensors
  setup_sensors();

  // Initialize SPIFFS
  SPIFFS.begin(true);

  setup_mqtt_server();
  mqtt_connect();
}

/*================= LOOP ======================*/

void loop () {
  static uint32_t tick = 0;
  int32_t period = 10 * 1000l; // Publication period

  if ( millis() - tick > period) {
    tick = millis();
    mqtt_publish(TOPIC_DATA,get_temp(),get_light());
  }

  client.loop();
}
