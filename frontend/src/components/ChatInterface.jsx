import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import VoiceChat, { speak } from './VoiceChat';
import { Send, User, Bot, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for class merging
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ChatInterface = ({ userId = "GUEST_WEB" }) => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I am your AI Pharmacist. I can help you verify prescriptions, check stock, and place orders. How can I help you today?',
      type: 'text' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rxVerified, setRxVerified] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Load history
    if (userId && userId !== "GUEST_WEB") {
        axios.get(`http://localhost:8000/chat/history/${userId}`)
             .then(res => {
                const history = res.data.map(msg => ({
                    role: msg.role === 'assistant' ? 'assistant' : 'user',
                    content: msg.content,
                    type: 'text' // simplification
                }));
                if (history.length > 0) {
                    setMessages(prev => [prev[0], ...history]); // Keep greeting? Or replace? 
                    // Let's keep greeting at top, then history.
                }
             })
             .catch(err => console.error("Failed to load history", err));
    }
    scrollToBottom();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textOverride = null) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: text, type: 'text' }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/agent/chat', {
        text: text,
        user_id: userId,
        prescription_verified: rxVerified
      });

      const result = response.data;
      
      // Add agent response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.result,
        type: result.status === 'rejected' ? 'error' : 'success',
        metadata: result.data
      }]);

      // Voice Output
      speak(result.result);

    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error connecting to the pharmacy system.",
        type: 'error' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      
      {/* Header / Status Bar */}
      <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className={`w-3 h-3 rounded-full ${rxVerified ? 'bg-green-500' : 'bg-orange-400'}`}></div>
           <span className="text-sm text-slate-600">
             {rxVerified ? 'Prescription Verified ✅' : 'No Active Prescription ⚠️'}
           </span>
        </div>
        <button 
          onClick={() => setRxVerified(!rxVerified)}
          className="text-xs text-blue-600 hover:underline"
        >
          {rxVerified ? 'Unlink Rx' : '[DEBUG] Mock Upload Rx'}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex gap-4 max-w-[85%]", 
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            {/* Avatar */}
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              msg.role === 'user' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
            )}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>

            {/* Bubble */}
            <div className={cn(
              "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
              msg.role === 'user' 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
            )}>
              <p>{msg.content}</p>
              
              {/* Metadata / Order Details */}
              {msg.metadata && (msg.metadata.items || []).length > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-100">
                   <p className="font-semibold text-green-800 mb-1 flex items-center gap-1">
                     <CheckCircle size={14} /> Order Confirmed
                   </p>
                   {msg.metadata.items.map((item, i) => (
                     <div key={i} className="flex justify-between text-xs text-green-700">
                        <span>{item.qty}x {item.name}</span>
                        <span>-Stock Updated</span>
                     </div>
                   ))}
                   <div className="mt-2 pt-2 border-t border-green-200 text-xs font-bold text-green-800">
                     Total: ₹{msg.metadata.total_price}
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
               <Bot size={20} className="text-white" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-2">
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
               <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex gap-3 items-center">
          <input
            type="file"
            id="rx-upload"
            className="hidden"
            onChange={() => {
              // Mock upload
              setRxVerified(true);
              alert("Dr. Smith's Prescriptions uploaded! (Mock)");
            }}
          />
          <button 
            className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Upload Prescription"
            onClick={() => document.getElementById('rx-upload').click()}
          >
            <FileText size={24} />
          </button>
          
          <div className="flex-1 bg-slate-100 rounded-full px-4 py-2 flex items-center border border-transparent focus-within:border-blue-300 focus-within:bg-white transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your order or use voice..."
              className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400"
            />
          </div>

          <VoiceChat onMessage={handleSendMessage} isProcessing={isLoading} />
          
          <button 
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full shadow-lg hover:shadow-xl transition-all"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
