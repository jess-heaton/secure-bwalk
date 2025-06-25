// Secure script.js - No more exposed API keys!

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Generate a unique user ID (using sessionStorage instead of localStorage for better security)
let userId = sessionStorage.getItem('vf_user_id');
if (!userId) {
    userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('vf_user_id', userId);
}

// Initialize the chat
async function initChat() {
    try {
        const response = await sendToVoiceflow({ 
            type: 'launch',
            payload: {}
        });
        
        // Hide the loading overlay
        loadingOverlay.classList.add('hidden');
        
        if (response && Array.isArray(response) && response.length > 0) {
            const validResponses = response.filter(trace => 
                (trace.type === 'text' || trace.type === 'speak') && 
                (trace.payload?.message || trace.payload?.text)
            );
            
            if (validResponses.length > 0) {
                setTimeout(() => {
                    processResponse(response);
                }, 100);
            } else {
                console.log('No valid responses in:', response);
            }
        } else {
            console.log('Empty or invalid response:', response);
        }
    } catch (error) {
        console.error('Error initializing chat:', error);
        loadingOverlay.classList.add('hidden');
        addMessage('Sorry, I encountered an error starting the conversation.', 'bot');
    }
}

// Send a message to our secure API endpoint (no more direct Voiceflow calls!)
async function sendToVoiceflow(action) {
    try {
        const response = await fetch('/api/voiceflow', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                userId: userId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Process the response from Voiceflow
function processResponse(response) {
    console.log('Raw response:', response);
    
    if (!response || !Array.isArray(response)) {
        console.error('Invalid response format:', response);
        addMessage('Sorry, I encountered an error processing the response.', 'bot');
        return;
    }
    
    // Filter and process valid messages
    const textMessages = [];
    
    response.forEach(trace => {
        console.log('Processing trace:', trace);
        
        if (trace.type === 'text' || trace.type === 'speak') {
            const message = trace.payload?.message || trace.payload?.text;
            if (message) {
                textMessages.push(message);
            }
        }
    });
    
    // Display each message
    if (textMessages.length > 0) {
        textMessages.forEach(message => {
            addMessage(message, 'bot');
        });
    } else {
        addMessage('I received your message but have no response.', 'bot');
    }
}

// Add a message to the chat
function addMessage(text, sender) {
    if (!text) return; // Don't add empty messages
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    try {
        // Always try to parse as markdown if marked is available
        if (window.marked) {
            // Clean up the text first
            let cleanText = text.trim();
            // Ensure double line breaks for markdown lists
            cleanText = cleanText.replace(/(\d+\.\s)/g, '\n$1');
            // Parse markdown
            contentDiv.innerHTML = window.marked.parse(cleanText);
            
            // Add click handlers for any links to open in new tab
            contentDiv.querySelectorAll('a').forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            });
        } else {
            // Fallback to plain text if marked is not available
            contentDiv.textContent = text;
        }
    } catch (error) {
        console.error('Error rendering message:', error);
        // Fallback to plain text if there's an error
        contentDiv.textContent = text;
    }
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Real estate themed status messages
const statusMessages = [
    'Searching our property database...',
    'Analyzing market trends...',
    'Finding matching properties...',
    'Checking recent listings...',
    'Preparing recommendations...',
    'Connecting with our agents...'
];

// Show typing indicator with status message
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    // Add status message
    const statusDiv = document.createElement('div');
    statusDiv.className = 'typing-status';
    statusDiv.textContent = statusMessages[Math.floor(Math.random() * statusMessages.length)];
    typingDiv.appendChild(statusDiv);
    
    // Create dots container
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'typing-dots';
    
    // Create three dots
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        dot.style.animationDelay = `${i * 0.2}s`;
        dotsContainer.appendChild(dot);
    }
    
    typingDiv.appendChild(dotsContainer);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Change status message every few seconds if still typing
    typingDiv.interval = setInterval(() => {
        statusDiv.textContent = statusMessages[Math.floor(Math.random() * statusMessages.length)];
    }, 3000);
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        clearInterval(typingIndicator.interval);
        typingIndicator.remove();
    }
}

// Handle sending a message
async function handleSendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessage(message, 'user');
    userInput.value = '';
    
    // Show typing indicator
    showTypingIndicator();
    
    try {
        // Send message to our secure API
        const response = await sendToVoiceflow({
            type: 'text',
            payload: message
        });
        
        // Process and display the response
        processResponse(response);
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('Sorry, there was an error processing your message.', 'bot');
    } finally {
        removeTypingIndicator();
    }
}

// Event Listeners
sendButton.addEventListener('click', handleSendMessage);

userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});

// DOM Elements
const loadingOverlay = document.getElementById('loading-overlay');
const chatContainer = document.querySelector('.chat-container');

// Initialize the chat when the page loads
window.addEventListener('DOMContentLoaded', () => {
    // Clear any existing messages
    chatMessages.innerHTML = '';
    
    // Show the chat container but keep it hidden until loading is complete
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.height = '100%';
    
    // Start cycling through loading steps
    cycleLoadingSteps();
    
    // Start the conversation immediately
    initChat();
});

// Function to cycle through loading steps
function cycleLoadingSteps() {
    const steps = document.querySelectorAll('.loading-step');
    let currentStep = 0;
    
    // Show first step immediately
    steps[0].classList.add('active');
    
    // Cycle through steps every 1.5 seconds
    const interval = setInterval(() => {
        // If we're hiding the loading overlay, stop cycling
        if (loadingOverlay.classList.contains('hidden')) {
            clearInterval(interval);
            return;
        }
        
        // Mark current step as completed
        steps[currentStep].classList.remove('active');
        steps[currentStep].classList.add('completed');
        
        // Move to next step
        currentStep = (currentStep + 1) % steps.length;
        
        // Reset all steps after the last one
        if (currentStep === 0) {
            steps.forEach(step => {
                step.classList.remove('completed');
            });
        }
        
        // Show current step
        steps[currentStep].classList.add('active');
    }, 1500);
}
