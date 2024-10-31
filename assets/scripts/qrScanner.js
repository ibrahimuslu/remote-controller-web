
const video = document.getElementById("cameraPreview");
const qrResult = document.getElementById("qrResult");
// Open QR Scanner
function openQRScanner() {
  qrScannerContainer.style.display = "flex";
  startQRScanner();
}

// Close QR Scanner
function closeQRScanner() {
  qrScannerContainer.style.display = "none";
  stopScanner();
}

// Start the QR scanner
async function startQRScanner() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
      scanQRCode();
    });
  } catch (error) {
    alert("Camera access denied or not available.");
    closeQRScanner();
  }
}

// Stop the QR scanner
function stopScanner() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  }
}

// Scan for QR code in video feed
function scanQRCode() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleQRCodeData(code.data);
        closeQRScanner();
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
}

// Handle QR Code Data as JSON
function handleQRCodeData(data) {
  try {
    const jsonData = JSON.parse(data);
    const brokerUrl = jsonData.brokerUrl || "";
    const username = jsonData.username || "";
    const password = jsonData.password || "";

    // Save to localStorage and submit form
    localStorage.setItem("mqttUrl", brokerUrl);
    localStorage.setItem("mqttUsername", username);
    localStorage.setItem("mqttPassword", password);

    mqttConfigForm.style.display = 'none';
    controlPanel.style.display = 'flex';
    startMqttClient(brokerUrl, username, password);
  } catch (error) {
    alert("Invalid QR Code Data. Please scan a valid JSON QR code.");
  }
}
