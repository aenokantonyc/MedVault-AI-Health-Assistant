import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Image as ImageIcon } from 'lucide-react';

const Assistant = () => {
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: "Hello, Alex! I'm your CliniNova AI Assistant. How can I help you with your health today?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setMessages([...messages, { id: Date.now(), type: 'user', text: input }]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        type: 'ai', 
        text: "I understand your concern. Please remember that I am an AI assistant and my advice does not replace a professional medical consultation. Could you tell me more about your symptoms?" 
      }]);
    }, 1000);
  };

  const suggestions = [
    "I have a fever and headache",
    "What are diabetes symptoms?",
    "Medicine reminder help"
  ];

  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary-blue to-primary-cyan p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
          <Bot className="text-primary-blue" size={24} />
        </div>
        <div>
          <h2 className="text-white font-bold">CliniNova AI</h2>
          <p className="text-blue-100 text-xs flex items-center gap-1">
            <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span> Online
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-bg">
        {messages.map((msg) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.type === 'user' ? 'bg-gray-200' : 'bg-primary-light text-primary-blue'
              }`}>
                {msg.type === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-3 rounded-2xl ${
                msg.type === 'user' 
                  ? 'bg-primary-blue text-white rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-text-primary rounded-tl-none shadow-sm'
              }`}>
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="p-4 bg-surface-bg">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion)}
                className="flex items-center gap-1 text-xs bg-white border border-primary-light text-primary-blue px-3 py-1.5 rounded-full hover:bg-primary-light transition-colors"
              >
                <Sparkles size={12} />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center">
        <button type="button" className="p-2 text-text-secondary hover:text-primary-blue transition-colors">
          <ImageIcon size={20} />
        </button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your health..."
          className="flex-1 bg-surface-bg border-none focus:ring-0 px-4 py-2 rounded-xl outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className={`p-2 rounded-xl flex items-center justify-center transition-all ${
            input.trim() ? 'bg-primary-blue text-white hover:bg-blue-700 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Send size={20} className={input.trim() ? 'ml-1' : ''} />
        </button>
      </form>
    </div>
  );
};

export default Assistant;
