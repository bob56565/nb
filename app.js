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

// Function to start text analysis
function startTextAnalysis() {
    // Capture frame every 15 seconds
    setInterval(captureFrame, 15000);
}

// Capture the current frame from the video
function captureFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Enhance image
        context.filter = 'contrast(1.4) brightness(1.1)';
        context.drawImage(canvas, 0, 0);
        
        const imageData = canvas.toDataURL('image/png');

        // Use Tesseract.js for OCR to extract text from the image
        Tesseract.recognize(imageData, 'eng', { 
            logger: m => console.log(m),
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,?!-:;()', // Extended whitelist
            tessedit_pageseg_mode: '6', // Assume a single uniform block of text
            tessjs_create_pdf: '0', // Disable PDF output for speed
            tessjs_create_hocr: '0', // Disable HOCR output for speed
            tessjs_create_tsv: '0', // Disable TSV output for speed
        })
        .then(result => {
            const extractedText = result.data.text.trim();
            console.log("Extracted Text: ", extractedText);

            if (extractedText && extractedText.length > 20) {  // Only process if there's substantial text
                document.getElementById('output').textContent = extractedText;
                analyzeTextWithGPT4(extractedText);
            } else {
                console.log("Not enough text detected.");
                document.getElementById('output').textContent = "Not enough text detected. Please try again.";
            }
        })
        .catch(err => {
            console.error("Error with OCR: ", err);
            document.getElementById('output').textContent = "Error in text recognition. Please try again.";
        });
    } else {
        console.log("Video not ready yet");
    }
}

// Send the extracted text to GPT-4 for analysis
function analyzeTextWithGPT4(extractedText) {
    const apiKey = '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';
    const url = 'https://api.openai.com/v1/chat/completions';

    console.log("Sending text to GPT-4: ", extractedText);

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant. The following text may contain OCR errors. Please do your best to interpret it and respond appropriately." },
                { role: "user", content: extractedText }
            ],
            max_tokens: 150
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
        startTextAnalysis();
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