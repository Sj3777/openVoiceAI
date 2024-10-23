'use client';
import { useEffect, useRef, useState } from 'react';
import { FaMicrophone } from 'react-icons/fa'; // Import microphone icon from react-icons

const SpeechToText = () => {
    const [transcript, setTranscript] = useState<string>('');
    const [recordings, setRecordings] = useState<{ timestamp: string; audioBlob: Blob }[]>([]);
    const socketRef = useRef<WebSocket | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const [isRecording, setIsRecording] = useState(false); // Track recording state
    const [showTranscript, setShowTranscript] = useState(false); // Control visibility of transcript

    useEffect(() => {
        // Establish WebSocket connection
        socketRef.current = new WebSocket('ws://localhost:3002');

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Received data from server:', data); // Log received data for debugging

            if (data.channel && data.channel.alternatives.length > 0) {
                const transcriptText = data.channel.alternatives[0].transcript;
                setTranscript((prev) => prev + ' ' + transcriptText); // Append new text to the existing transcript
                setShowTranscript(true); // Show transcript when data is received
                console.log('Transcript updated:', transcriptText); // Log the updated transcript
            }
        };

        socketRef.current.onopen = () => {
            console.log('WebSocket connection established');
        };

        socketRef.current.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            socketRef.current?.close();
        };
    }, []);

    const startRecording = async () => {
        setTranscript(''); // Clear transcript when starting a new recording
        setShowTranscript(false); // Hide transcript initially
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                const audioBlob = event.data; // Get the audio blob
                socketRef.current?.send(audioBlob); // Send audio to the server in chunks
                console.log('Audio chunk sent to server, size:', audioBlob.size); // Log when audio is sent
            }
        };

        mediaRecorderRef.current.onstop = () => {
            audioChunksRef.current = []; // Reset audio chunks
        };

        mediaRecorderRef.current.start(100); // Start recording and send data every 100ms
        setIsRecording(true); // Update recording state
        console.log('Recording started'); // Log recording status
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false); // Update recording state
        console.log('Recording stopped'); // Log recording status
    };

    const playRecording = (audioBlob: Blob) => {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.play();
        console.log('Playing recording'); // Log when a recording is played
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <h1 className="text-3xl font-bold mb-6">Speech to Text App</h1>
            
            <div className="relative mb-6">
                <button
                    onClick={startRecording}
                    className={`relative p-4 rounded-full bg-blue-500 text-white transition-transform duration-200 ${isRecording ? 'animate-bounce' : ''}`}
                >
                    <FaMicrophone className="text-5xl" />
                </button>
            </div>

            <div className="mb-4">
                <button
                    onClick={startRecording}
                    className={`px-6 py-3 rounded transition duration-200 ${isRecording ? 'bg-red-500' : 'bg-blue-500'} text-white mr-4`}
                >
                    {isRecording ? 'Recording...' : 'Start Recording'}
                </button>
                <button
                    onClick={stopRecording}
                    className="bg-red-500 text-white px-6 py-3 rounded"
                    disabled={!isRecording} // Disable button if not recording
                >
                    Stop Recording
                </button>
            </div>

            {showTranscript && (
                <div className="w-3/4 bg-white p-6 rounded shadow-lg mt-6">
                    <h2 className="text-xl font-semibold mb-2">Transcript:</h2>
                    <p className="text-lg leading-relaxed">{transcript}</p>
                </div>
            )}

            <h2 className="text-xl font-semibold mt-8">Recordings:</h2>
            <ul className="list-none mt-4 w-3/4">
                {recordings.map((recording, index) => (
                    <li key={index} className="flex items-center justify-between bg-white p-2 rounded shadow mt-2">
                        <span>{recording.timestamp}</span>
                        <button
                            onClick={() => playRecording(recording.audioBlob)}
                            className="bg-green-500 text-white px-4 py-2 rounded"
                        >
                            Play
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SpeechToText;
