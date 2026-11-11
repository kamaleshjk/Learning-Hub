---
title: "AWS IoT Core: Practical Mastery"
slug: "aws-iot-core"
category: "Cloud & IoT"
difficulty: "Intermediate"
estimatedTime: "45 min"
summary: "Master how physical or simulated IoT devices securely connect over mTLS, exchange MQTT telemetry, synchronize state with Device Shadows, and route data into AWS services using the Rules Engine."
tags: ["AWS", "IoT Core", "MQTT", "X.509", "Device Shadow", "Rules Engine"]
prerequisites: ["Basic JSON", "Pub/Sub Concept", "Basic AWS Console/CLI"]
updatedAt: "2026-11-11"
resources:
  - title: "AWS IoT Core Developer Guide"
    url: "https://docs.aws.amazon.com/iot/latest/developerguide/what-is-aws-iot.html"
    type: "Official Docs"
  - title: "AWS IoT Device SDK v2 for Python"
    url: "https://github.com/aws/aws-iot-device-sdk-python-v2"
    type: "SDK / Code"
  - title: "MQTT Essentials & Topic Design"
    url: "https://docs.aws.amazon.com/iot/latest/developerguide/topics.html"
    type: "Guide"
  - title: "Device Shadow Service Explained"
    url: "https://docs.aws.amazon.com/iot/latest/developerguide/iot-device-shadows.html"
    type: "Architecture"
flashcards:
  - front: "Why does AWS IoT Core use X.509 certificates instead of IAM access keys on edge devices?"
    back: "X.509 mutual TLS (mTLS) authenticates both the device and AWS during the TLS handshake before any MQTT packet is sent. Certificates can be rotated or revoked per individual device without rotating shared IAM keys."
  - front: "What are the two states inside an AWS IoT Device Shadow, and what does 'delta' mean?"
    back: "'reported' is what the device last confirmed its state is; 'desired' is what an app wants the state to be. When they differ, IoT Core automatically publishes a 'delta' message telling the device what changed."
  - front: "Does AWS IoT Core support MQTT QoS 2?"
    back: "No. AWS IoT Core supports QoS 0 (at most once) and QoS 1 (at least once). If you try to publish or subscribe with QoS 2, the broker closes the connection."
  - front: "What is the difference between a Thing, a Certificate, and an IoT Policy?"
    back: "A Thing is the digital identity/metadata record in the Registry; the Certificate is the cryptographic credential proving identity; the IoT Policy grants MQTT permissions (connect, publish, subscribe, receive) when attached to that certificate."
  - front: "How does the Rules Engine avoid needing an EC2 server to process telemetry?"
    back: "It evaluates SQL-like statements (e.g., SELECT temp FROM 'factory/+/telemetry' WHERE temp > 80) inside the managed IoT service and triggers serverless actions like Lambda, DynamoDB, SQS, or S3 directly."
