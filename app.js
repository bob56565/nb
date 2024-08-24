// Initialize video element
const video = document.getElementById('video');

// Request access to the camera with back camera preference
async function startVideoStream() {
    const constraints = {
        video: {
            facingMode: { ideal: "environment" }
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        await video.play(); // Ensure the video starts playing
        console.log("Camera stream started successfully");
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Error accessing camera. Please ensure you've granted camera permissions and try again.");
    }
}

// Function to start text analysis
function startTextAnalysis() {
    // Capture frame every 23 seconds
    setInterval(captureFrame, 23000);
}

// Capture the current frame from the video
function captureFrame() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/png');

        // Use Tesseract.js for OCR to extract text from the image
        Tesseract.recognize(imageData, 'eng')
            .then(result => {
                const extractedText = result.data.text.trim();
                console.log("Extracted Text: ", extractedText);

                if (extractedText) {
                    document.getElementById('output').textContent = extractedText;
                    analyzeTextWithGPT4(extractedText);
                } else {
                    console.log("No text detected.");
                }
            })
            .catch(err => {
                console.error("Error with OCR: ", err);
            });
    } else {
        console.log("Video not ready yet");
    }
}

// Send the extracted text to GPT-4 for analysis
function analyzeTextWithGPT4(extractedText) {
    const apiKey = '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';
    const url = 'https://api.openai.com/v1/chat/completions';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: extractedText }
            ],
            max_tokens: 150
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const gptResponse = data.choices[0].message.content.trim();
            console.log("GPT-4 Response: ", gptResponse);
            displayAndSpeakResponse(gptResponse);
        } else {
            console.error('Unexpected API response format:', data);
        }
    })
    .catch(error => console.error('Error in GPT-4 API call:', error));
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

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    // We don't automatically start the video stream here anymore
    // It will start when the user clicks the start button
});