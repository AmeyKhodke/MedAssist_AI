import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

const VoiceChat = ({ onMessage, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = false;
      recognizer.lang = 'en-US';

      recognizer.onstart = () => setIsListening(true);
      recognizer.onend = () => setIsListening(false);
      recognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        onMessage(transcript);
      };

      setRecognition(recognizer);
    } else {
      console.warn("Speech Recognition not supported");
    }
  }, [onMessage]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={toggleListening}
        disabled={isProcessing}
        className={`p-3 rounded-full transition-all ${
          isListening 
            ? 'bg-red-500 animate-pulse text-white' 
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
        }`}
      >
        {isListening ? <MicOff size={24} /> : <Mic size={24} />}
      </button>
      {isListening && <span className="text-sm text-gray-500 self-center">Listening...</span>}
    </div>
  );
};

export const speak = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }
};

export default VoiceChat;