quiz:
  - question: "A temperature sensor drops offline for 20 minutes. A mobile app wants to turn on its cooling fan so the sensor picks up the command as soon as it reconnects. Which AWS IoT Core feature solves this cleanly?"
    options:
      - "Publish a QoS 0 message directly to factory/fan/cmd"
      - "Update the 'desired' state in the Device Shadow"
      - "Create a new X.509 certificate for the fan"
      - "Write an S3 Bucket Policy"
    answer: 1
    explanation: "Updating the Device Shadow's 'desired' state persists the target state in the cloud. When the sensor reconnects and subscribes to $aws/things/<name>/shadow/update/delta (or fetches /shadow/get), it immediately learns the fan should be ON."
  - question: "You provisioned a Thing and created an X.509 certificate, but your device keeps getting disconnected right after sending MQTT CONNECT. What is the most common missing step?"
    options:
      - "The Thing isn't inside a DynamoDB table"
      - "The Certificate is not Activated, or no IoT Policy allowing iot:Connect is attached to the Certificate"
      - "You forgot to enable QoS 2"
      - "The Rules Engine SQL has a syntax error"
    answer: 1
    explanation: "AWS IoT Core requires BOTH an ACTIVE certificate AND an attached IoT Policy explicitly permitting iot:Connect (and matching clientId ARN) before the MQTT CONNECT succeeds."
  - question: "Which SQL query in the AWS IoT Rules Engine captures telemetry from any floor's sensor while excluding test devices?"
    options:
      - "SELECT * FROM 'sensors/+/temp' WHERE clientid() NOT LIKE 'test-%'"
      - "SELECT * FROM 'sensors/*/temp'"
      - "GET ALL FROM 'sensors/#'"
      - "SELECT * FROM 'sensors/?/temp'"
    answer: 0
    explanation: "MQTT single-level wildcard is '+' (and multi-level is '#'), not '*'. The Rules Engine SQL supports '+' in the FROM topic filter and built-in functions like clientid() in WHERE."
  - question: "What happens if an IoT Policy uses `\"Resource\": \"*\"` in production?"
    options:
      - "Messages are encrypted twice"
      - "Any device with that certificate can impersonate any clientId and publish/subscribe to every device's topics"
      - "AWS IoT Core rejects the policy"
      - "The Rules Engine stops working"
    answer: 1
    explanation: "Wildcard '*' in IoT Policies violates least privilege. Always scope iot:Connect to ${iot:Connection.Thing.ThingName} and topics to specific prefixes."
---

## Why AWS IoT Core Exists (The Mental Model)

> [!MENTAL_MODEL]
> Think of **AWS IoT Core** as a **high-security post office + smart mail sorter** for hardware devices:
> 1. **Security Desk (mTLS + X.509):** Before a sensor can even enter the lobby, it shows a cryptographic passport (X.509 certificate) and checks the post office's passport too.
> 2. **Post Office Counter (MQTT Broker):** Devices drop off lightweight envelopes on named mailboxes called **Topics** (like `plant1/boiler/temp`) and listen for replies on other topics.
> 3. **Smart Mail Sorter (Rules Engine):** Without you running any server, a built-in SQL filter inspects every envelope and routes copies straight to **DynamoDB**, **Lambda**, **S3**, or **SNS**.
> 4. **Sticky Note Board (Device Shadow):** Even when a device loses Wi-Fi in a basement, apps can still read its last known state and leave a "desired" instruction waiting for when it wakes up.

---

## Core Architecture at a Glance

```mermaid
flowchart LR
  D["Edge Device / Sensor<br/>(ESP32, PLC, Python Sim)"] -->|"MQTT over TLS 1.2+<br/>Port 8883 (X.509 mTLS)"| B["AWS IoT Core<br/>Message Broker"]
  B -->|"Check Permissions"| P["IoT Policy &<br/>Certificate"]
  B <-->|"Reserved Topics<br/>$aws/things/..."| S["Device Shadow<br/>(reported / desired / delta)"]
  B -->|"Topic Match"| R["Rules Engine<br/>(SQL Query)"]
  R --> L["AWS Lambda"]
  R --> DB["DynamoDB"]
  R --> S3["Amazon S3"]
  R --> SNS["SNS / Alerts"]
```

---

## The 5 Building Blocks You Must Know

| Component | What It Actually Is | Real-World Analogy |
| :--- | :--- | :--- |
| **Thing** | A JSON record in the AWS IoT Registry (`name`, attributes like `serial`, `firmware`) | Employee profile in HR |
| **X.509 Certificate** | Public/private key pair + signed cert stored on the device | Physical security badge |
| **IoT Policy** | JSON permissions (`iot:Connect`, `iot:Publish`, `iot:Subscribe`, `iot:Receive`) attached to a Certificate | Which doors the badge opens |
| **Message Broker** | Serverless MQTT/WSS/HTTPS pub-sub hub handling millions of connections | The post office router |
| **Rules Engine** | SQL query + Action pipeline triggered on matching MQTT topics | Automated mail forwarding rules |

