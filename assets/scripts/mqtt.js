const upButton = document.getElementById("upButton");
const downButton = document.getElementById("downButton");
const statusIndicator = document.getElementById("statusIndicator");
const mqttConfigForm = document.getElementById("mqttConfigForm");
const controlPanel = document.getElementById("controlPanel");

const brokerUrl = localStorage.getItem("mqttUrl");
const username = localStorage.getItem("mqttUsername");
const password = localStorage.getItem("mqttPassword");

if (!brokerUrl || !username || !password) {
    mqttConfigForm.style.display = 'block';
} else {
    startMqttClient(brokerUrl, username, password);
    controlPanel.style.display = 'flex';
}

function startMqttClient(brokerUrl, username, password) {
    const port = 8884;
    const clientId = "WebClient_" + Math.random().toString(16).substr(2, 8);
    const client = new Paho.MQTT.Client(brokerUrl, port, clientId);
    client.status = ""
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    const options = {
    timeout: 3,
    useSSL: true,
    userName: username,
    password: password,
    onSuccess: onConnect,
    onFailure: onFailure
    };

    client.connect(options);

    function onConnect() {
    console.log("Connected to MQTT broker");
    client.subscribe("device/status");
    }

    function onFailure(responseObject) {
    console.log("Connection failed: " + responseObject.errorMessage);
    }

    function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("Connection lost: " + responseObject.errorMessage);
        client.connect(options);
    }
    }

    function onMessageArrived(message) {
    if (message.destinationName === "device/status") {
        updateStatusIndicator(message.payloadString);
    }
    }

    function updateStatusIndicator(status) {
    client.status = status
    statusIndicator.classList.remove("status-connected", "status-disconnected", "status-unknown");

    if (status === "connected") {
        statusIndicator.textContent = "GARAJ KAPISI: CONNECTED";
        statusIndicator.classList.add("status-connected");
        upButton.disabled = false;
        downButton.disabled = false;
    } else if (status === "disconnected") {
        statusIndicator.textContent = "GARAJ KAPISI: DISCONNECTED";
        statusIndicator.classList.add("status-disconnected");
        upButton.disabled = true;
        downButton.disabled = true;
    } else {
        statusIndicator.textContent = "GARAJ KAPISI: UNKNOWN";
        statusIndicator.classList.add("status-unknown");
        upButton.disabled = true;
        downButton.disabled = true;
    }
    }

    function sendMessage(topic, message) {
    const mqttMessage = new Paho.MQTT.Message(message);
    mqttMessage.destinationName = topic;
    client.send(mqttMessage);
    }

    function addButtonListeners(button, topic) {
    button.addEventListener("mousedown", () => {
        sendMessage(topic, "1");
        toggleButtonState(button, true);
    });
    button.addEventListener("mouseup", () => {
        sendMessage(topic, "0");
        toggleButtonState(button, false);
    });
    button.addEventListener("touchstart", (e) => {
        e.preventDefault();
        sendMessage(topic, "1");
        toggleButtonState(button, true);
    });
    button.addEventListener("touchend", (e) => {
        e.preventDefault();
        sendMessage(topic, "0");
        toggleButtonState(button, false);
    });
    }

    function toggleButtonState(button, isPressed) {
    if (isPressed) {

        if(client.status == "connected"){
        button.getElementsByTagName("span")[0].classList.add("pressed");
        button.getElementsByTagName("span")[1].classList.add("pressed");
        }
        if (button === upButton) downButton.disabled = true;
        if (button === downButton) upButton.disabled = true;
    } else {
        button.getElementsByTagName("span")[0].classList.remove("pressed");
        button.getElementsByTagName("span")[1].classList.remove("pressed");
        if(client.status == "connected"){
        downButton.disabled = false;
        upButton.disabled = false;
        }
    }
    }

    addButtonListeners(upButton, "device/gpio/18");
    addButtonListeners(downButton, "device/gpio/10");

    window.addEventListener("beforeunload", function () {
    if (client.isConnected()) {
        client.disconnect();
    }
    });
}