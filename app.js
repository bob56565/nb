// Initialize video element and camera select dropdown
const video = document.getElementById('video');
const cameraSelect = document.getElementById('cameraSelect');

// Populate camera options
async function populateCameraOptions() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    videoDevices.forEach(device => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.text = device.label || `Camera ${cameraSelect.length + 1}`;
        cameraSelect.appendChild(option);
    });
}

// Request access to the camera with back camera preference
async function startVideoStream() {
    let stream = null;

    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: "environment" }
            }
        });
    } catch (err) {
        console.log("Couldn't get back camera, trying any available camera");
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                video: true
            });
        } catch (err) {
            console.error("Error accessing any camera: ", err);
            alert("Error accessing camera. Please ensure you've granted camera permissions and try again.");
            return;
        }
    }

    video.srcObject = stream;
    await video.play();
    console.log("Camera stream started successfully");

    // Populate camera options after successful stream start
    await populateCameraOptions();
}

// Function to capture image and send to GPT-4 Turbo
function captureAndAnalyzeImage() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        analyzeImageWithGPT4Turbo(imageData);
    } else {
        console.log("Video not ready yet");
    }
}

// Send the captured image to GPT-4 Turbo for analysis
function analyzeImageWithGPT4Turbo(imageData) {
    const apiKey = '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';
    const url = 'https://api.openai.com/v1/chat/completions';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4-turbo",
            messages: [
                {
                    role: "user",
                    content: "Please describe the contents of the following image in detail."
                },
                {
                    role: "user",
                    image: {
                        url: imageData
                    }
                }
            ],
            max_tokens: 300
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => {
                throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            });
        }
        return response.json();
    })
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const gptResponse = data.choices[0].message.content.trim();
            displayAndSpeakResponse(gptResponse);
        } else {
            throw new Error('Unexpected API response format');
        }
    })
    .catch(error => {
        console.error('Error message:', error.message);
        document.getElementById('gptResponse').textContent = `Error getting AI response: ${error.message}. Please try again.`;
    });
}

// Display the GPT-4 Turbo response and use text-to-speech
function displayAndSpeakResponse(response) {
    document.getElementById('gptResponse').textContent = response;
    
    const speech = new SpeechSynthesisUtterance(response);
    window.speechSynthesis.speak(speech);
}

// Event listener for the start button
document.getElementById('startButton').addEventListener('click', () => {
    startVideoStream().then(() => {
        document.getElementById('startButton').style.display = 'none';
    }).catch(err => {
        console.error("Error starting video stream: ", err);
    });
});

// Event listener for capture button
document.getElementById('captureButton').addEventListener('click', () => {
    captureAndAnalyzeImage();
});

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
});
