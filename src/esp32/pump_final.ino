/*
 * MajiChain ESP32 - SMS Payment Receiver & Pump Controller
 * Complete working version with HTTP server for pump activation
 */

#define MODEM_RST            5
#define MODEM_PWKEY          4
#define MODEM_POWER_ON       23
#define MODEM_TX             27
#define MODEM_RX             26
#define PUMP_PIN             2
#define FLOW_SENSOR_PIN      13

#include <WiFi.h>
#include <HTTPClient.h>
#include <WebServer.h>

HardwareSerial SerialAT(1);
WebServer server(80);

// Network configuration
const char* ssid = "Josh";
const char* password = "Jitimay$$";
const char* aiBridgeURL = "http://192.168.52.127:5001/process-sms";

// Global variables
volatile int flowPulses = 0;
unsigned long lastSMSCheck = 0;
bool pumpActive = false;

// Function declarations
void flowPulseCounter();
void initModem();
void initWiFi();
void initWebServer();
void checkForPaymentSMS();
void processPaymentSMS(String sms);
String extractPhoneNumber(String sms);
void forwardToAIBridge(String payment, String phone);
void activatePump(int seconds);
void monitorPump();
void deleteSMS();

void setup() {
  Serial.begin(115200);
  
  // Initialize pump to OFF state
  pinMode(PUMP_PIN, OUTPUT);
  digitalWrite(PUMP_PIN, HIGH);  // HIGH = OFF for active-low relay
  delay(500);
  Serial.println("🛑 PUMP FORCED OFF - Relay initialized to HIGH (OFF)");
  
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), flowPulseCounter, FALLING);
  
  initModem();
  initWiFi();
  initWebServer();
  
  Serial.println("MajiChain SMS Payment System Ready");
  Serial.println("🌐 HTTP Server: http://" + WiFi.localIP().toString() + "/activate-pump");
}

void loop() {
  server.handleClient();
  
  if (millis() - lastSMSCheck > 5000) {
    checkForPaymentSMS();
    lastSMSCheck = millis();
  }
  
  if (pumpActive) {
    monitorPump();
  }
  
  delay(100);
}

void initWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("WiFi Connected: " + WiFi.localIP().toString());
}

void initWebServer() {
  server.on("/activate-pump", HTTP_POST, []() {
    // Send immediate response to prevent timeout
    if (server.hasArg("seconds")) {
      int seconds = server.arg("seconds").toInt();
      
      // Limit pump to maximum 4 seconds
      if (seconds > 4) {
        seconds = 4;
        Serial.println("⚠️ Pump time limited to 4 seconds maximum");
      }
      
      Serial.println("🚰 Pump activation request: " + String(seconds) + " seconds");
      
      // Send response IMMEDIATELY before activating pump
      server.send(200, "application/json", "{\"status\":\"success\",\"message\":\"Pump activating for " + String(seconds) + " seconds\"}");
      
      // Now activate pump (non-blocking for HTTP response)
      activatePump(seconds);
      
    } else {
      server.send(400, "application/json", "{\"status\":\"error\",\"message\":\"Missing seconds parameter\"}");
    }
  });
  
  server.on("/status", HTTP_GET, []() {
    String status = pumpActive ? "active" : "inactive";
    server.send(200, "application/json", "{\"pump_status\":\"" + status + "\",\"flow_pulses\":" + String(flowPulses) + "}");
  });
  
  server.begin();
  Serial.println("🌐 HTTP Server started on port 80");
}

void initModem() {
  pinMode(MODEM_PWKEY, OUTPUT);
  pinMode(MODEM_RST, OUTPUT);
  pinMode(MODEM_POWER_ON, OUTPUT);
  
  digitalWrite(MODEM_PWKEY, LOW);
  digitalWrite(MODEM_RST, HIGH);
  digitalWrite(MODEM_POWER_ON, HIGH);
  
  SerialAT.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);
  delay(3000);
  
  Serial.println("📡 Testing SIM800L connection...");
  SerialAT.println("AT");
  delay(1000);
  if (SerialAT.available()) {
    Serial.println("✅ Modem responds: " + SerialAT.readString());
  } else {
    Serial.println("❌ No modem response!");
  }
  
  SerialAT.println("AT+CPIN?");
  delay(1000);
  if (SerialAT.available()) {
    String simStatus = SerialAT.readString();
    Serial.println("📱 SIM Status: " + simStatus);
  }
  
  SerialAT.println("AT+CREG?");
  delay(1000);
  if (SerialAT.available()) {
    String networkStatus = SerialAT.readString();
    Serial.println("📶 Network: " + networkStatus);
  }
  
  SerialAT.println("AT+CMGF=1");
  delay(1000);
  Serial.println("📨 SMS mode enabled");
}

