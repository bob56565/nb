function testBasicAPIFunctionality() {
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
                    content: "Can you confirm that the API is working?"
                }
            ],
            max_tokens: 50
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
        console.log("API Test Response:", data);
        document.getElementById('gptResponse').textContent = data.choices[0].message.content.trim();
    })
    .catch(error => {
        console.error('Error:', error.message);
        document.getElementById('gptResponse').textContent = `Error getting AI response: ${error.message}. Please try again.`;
    });
}

document.getElementById('captureButton').addEventListener('click', () => {
    testBasicAPIFunctionality();
});
