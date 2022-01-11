#include "OneWire.h"
#include "DallasTemperature.h"

const int LEDpin = 19; // LED will use GPIO pin 19
const int LightPin = A5; // Read analog input on ADC1_CHANNEL_5 (GPIO 33)

OneWire oneWire(23); // Pour utiliser une entite oneWire sur le port 23
DallasTemperature TempSensor(&oneWire) ; // Cette entite est utilisee par le capteur de temperature


/*--------------------------------*/
void setup_sensors(){
  pinMode(LEDpin, OUTPUT);
  digitalWrite(LEDpin, LOW);// Set outputs to LOW
  TempSensor.begin();
}

/*--------------------------------*/
String get_temp() {
  /* Renvoie la valeur du capteur de temperature dans une String
   * Attention !!
   *    J'ai enleve le delay mais convertir prend du temps ! 
   *    moins que les requetes Http.
   */
  float t;
  TempSensor.requestTemperaturesByIndex(0);
  t = TempSensor.getTempCByIndex(0);
  delay(300);
  return String(t);
}
/*--------------------------------*/
String get_light() {
  /* Renvoie la valeur du capteur de lumiere dans une String
   */
  int sensorValue;
  sensorValue = analogRead(LightPin);
  return String(sensorValue);
}
