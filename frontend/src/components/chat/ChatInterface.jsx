import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import VoiceChat, { speak } from '../VoiceChat';
import { Send, User, Bot, AlertCircle, CheckCircle, FileText, CheckCheck, MoreVertical, Paperclip, ShoppingCart } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for class merging
function cn(...inputs) {
  return twMerge(clsx(inputs));
}


// Returns current time as HH:MM string
const nowTime = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: 'Hello! I am your AI Pharmacist. I can help you verify prescriptions, check stock, and place orders. How can I help you today?',
  type: 'text',
  time: nowTime()
};

const ChatInterface = ({ user = null, isDarkMode = false, clearKey = 0 }) => {
  const userId = user?.id || "GUEST_WEB";
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
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [language, setLanguage] = useState('en-IN');
  
  // Pending Quantity Widget State
  const [pendingDigit, setPendingDigit] = useState(1);
  const [pendingUnit, setPendingUnit] = useState(10); // Default to Strip
  
  const messagesEndRef = useRef(null);

  const fetchCart = async () => {
    try {
      if (userId && userId !== "GUEST_WEB") {
        const res = await axios.get(`http://localhost:8000/cart/${userId}`);
        setCartItems(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch cart", err);
    }
  };

  const toggleCart = () => {
    if (!isCartOpen) {
      fetchCart();
    }
    setIsCartOpen(!isCartOpen);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  // Load chat history from backend for this user
  const loadHistory = async () => {
    if (!userId || userId === 'GUEST_WEB') {
      setMessages([{ ...WELCOME_MESSAGE, time: nowTime() }]);
      return;
    }
    try {
      const res = await axios.get(`http://localhost:8000/chat/history/${userId}`);
      const history = res.data.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
        type: 'text',
        time: msg.timestamp
          ? new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
          : ''
      }));
      setMessages(history.length > 0 ? history : [{ ...WELCOME_MESSAGE, time: nowTime() }]);
    } catch (err) {
      console.error('Failed to load chat history', err);
      setMessages([{ ...WELCOME_MESSAGE, time: nowTime() }]);
    }
  };

  // Load history on mount
  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // clearKey bump = "New Chat" — just reset local messages
  useEffect(() => {
    if (clearKey > 0) {
      setInput('');
      setMessages([{ ...WELCOME_MESSAGE, time: nowTime() }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearKey]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textOverride = null) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: text, type: 'text', time: nowTime() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:8000/agent/chat', {
        text: text,
        user_id: userId,
        prescription_verified: rxVerified,
        language: language
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
        metadata: result.data,
        time: nowTime()
      }]);

      // Voice Output
      speak(result.result, language);

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

  const handleFileUpload = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    try {
      setMessages(prev => [...prev, {
        role: 'user',
        content: `Uploading prescription: ${file.name}...`,
        type: 'text'
      }]);

      const response = await axios.post('http://localhost:8000/agent/upload_prescription', formData, {
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
      }]);

      // Also refresh cart if needed
      fetchCart();

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I encountered an error uploading your prescription.",
        type: 'error'
      }]);
    } finally {
      setIsLoading(false);
      // clear the input
      const fileInput = document.getElementById('rx-upload');
      if (fileInput) fileInput.value = '';
    }
  };

  return (
    <div className={`flex flex-col h-full w-full relative transition-colors duration-300 ${
      isDarkMode ? 'bg-slate-900' : 'bg-[#F8F9FB]'
    }`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] mix-blend-multiply"></div>

      {/* Header / Status Bar */}
      <div className={`backdrop-blur-xl px-6 py-4 border-b flex justify-between items-center relative z-10 transition-colors ${
        isDarkMode ? 'bg-slate-800/90 border-slate-700 text-white' : 'bg-white/80 border-[#E2E8F0]'
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <Bot size={22} className="text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
              <h3 className={`font-bold leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>AI Pharmacist</h3>
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
            onClick={() => handleSendMessage('show my cart')}
            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors shadow-sm active:scale-95"
          >
            <ShoppingCart size={20} />
          </button>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className={`px-3 py-1.5 focus:outline-none rounded-full text-xs font-bold transition-colors border cursor-pointer ${
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
          >
            <option value="en-IN">English UI</option>
            <option value="hi-IN">हिंदी (Hindi)</option>
            <option value="mr-IN">मराठी (Marathi)</option>
            <option value="bn-IN">বাংলা (Bengali)</option>
            <option value="te-IN">తెలుగు (Telugu)</option>
            <option value="ta-IN">தமிழ் (Tamil)</option>
            <option value="gu-IN">ગુજરાતી (Gujarati)</option>
          </select>
          <button
            onClick={() => setRxVerified(!rxVerified)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
              isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
            }`}
          >
            Toggle Rx Mod
          </button>
          <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area: Chat + Overlapping Cart Sidebar */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Chat Area & Sidebar Container */}
        <div className="flex-1 relative overflow-hidden flex">
          {/* Chat Messages */}
          <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-6 relative z-10 scroll-smooth transition-all duration-300 ${isCartOpen ? 'w-[calc(100%-320px)] opacity-50 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'w-full'}`}>
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
                    ? "bg-[#0061FF] text-white rounded-2xl rounded-tr-sm"
                    : isDarkMode
                      ? "bg-slate-700 border border-slate-600 text-slate-100 rounded-2xl rounded-tl-sm"
                      : "bg-[#F1F5F9] border border-[#E2E8F0] text-slate-800 rounded-2xl rounded-tl-sm"
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

                  {/* Pending Cart Details */}
                  {msg.status === 'pending_confirmation' && msg.metadata && msg.metadata.cart_items && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm w-full min-w-[240px]">
                      <p className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                        <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
                          <ShoppingCart size={13} strokeWidth={2.5} />
                        </div>
                        Your Cart
                      </p>
                      <div className="space-y-2.5">
                        {msg.metadata.cart_items.map((item, i) => (
                          <div key={i} className="flex flex-col text-sm border-l-2 border-slate-100 pl-3 py-0.5">
                            <span className="font-semibold text-slate-800 flex items-center gap-2">
                              {item.name}
                            </span>
                            <span className="text-slate-500 text-xs font-medium flex items-center gap-1.5 mt-0.5">
                              Qty: <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{item.qty}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between items-center px-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estimated Total</span>
                        <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">₹{msg.metadata.total_price.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Dose/Quantity Selector Widget */}
                  {msg.status === 'pending_quantity' && msg.metadata && msg.metadata.item_name && idx === messages.length - 1 && (
                    <div className={`mt-4 p-5 rounded-xl border-2 shadow-md w-full min-w-[300px] animate-in slide-in-from-bottom-2 ${
                      isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200/80'
                    }`}>
                      <p className={`font-bold mb-1 flex items-center justify-between text-sm ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-800'
                      }`}>
                        <span>Select Quantity</span>
                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md text-xs truncate max-w-[150px] title={msg.metadata.item_name}">
                          {msg.metadata.item_name}
                        </span>
                      </p>
                      
                      <div className={`mt-4 p-3 rounded-xl border ${
                        isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-100'
                      }`}>
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() => setPendingUnit(1)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pendingUnit === 1 ? 'bg-blue-600 text-white shadow-md' : isDarkMode ? 'bg-slate-600 text-slate-300 border border-slate-500 hover:bg-slate-500' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                          >
                            Tablet (x1)
                          </button>
                          <button
                            onClick={() => setPendingUnit(10)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pendingUnit === 10 ? 'bg-blue-600 text-white shadow-md' : isDarkMode ? 'bg-slate-600 text-slate-300 border border-slate-500 hover:bg-slate-500' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                          >
                            Strip (x10)
                          </button>
                          <button
                            onClick={() => setPendingUnit(100)}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${pendingUnit === 100 ? 'bg-blue-600 text-white shadow-md' : isDarkMode ? 'bg-slate-600 text-slate-300 border border-slate-500 hover:bg-slate-500' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}`}
                          >
                            Box (x100)
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-3">
                           <div className="relative">
                              <input 
                                type="number" 
                                min="1" 
                                max="50"
                                value={pendingDigit}
                                onChange={(e) => setPendingDigit(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-[80px] bg-white border-2 border-slate-200 text-slate-800 font-bold text-center py-2 rounded-lg outline-none focus:border-blue-500 transition-colors"
                              />
                           </div>
                           <div className="flex-1 text-center bg-slate-200/50 rounded-lg py-2">
                              <span className="text-xs font-bold text-slate-500 block">Total Units</span>
                              <span className="text-lg font-black text-slate-800">{pendingDigit * pendingUnit}</span>
                           </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                           const totalQty = pendingDigit * pendingUnit;
                           handleSendMessage(`Please add ${totalQty} of ${msg.metadata.item_name} to my cart.`);
                        }}
                        className="mt-3 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <ShoppingCart size={16} /> Add to Cart
                      </button>
                    </div>
                  )}

                  {/* Confirmation Buttons */}
                  {msg.status === 'pending_confirmation' && idx === messages.length - 1 && (
                    <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full">
                      <button
                        onClick={() => handleSendMessage('Yes')}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle size={16} /> Confirm Order
                      </button>
                      <button
                        onClick={() => handleSendMessage('No')}
                        className={`flex-1 py-2.5 border rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${
                          isDarkMode
                            ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                {/* Timestamp */}
                <span className={`text-[11px] mt-1.5 px-1 font-medium select-none ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {msg.time || nowTime()}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%] animate-in fade-in duration-300">
                <div className={`px-5 py-4 rounded-2xl rounded-tl-sm border shadow-sm flex items-center gap-1.5 ${
                  isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200/80'
                }`}>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-40" />
          </div>

          {/* Premium Cart Sidebar */}
          <div
            className={cn(
              "absolute top-0 right-0 h-full w-[320px] backdrop-blur-2xl border-l shadow-2xl z-20 transition-transform duration-300 ease-in-out flex flex-col",
              isDarkMode ? 'bg-slate-800/98 border-slate-700' : 'bg-white/95 border-slate-200/60',
              isCartOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            <div className={`p-5 border-b flex items-center justify-between ${
              isDarkMode
                ? 'border-slate-700 bg-gradient-to-r from-slate-700/60 to-slate-800/60'
                : 'border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50'
            }`}>
              <h3 className={`font-bold flex items-center gap-2 text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                <div className={`p-1.5 rounded-lg shadow-inner ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  <ShoppingCart size={18} strokeWidth={2.5} />
                </div>
                Your Cart
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:bg-slate-700 hover:text-slate-200' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 relative">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 opacity-80">
                  <ShoppingCart size={48} strokeWidth={1} />
                  <p className="font-medium text-sm">Your cart is empty.</p>
                </div>
              ) : (
                <div className="absolute inset-0 z-0 opacity-[0.02] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPHBhdGggZD0iTTAgMEw4IDhaTTAgOEw4IDBaIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] mix-blend-multiply pointer-events-none"></div>
              )}

              {cartItems.map((item, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border shadow-sm hover:shadow-md transition-shadow relative z-10 group ${
                  isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-100'
                }`}>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className={`font-semibold text-sm leading-tight group-hover:text-blue-400 transition-colors ${
                        isDarkMode ? 'text-slate-100' : 'text-slate-800 group-hover:text-blue-700'
                      }`}>{item.medicine}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${
                          isDarkMode ? 'text-slate-400 bg-slate-600 border-slate-500' : 'text-slate-500 bg-slate-50 border-slate-100'
                        }`}>
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-sm ${
                        isDarkMode ? 'text-slate-200' : 'text-slate-900'
                      }`}>₹{(item.price || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              
            {cartItems.length > 0 && (
              <div className={`p-5 border-t shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.08)] relative z-10 ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              }`}>
                <div className="flex justify-between items-end mb-4">
                  <span className={`text-sm font-bold uppercase tracking-wider ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}>Estimated Total</span>
                  <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 leading-none">
                    ₹{cartItems.reduce((acc, current) => acc + (current.price || 0), 0).toFixed(2)}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      handleSendMessage('Yes');
                      setIsCartOpen(false);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <CheckCircle size={18} /> Secure Checkout
                  </button>
                  <button
                    onClick={async () => {
                      await axios.delete(`http://localhost:8000/cart/${userId}`);
                      fetchCart();
                    }}
                    className={`w-full py-2.5 border rounded-xl text-sm font-bold transition-colors shadow-sm active:scale-[0.98] ${
                      isDarkMode
                        ? 'bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area (Floating) */}
        <div className="absolute bottom-6 left-0 right-0 px-4 pointer-events-none z-10">
          <div className={`max-w-4xl mx-auto rounded-3xl p-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border pointer-events-auto flex flex-col gap-2 transition-colors ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            
            <div className="flex gap-2 items-end">
              <input
                type="file"
                id="rx-upload"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <button
                className="p-3.5 mb-1 text-slate-400 hover:text-[#0061FF] hover:bg-blue-50 rounded-2xl transition-all flex-shrink-0"
                title="Upload Prescription"
                onClick={() => document.getElementById('rx-upload').click()}
              >
                <Paperclip size={22} className="rotate-45" />
              </button>

              <div className={`flex-1 rounded-3xl p-1.5 flex items-end border border-transparent focus-within:border-[#0061FF] focus-within:ring-4 focus-within:ring-blue-500/10 transition-all ${
                isDarkMode ? 'bg-slate-700 focus-within:bg-slate-700' : 'bg-slate-50 focus-within:bg-white'
              }`}>
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
                  className={`flex-1 bg-transparent border-none outline-none min-h-[44px] max-h-[120px] py-3 px-4 resize-none text-[15px] ${
                    isDarkMode ? 'text-slate-100 placeholder:text-slate-500' : 'text-slate-700 placeholder:text-slate-400'
                  }`}
                  rows={1}
                />

                <div className="p-1">
                  <VoiceChat onMessage={handleSendMessage} isProcessing={isLoading} />
                </div>
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="p-4 mb-1 bg-[#0061FF] hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl shadow-md hover:shadow-blue-600/30 transition-all flex-shrink-0 active:scale-95"
              >
                <Send size={20} className="ml-1" />
              </button>
            </div>
            
            <div className="text-center pb-1">
              <span className="text-[10px] text-slate-400 font-medium">AI can make mistakes. Check important information with your doctor.</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
