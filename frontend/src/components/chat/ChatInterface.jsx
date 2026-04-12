import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceChat, { speak } from '../VoiceChat';
import { 
  Send, User, Bot, AlertCircle, CheckCircle, FileText, CheckCheck, 
  MoreVertical, Paperclip, ShoppingCart, Sparkles, Clock, Globe, X
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import api from '../../api';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const nowTime = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Greetings. I am your AI Health Concierge. I can help fulfill prescriptions, analyze medical history, and provide pharmaceutical advice. How may I assist you?',
  type: 'text',
  time: nowTime()
};
const ChatInterface = ({ user = null, isDarkMode = true, clearKey = 0 }) => {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rxVerified, setRxVerified] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [language, setLanguage] = useState('en-IN');
  const [pendingDigit, setPendingDigit] = useState(1);
  const [pendingUnit, setPendingUnit] = useState(10); 
  const messagesEndRef = useRef(null);

  const fetchCart = async () => {
    try {
      const res = await api.get(`/cart`);
      setCartItems(res.data);
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get(`/chat/history`);
      const history = res.data.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
        type: 'text',
        time: msg.timestamp
          ? new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
          : ''
      }));
      setMessages(history.length > 0 ? history : [WELCOME_MESSAGE]);
    } catch (err) {
      console.error('Failed to load history', err);
      setMessages([WELCOME_MESSAGE]);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (clearKey > 0) {
      setMessages([WELCOME_MESSAGE]);
    }
  }, [clearKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textOverride = null) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user', content: text, type: 'text', time: nowTime() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post(`/agent/chat`, {
        text: text,
        prescription_verified: rxVerified,
        language: language
      });

      const result = response.data;
      let messageType = 'success';
      if (result.status === 'rejected') messageType = 'error';
      else if (['pending_admin', 'needs_prescription'].includes(result.status)) messageType = 'warning';

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.result,
        type: messageType,
        status: result.status,
        metadata: result.data,
        time: nowTime()
      }]);

      speak(result.result, language);
      if (result.status === 'pending_confirmation') fetchCart();

    } catch (error) {
      // api instance handles toast
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Network integrity compromised. Please check your connection to the pharmacy mesh.",
        type: 'error',
        time: nowTime()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      setMessages(prev => [...prev, {
        role: 'user',
        content: `Analyzing digital prescription: ${file.name}...`,
        type: 'text',
        time: nowTime()
      }]);

      const response = await api.post(`/agent/upload_prescription`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = response.data;
      setRxVerified(true);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.result,
        type: 'success',
        time: nowTime()
      }]);
      fetchCart();
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Vision analysis failed. Ensure the document is clear and authorized.",
        type: 'error',
        time: nowTime()
      }]);
    } finally {
      setIsLoading(false);
      const fileInput = document.getElementById('rx-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative bg-[#0f172a] text-slate-100 overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="px-8 py-5 glass-card-header border-b border-white/5 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bot size={24} className="text-white" />
             </div>
             <motion.div 
               animate={{ scale: [1, 1.2, 1] }} 
               transition={{ repeat: Infinity, duration: 2 }}
               className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-[#0f172a] rounded-full"
             />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight leading-none mb-1">Health Concierge</h3>
            <div className="flex items-center gap-2">
               <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                  <Sparkles size={10} /> Learning Active
               </span>
               <span className="w-1 h-1 bg-slate-700 rounded-full" />
               <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", 
                 rxVerified ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border border-white/5")}>
                 {rxVerified ? "Rx Digital Sync" : "Prescription Required"}
               </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden lg:flex items-center gap-2 bg-white/5 border border-white/5 p-1 rounded-xl">
              {[
                { id: 'en-IN', label: 'EN' },
                { id: 'hi-IN', label: 'HI' },
                { id: 'mr-IN', label: 'MR' }
              ].map(lang => (
                <button 
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black transition-all", 
                    language === lang.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300")}
                >
                  {lang.label}
                </button>
              ))}
           </div>
           <button onClick={() => setIsCartOpen(!isCartOpen)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all relative">
              <ShoppingCart size={20} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-[#0f172a]">
                  {cartItems.length}
                </span>
              )}
           </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 relative z-10 scroll-smooth custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn("flex flex-col max-w-[85%] lg:max-w-[70%]", msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start")}
            >
              <div className={cn(
                "px-6 py-4 rounded-3xl text-[15px] leading-relaxed shadow-xl",
                msg.role === 'user' 
                  ? "bg-indigo-600 text-white rounded-tr-sm" 
                  : "glass-card text-slate-200 border border-white/5 rounded-tl-sm backdrop-blur-3xl"
              )}>
                {msg.content}

                {/* Confirmations & Payloads */}
                {msg.status === 'pending_confirmation' && msg.metadata?.cart_items && (
                  <div className="mt-6 p-5 bg-black/20 rounded-2xl border border-white/10 space-y-4">
                    <p className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                      <CheckCircle size={14} /> Review Fulfillment Request
                    </p>
                    <div className="space-y-2">
                       {msg.metadata.cart_items.map((item, i) => (
                         <div key={i} className="flex justify-between items-center text-sm font-medium">
                            <span className="text-slate-300">{item.name}</span>
                            <span className="text-indigo-400">x{item.qty}</span>
                         </div>
                       ))}
                    </div>
                    <div className="pt-4 border-t border-white/5 flex gap-3">
                       <button onClick={() => handleSendMessage('Confirm Order')} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all">Confirm</button>
                       <button onClick={() => handleSendMessage('Cancel')} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold transition-all">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-1 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {msg.role === 'assistant' ? <Bot size={10} /> : <User size={10} />}
                {msg.time || "Just now"}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-4 glass-card-loading rounded-2xl w-20">
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-75" />
             <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse delay-150" />
          </motion.div>
        )}
        <div ref={messagesEndRef} className="h-24" />
      </div>

      {/* Input */}
      <div className="px-6 pb-8 relative z-20">
         <div className="max-w-5xl mx-auto glass-card p-2 flex items-center gap-3 border border-white/10 focus-within:border-indigo-500/50 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all rounded-[32px]">
            <input 
              type="file" id="rx-upload" accept="image/*" className="hidden" 
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
            />
            <button 
              onClick={() => document.getElementById('rx-upload').click()}
              className="p-4 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-all"
            >
              <Paperclip size={20} className="rotate-45" />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Query patient health records or analyze symptoms..."
              className="flex-1 bg-transparent border-none outline-none py-4 px-2 resize-none text-sm text-white placeholder:text-slate-500 max-h-32"
              rows={1}
            />

            <div className="p-1 flex items-center gap-2">
               <VoiceChat onMessage={handleSendMessage} isProcessing={isLoading} />
               <button 
                 onClick={() => handleSendMessage()}
                 disabled={!input.trim() || isLoading}
                 className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[24px] shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
               >
                 <Send size={20} />
               </button>
            </div>
         </div>
         <p className="text-center text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-4">
            Secured via AES-256 Encryption • Hindsight Memory v2.4
         </p>
      </div>

      {/* Cart Sidebar (Simplified Overlay) */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            className="absolute top-0 right-0 h-full w-80 bg-[#0f172a]/95 backdrop-blur-2xl border-l border-white/5 z-40 p-8 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                  <ShoppingCart className="text-indigo-400" /> Dispensing
               </h3>
               <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
               {cartItems.map((item, i) => (
                 <div key={i} className="p-4 glass-card bg-white/[0.02] border border-white/5 relative group overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500/50" />
                    <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{item.medicine}</p>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-xs font-bold text-slate-500">Qty: {item.quantity}</span>
                       <span className="text-sm font-black text-white">₹{(item.price || 0).toFixed(2)}</span>
                    </div>
                 </div>
               ))}
            </div>

            <div className="pt-8 mt-8 border-t border-white/5">
                <div className="flex justify-between items-end mb-6">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Settlement</span>
                   <span className="text-3xl font-black text-indigo-400">₹{cartItems.reduce((a, b) => a + (b.price || 0), 0).toFixed(2)}</span>
                </div>
                <button onClick={() => { handleSendMessage('Confirm Checkout'); setIsCartOpen(false); }} className="w-full premium-button py-4 text-sm">
                   Confirm & Discharge
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatInterface;