> [!WARNING]
> **Critical Gotcha #1 — Attaching Policy to Certificate vs Thing:**
> In AWS IoT Core, **IoT Policies are attached to the Certificate**, and the **Certificate is attached to the Thing**. A Thing without an active, policy-backed certificate cannot connect!

> [!WARNING]
> **Critical Gotcha #2 — QoS Support:**
> AWS IoT Core supports **QoS 0** (fire-and-forget) and **QoS 1** (at least once with `PUBACK`). **QoS 2 is NOT supported** — sending QoS 2 causes the broker to disconnect your client immediately.

---

## Designing Clean MQTT Topics

Good topic structure makes Rules Engine queries and IoT Policies 10x easier later:

```text
<tenant>/<site>/<device-type>/<thing-name>/<message-type>
```

Examples:
- `acme/chennai-plant/boiler/boiler-01/telemetry` (Device -> Cloud)
- `acme/chennai-plant/boiler/boiler-01/commands` (Cloud -> Device)
- `acme/chennai-plant/boiler/+/telemetry` (Subscribe wildcard: single level `+`)
- `acme/chennai-plant/#` (Subscribe wildcard: multi-level `#`, only valid at the end!)

> [!TIP]
> Avoid starting custom topics with `$`! Topics starting with `$aws/` are reserved by AWS for services like **Device Shadow** and **IoT Jobs**.

---

## Least-Privilege IoT Policy Template

Never leave `"Resource": "*"` in production. Use **policy variables** like `${iot:Connection.Thing.ThingName}` so one shared policy template automatically locks each device to its own topics:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["iot:Connect"],
      "Resource": "arn:aws:iot:ap-south-1:123456789012:client/${iot:Connection.Thing.ThingName}"
    },
    {
      "Effect": "Allow",
      "Action": ["iot:Publish", "iot:Receive"],
      "Resource": "arn:aws:iot:ap-south-1:123456789012:topic/devices/${iot:Connection.Thing.ThingName}/*"
    },
    {
      "Effect": "Allow",
      "Action": ["iot:Subscribe"],
      "Resource": "arn:aws:iot:ap-south-1:123456789012:topicfilter/devices/${iot:Connection.Thing.ThingName}/*"
    }
  ]
}
```

> [!REALWORLD]
> Notice the subtle difference between `iot:Publish`/`iot:Receive` (uses `:topic/...`) and `iot:Subscribe` (uses `:topicfilter/...`). Mixing those two up is one of the top reasons subscriptions silently fail!

---

## How Device Shadow Works (Step-by-Step)

```mermaid
sequenceDiagram
  participant App as Backend / Mobile App
  participant Shadow as Device Shadow ($aws/things/pump-01/shadow)
  participant Device as Pump-01 (Edge)

  App->>Shadow: Update desired = {"pump": "ON"}
  Shadow-->>Device: Publishes to .../update/delta {"state": {"pump": "ON"}}
  Device->>Device: Turns physical relay ON
  Device->>Shadow: Publishes .../update {"state": {"reported": {"pump": "ON"}}}
  Shadow-->>App: .../update/accepted (delta is now cleared!)
```

Key reserved topics for a Thing named `pump-01`:
- `$aws/things/pump-01/shadow/update` — publish `desired` or `reported` state
- `$aws/things/pump-01/shadow/update/delta` — device subscribes here to receive only what changed
- `$aws/things/pump-01/shadow/get` — publish `{}` on boot to fetch full current shadow

---

## Hands-On Lab: Simulate a Real Device & Route Data

In this practical lab, you will use the **AWS CLI** and a **Python simulator** (no physical hardware needed!) to connect to AWS IoT Core over mTLS and test live MQTT messaging.

### Part A — Provision Thing, Cert, and Policy (AWS CLI)

- [ ] **Step 1:** Check your AWS IoT Core custom data endpoint (you'll connect your device to this host):

```bash
aws iot describe-endpoint --endpoint-type iot:Data-ATS
```

- [ ] **Step 2:** Create a Thing named `sim-sensor-01` in the Registry:

```bash
aws iot create-thing --thing-name sim-sensor-01
```

- [ ] **Step 3:** Generate an X.509 certificate + private key and save them locally (keep `private.pem.key` secret!):

```bash
mkdir -p certs
aws iot create-keys-and-certificate \
  --set-as-active \
  --certificate-pem-outfile certs/device.pem.crt \
  --public-key-outfile certs/public.pem.key \
  --private-key-outfile certs/private.pem.key
