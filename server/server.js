require('dotenv').config(); // Load environment variables
const http = require('http');
const WebSocket = require('ws');
const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

const DEEPGRAM_API_KEY = 'ab7bd2bf83e5d6691a539a29d80f4bf938d619b3'; // Replace with your API key
const deepgram = createClient(DEEPGRAM_API_KEY);

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Initialize live transcription connection
    const dgConnection = deepgram.listen.live({ model: 'nova' });

    dgConnection.on(LiveTranscriptionEvents.Open, () => {
        console.log('Deepgram connection opened');
    });

    dgConnection.on(LiveTranscriptionEvents.Transcript, (data) => {
        console.log('Received transcript:', data);
        ws.send(JSON.stringify(data));
    });

    dgConnection.on('error', (error) => {
        console.error('Deepgram connection error:', error);
    });

    ws.on('message', (message) => {
        // Convert message (audio blob) to Buffer
        const buffer = Buffer.from(message);
        
        // Log size of the audio data before sending
        console.log('Sending audio data to Deepgram, size:', buffer.length);

        // Send the audio data to Deepgram
        dgConnection.send(buffer);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        dgConnection.finish(); // Close the Deepgram connection
    });
});

// Start the WebSocket server
const PORT = 3002;
server.listen(PORT, () => {
    console.log(`WebSocket server started on ws://localhost:${PORT}`);
});