void checkForPaymentSMS() {
  Serial.println("🔍 Checking for SMS...");
  SerialAT.println("AT+CMGL=\"REC UNREAD\"");
  delay(2000);
  
  String response = "";
  while (SerialAT.available()) {
    response += SerialAT.readString();
  }
  
  if (response.length() > 0) {
    Serial.println("📨 SMS Response: " + response);
  } else {
    Serial.println("📭 No SMS found");
  }
  
  if (response.indexOf("PAY") != -1) {
    Serial.println("💰 Payment SMS detected!");
    processPaymentSMS(response);
    deleteSMS();
  }
}

void processPaymentSMS(String sms) {
  int payIndex = sms.indexOf("PAY");
  if (payIndex == -1) return;
  
  // Extract just the payment message line
  String paymentData = sms.substring(payIndex);
  
  // Find the end of the payment line (before "OK")
  int okIndex = paymentData.indexOf("OK");
  if (okIndex != -1) {
    paymentData = paymentData.substring(0, okIndex);
  }
  
  paymentData.trim();
  paymentData.replace("\n", "");
  paymentData.replace("\r", "");
  
  String phoneNumber = extractPhoneNumber(sms);
  phoneNumber.trim();
  
  Serial.println("📱 Clean Phone: " + phoneNumber);
  Serial.println("💰 Clean Payment: " + paymentData);
  
  forwardToAIBridge(paymentData, phoneNumber);
}

String extractPhoneNumber(String sms) {
  // Look for phone number in format: "REC UNREAD","+25769820499"
  int phoneStart = sms.indexOf("\",\"");
  if (phoneStart == -1) return "UNKNOWN";
  
  phoneStart += 3; // Skip ","
  int phoneEnd = sms.indexOf("\"", phoneStart);
  
  if (phoneEnd == -1) return "UNKNOWN";
  
  return sms.substring(phoneStart, phoneEnd);
}

void forwardToAIBridge(String payment, String phone) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(aiBridgeURL);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000); // 10 second timeout
    
    payment.replace("\"", "");
    phone.replace("\"", "");
    
    String payload = "{\"phone\":\"" + phone + "\",\"message\":\"" + payment + "\"}";
    
    Serial.println("📤 Sending JSON: " + payload);
    
    // Retry logic
    for (int attempt = 1; attempt <= 3; attempt++) {
      Serial.println("🔄 Attempt " + String(attempt) + "/3");
      
      int httpCode = http.POST(payload);
      if (httpCode > 0) {
        Serial.println("✅ AI Bridge response: " + String(httpCode));
        String response = http.getString();
        Serial.println("📥 Response: " + response);
        break; // Success, exit retry loop
      } else {
        Serial.println("❌ HTTP Error: " + String(httpCode));
        if (attempt < 3) {
          delay(2000); // Wait 2 seconds before retry
        }
      }
    }
    
    http.end();
  }
}

void activatePump(int seconds) {
  Serial.println("🚰 Activating pump via RELAY for " + String(seconds) + " seconds");
  
  pumpActive = true;
  digitalWrite(PUMP_PIN, LOW);   // LOW = ON for active-low relay
  Serial.println("⚡ Relay ON - Pump Running");
  
  delay(seconds * 1000);
  
  digitalWrite(PUMP_PIN, HIGH);  // HIGH = OFF for active-low relay
  pumpActive = false;
  Serial.println("🛑 Relay OFF - Pump Stopped");
  
  Serial.println("Water dispensed. Flow: " + String(flowPulses) + " pulses");
  flowPulses = 0;
}

void monitorPump() {
  static unsigned long lastFlowCheck = 0;
  
  if (millis() - lastFlowCheck > 1000) {
    Serial.println("Flow rate: " + String(flowPulses) + " L/min");
    lastFlowCheck = millis();
  }
}

void flowPulseCounter() {
  flowPulses++;
}

void deleteSMS() {
  SerialAT.println("AT+CMGD=1,4");
  delay(1000);
}
