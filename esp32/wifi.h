#include <WiFi.h>
#include <WiFiMulti.h>

WiFiClient espClient;
String MAC;

void connect_wifi();
void print_network_status();
