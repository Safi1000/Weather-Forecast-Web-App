class GeminiChatbot {
    constructor() {
        this.API_KEY = 'AIzaSyA68lqt6pGEaq5-oypFoBmKQDApVqvfbhs';
        this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        this.chatbotMessages = document.getElementById('chatbotMessages');
        this.userInput = document.getElementById('userInput');
        this.sendButton = document.getElementById('sendMessage');
        this.typingIndicator = this.createTypingIndicator();

        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        this.displayMessage("Hello! I'm Gemini, your weather assistant. How can I help you today?", 'bot-message');
    }

    createTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator', 'bot-message');
        indicator.innerHTML = '<span></span><span></span><span></span>';
        return indicator;
    }

    async sendMessage() {
        const userMessage = this.userInput.value.trim();
        if (userMessage === '') return;

        this.displayMessage(userMessage, 'user-message');
        this.userInput.value = '';
        this.showTypingIndicator();

        try {
            const botMessage = await this.fetchGeminiResponse(userMessage);
            this.hideTypingIndicator();
            this.displayMessage(botMessage, 'bot-message');
        } catch (error) {
            console.error('Error:', error);
            this.hideTypingIndicator();
            this.displayMessage('Sorry, I encountered an error. Please try again later.', 'bot-message');
        }
    }

    async fetchGeminiResponse(userMessage) {
        try {
            const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: userMessage
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            let botResponse = data.candidates[0].content.parts[0].text;
            console.log('API Response:', botResponse);

            if (this.containsWeatherInfo(botResponse)) {
                botResponse = this.formatWeatherResponse(botResponse);
            }

            return botResponse;
        } catch (error) {
            console.error('Error fetching response:', error);
            return `I'm sorry, I encountered an error while fetching the weather information. Error: ${error.message}`;
        }
    }

    containsWeatherInfo(response) {
        const weatherKeywords = ['temperature', 'humidity', 'wind', 'forecast', 'weather', 'climate'];
        return weatherKeywords.some(keyword => response.toLowerCase().includes(keyword));
    }

    formatWeatherResponse(response) {
        const weatherData = this.parseWeatherData(response);
        return this.generateWeatherHTML(weatherData);
    }

    parseWeatherData(response) {
        const data = {
            'General Info': {},
            'Summer': {},
            'Winter': {},
            'Rainfall': {}
        };
        const lines = response.split('\n');
        let currentSection = 'General Info';

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('Summer')) {
                currentSection = 'Summer';
            } else if (line.startsWith('Winter')) {
                currentSection = 'Winter';
            } else if (line.startsWith('Rainfall')) {
                currentSection = 'Rainfall';
            } else if (line.includes(':')) {
                const [key, value] = line.split(':').map(item => item.trim());
                data[currentSection][key] = value;
            } else if (line) {
                data[currentSection]['Description'] = (data[currentSection]['Description'] || '') + ' ' + line;
            }
        });

        console.log('Parsed Weather Data:', data);
        return data;
    }

    generateWeatherHTML(data) {
        console.log('Generating HTML for data:', data);

        let html = '<div class="weather-card">';
        
        if (Object.keys(data['General Info']).length > 0) {
            html += `<h3>General Climate Information for ${data['General Info'].city || 'Islamabad'}</h3>`;
            for (let [key, value] of Object.entries(data['General Info'])) {
                html += `<p><strong>${key}:</strong> ${value}</p>`;
            }
        }

        ['Summer', 'Winter', 'Rainfall'].forEach(season => {
            if (Object.keys(data[season]).length > 0) {
                html += `<h4>${season}</h4>`;
                html += `<p>${data[season].Description || ''}</p>`;
            }
        });

        html += '</div>';

        console.log('Generated HTML:', html);
        return html;
    }

    displayMessage(message, className) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', className);
        
        if (message.includes('<div class="weather-card">')) {
            messageElement.innerHTML = message;
        } else {
            messageElement.textContent = message;
        }
        
        console.log('Displaying message:', message);
        this.chatbotMessages.appendChild(messageElement);
        this.scrollToBottom();
    }

    showTypingIndicator() {
        this.chatbotMessages.appendChild(this.typingIndicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        if (this.typingIndicator.parentNode === this.chatbotMessages) {
            this.chatbotMessages.removeChild(this.typingIndicator);
        }
    }

    scrollToBottom() {
        this.chatbotMessages.scrollTop = this.chatbotMessages.scrollHeight;
    }
}

// Initialize the chatbot
const chatbot = new GeminiChatbot();