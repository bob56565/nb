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
        // First, try to get the back camera
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { exact: "environment" }
            }
        });
    } catch (err) {
        console.log("Couldn't get back camera, trying any available camera");
        try {
            // If back camera is not available, try any camera
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

// Function to switch camera
async function switchCamera(deviceId) {
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }

    const constraints = {
        video: { deviceId: { exact: deviceId } }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play();
        console.log("Switched to new camera");
    } catch (err) {
        console.error("Error switching camera: ", err);
    }
}

// Function to start image analysis
function startImageAnalysis() {
    // Capture and analyze image every 15 seconds
    setInterval(captureAndAnalyzeImage, 15000);
}

// Capture the current frame from the video and send to GPT-4
function captureAndAnalyzeImage() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        analyzeImageWithGPT4(imageData);
    } else {
        console.log("Video not ready yet");
    }
}

// Send the captured image to GPT-4 for analysis
function analyzeImageWithGPT4(imageData) {
    const apiKey = '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';
    const url = 'https://api.openai.com/v1/chat/completions';

    console.log("Sending image to GPT-4 for analysis");

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this image and describe its contents in detail. If there's text visible, please read and interpret it."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageData
                            }
                        }
                    ]
                }
            ],
            max_tokens: 300
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const gptResponse = data.choices[0].message.content.trim();
            console.log("GPT-4 Response: ", gptResponse);
            displayAndSpeakResponse(gptResponse);
        } else {
            console.error('Unexpected API response format:', data);
            throw new Error('Unexpected API response format');
        }
    })
    .catch(error => {
        console.error('Error in GPT-4 API call:', error);
        document.getElementById('gptResponse').textContent = "Error getting AI response. Please try again.";
    });
}

// Display the GPT-4 response and use text-to-speech
function displayAndSpeakResponse(response) {
    document.getElementById('gptResponse').textContent = response;
    
    // Use the Web Speech API for text-to-speech
    const speech = new SpeechSynthesisUtterance(response);
    window.speechSynthesis.speak(speech);
}

// Event listener for the start button
document.getElementById('startButton').addEventListener('click', () => {
    startVideoStream().then(() => {
        startImageAnalysis();
        document.getElementById('startButton').style.display = 'none';
    }).catch(err => {
        console.error("Error starting video stream: ", err);
    });
});

// Event listener for camera selection
cameraSelect.addEventListener('change', (event) => {
    if (event.target.value !== '') {
        switchCamera(event.target.value);
    }
});

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    // We don't automatically start the video stream here anymore
    // It will start when the user clicks the start button
});