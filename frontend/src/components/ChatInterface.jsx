import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import VoiceChat, { speak } from './VoiceChat';
import { Send, User, Bot, AlertCircle, CheckCircle, FileText, CheckCheck, MoreVertical, Paperclip } from 'lucide-react';
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
      
      let messageType = 'success';
      if (result.status === 'rejected') messageType = 'error';
      else if (result.status === 'pending_admin' || result.status === 'needs_prescription') messageType = 'warning';

      // Add agent response
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: result.result,
        type: messageType,
        status: result.status,
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
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[600px] w-full bg-slate-50/50 rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200/60 relative">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] mix-blend-multiply"></div>

      {/* Header / Status Bar */}
      <div className="bg-white/80 backdrop-blur-xl px-6 py-4 border-b border-slate-200/60 flex justify-between items-center relative z-10 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="relative">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                 <Bot size={22} className="text-white" />
             </div>
             <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
           </div>
           <div>
             <h3 className="font-bold text-slate-900 leading-tight">AI Pharmacist</h3>
             <div className="flex items-center gap-2">
                 <span className="text-xs font-medium text-emerald-600">Online</span>
                 <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                 <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${rxVerified ? 'text-emerald-700 bg-emerald-50' : 'text-orange-700 bg-orange-50'}`}>
                   {rxVerified ? 'Rx Verified' : 'No Rx'}
                 </span>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
              onClick={() => setRxVerified(!rxVerified)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full text-xs font-bold transition-colors border border-slate-200"
            >
              Toggle Rx Mod
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <MoreVertical size={20} />
            </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-10 scroll-smooth">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex flex-col max-w-[85%] md:max-w-[75%] animate-in fade-in slide-in-from-bottom-2 duration-300", 
              msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            {/* Bubble */}
            <div className={cn(
              "px-5 py-3.5 shadow-sm text-[15px] leading-relaxed relative group",
              msg.role === 'user' 
                ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-tr-sm" 
                : "bg-white border border-slate-200/80 text-slate-800 rounded-2xl rounded-tl-sm"
            )}>
              <div className="flex flex-col gap-1">
                  <span className={cn(
                      msg.type === 'warning' ? 'text-orange-800' : '',
                      msg.type === 'error' ? 'text-red-800' : ''
                  )}>
                      {msg.content}
                  </span>
              </div>
              
              {/* Metadata / Order Details */}
              {msg.metadata && (msg.metadata.items || []).length > 0 && (
                <div className="mt-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 w-full min-w-[240px]">
                   <p className="font-bold text-emerald-800 mb-3 flex items-center gap-1.5 text-sm">
                     <div className="w-5 h-5 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center">
                         <CheckCircle size={12} strokeWidth={3} />
                     </div>
                     Order Confirmed
                   </p>
                   <div className="space-y-2">
                       {msg.metadata.items.map((item, i) => (
                         <div key={i} className="flex justify-between items-center text-sm">
                            <span className="font-medium text-slate-700 flex items-center gap-2">
                                <span className="text-slate-400 text-xs px-1.5 py-0.5 bg-white rounded border border-slate-200">{item.qty}x</span> 
                                {item.name}
                            </span>
                            <CheckCheck size={14} className="text-emerald-500" />
                         </div>
                       ))}
                   </div>
                   <div className="mt-3 pt-3 border-t border-emerald-200/50 flex justify-between items-center">
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Amount</span>
                       <span className="text-base font-black text-slate-900">₹{msg.metadata.total_price}</span>
                   </div>
                </div>
              )}

              {/* Confirmation Buttons */}
              {msg.status === 'pending_confirmation' && idx === messages.length - 1 && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full">
                      <button 
                          onClick={() => handleSendMessage('Yes')}
                          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98]"
                      >
                          Confirm Order
                      </button>
                      <button 
                          onClick={() => handleSendMessage('No')}
                          className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                      >
                          Cancel
                      </button>
                  </div>
              )}
            </div>
            {/* Timestamp placeholder */}
            <span className="text-[10px] text-slate-400 mt-1.5 px-1 font-medium">
                {msg.role === 'user' ? 'Read' : 'Just now'}
            </span>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] animate-in fade-in duration-300">
            <div className="bg-white px-5 py-4 rounded-2xl rounded-tl-sm border border-slate-200/80 shadow-sm flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></span>
               <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-2" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200/60 relative z-10 rounded-b-[2.5rem]">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          
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
            className="p-3.5 mb-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
            title="Upload Prescription"
            onClick={() => document.getElementById('rx-upload').click()}
          >
            <Paperclip size={22} className="rotate-45" />
          </button>
          
          <div className="flex-1 bg-slate-100/80 rounded-3xl p-1.5 flex items-end border border-slate-200/60 focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-inner">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                  }
              }}
              placeholder="Ask about medications or request refills..."
              className="flex-1 bg-transparent border-none outline-none text-slate-700 placeholder:text-slate-400 min-h-[44px] max-h-[120px] py-3 px-4 resize-none text-[15px]"
              rows={1}
            />
            
            <div className="p-1">
               <VoiceChat onMessage={handleSendMessage} isProcessing={isLoading} />
            </div>
          </div>
          
          <button 
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="p-4 mb-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl shadow-lg hover:shadow-blue-600/30 transition-all flex-shrink-0 active:scale-95"
          >
            <Send size={20} className="ml-1" />
          </button>
        </div>
        <div className="text-center mt-2 pb-1">
            <span className="text-[10px] text-slate-400 font-medium">AI can make mistakes. Check important information with your doctor.</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
