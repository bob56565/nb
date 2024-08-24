// Initialize video element
const video = document.getElementById('video');

// Request access to the camera
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => {
        console.error("Error accessing camera: ", err);
    });

// Function to start text analysis
function startTextAnalysis() {
    // Capture frame every 23 seconds
    setInterval(captureFrame, 23000); // Set interval to 23 seconds
}

// Capture the current frame from the video
function captureFrame() {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png');
    analyzeImageWithGPT4(imageData);
}

// Send the captured image to GPT-4 for analysis
function analyzeImageWithGPT4(imageData) {
    const apiKey = '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';
    const url = 'https://api.openai.com/v1/completions';  // Corrected endpoint for text analysis

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            prompt: 'Analyze the following text: ' + imageData,
            max_tokens: 150
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.choices && data.choices[0]) {
            const gptResponse = data.choices[0].text;
            console.log("GPT-4 Response: ", gptResponse);
            displayAndSpeakResponse(gptResponse);
        } else {
            console.error('Unexpected API response format:', data);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Display the GPT-4 response and use text-to-speech
function displayAndSpeakResponse(response) {
    document.getElementById('output').textContent = response;
    
    // Use the Web Speech API for text-to-speech
    const speech = new SpeechSynthesisUtterance(response);
    window.speechSynthesis.speak(speech);
}

// Start the process automatically
startTextAnalysis();
