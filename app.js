// Initialize video element
const video = document.getElementById('video');

// Request access to the camera with back camera preference and auto focus/exposure
function startVideoStream() {
    const constraints = {
        video: {
            facingMode: { exact: "environment" }, // Explicitly request back camera
            focusMode: "continuous", // Request continuous auto focus
            exposureMode: "continuous" // Request continuous auto exposure
        }
    };

    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(err => {
            console.error("Error accessing back camera: ", err);
            // Fallback to the default camera if the back camera is not available
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    video.srcObject = stream;
                })
                .catch(err => {
                    console.error("Error accessing fallback camera: ", err);
                });
        });
}

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
}

// Send the extracted text to GPT-4 for analysis
function analyzeTextWithGPT4(extractedText) {
    const apiKey = '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';
    const url = 'https://api.openai.com/v1/completions';

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "text-davinci-003", // Specify the model, adjust if needed
            prompt: extractedText,
            max_tokens: 150
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.choices && data.choices[0]) {
            const gptResponse = data.choices[0].text.trim();
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

// Start