```

- [ ] **Step 4:** Download the Amazon Root CA 1 certificate so your device trusts the AWS broker:

```bash
curl -o certs/AmazonRootCA1.pem https://www.amazontrust.com/repository/AmazonRootCA1.pem
```

- [ ] **Step 5:** Create a scoped IoT Policy (`LabDevicePolicy`) and attach it to the certificate ARN returned in Step 3:

```bash
aws iot create-policy \
  --policy-name LabDevicePolicy \
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"iot:*","Resource":"*"}]}'

# Replace <CERT_ARN> with certificateArn from Step 3
aws iot attach-policy --policy-name LabDevicePolicy --target "<CERT_ARN>"
aws iot attach-thing-principal --thing-name sim-sensor-01 --principal "<CERT_ARN>"
```

### Part B — Publish & Subscribe via Python (`awsiotsdk`)

- [ ] **Step 6:** Install the official AWS IoT Device SDK v2 for Python:

```bash
pip install awsiotsdk
```

- [ ] **Step 7:** Open **AWS IoT Console -> MQTT Test Client**, subscribe to `devices/sim-sensor-01/telemetry`, and run this Python script:

```python
import json
import time
from awscrt import mqtt
from awsiot import mqtt_connection_builder

ENDPOINT = "YOUR_ENDPOINT-ats.iot.ap-south-1.amazonaws.com"
CLIENT_ID = "sim-sensor-01"
TOPIC = f"devices/{CLIENT_ID}/telemetry"

conn = mqtt_connection_builder.mtls_from_path(
    endpoint=ENDPOINT,
    cert_filepath="certs/device.pem.crt",
    pri_key_filepath="certs/private.pem.key",
    ca_filepath="certs/AmazonRootCA1.pem",
    client_id=CLIENT_ID,
)

print("Connecting to AWS IoT Core...")
conn.connect().result()
print("Connected!")

for i in range(5):
    payload = {
        "deviceId": CLIENT_ID,
        "temperatureC": round(24.5 + i * 0.7, 2),
        "humidity": 58,
        "ts": int(time.time()),
    }
    conn.publish(
        topic=TOPIC,
        payload=json.dumps(payload),
        qos=mqtt.QoS.AT_LEAST_ONCE,
    )
    print("Published:", payload)
    time.sleep(2)

conn.disconnect().result()
```

- [ ] **Step 8:** Create a Rules Engine Rule in the Console (`SELECT * FROM 'devices/+/telemetry' WHERE temperatureC > 25`) and attach an action (e.g., **CloudWatch Logs** or **Lambda**) to verify serverless routing!

- [ ] **Step 9 (Cleanup):** Delete your test Thing/Policy/Certificate after finishing so your account stays tidy.

---

## Quick Cheat Sheet

| Question | Answer |
| :--- | :--- |
| Standard MQTT port over mTLS? | `8883` |
| MQTT over WebSockets (SigV4 / Custom Auth)? | `443` |
| Max MQTT payload size in AWS IoT Core? | `128 KB` |
| Max QoS supported? | `QoS 1` (No QoS 2!) |
| What authenticates a device? | X.509 Certificate (or Custom Authorizer / Cognito) |
| What authorizes MQTT actions? | IoT Policy attached to the Certificate |
