
import { GoogleGenAI } from '@google/genai';
import { AnimatePresence, motion } from 'framer-motion';
import { Brain, Send, Sparkles, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from '../types';

const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hey there! I\'m your Manyora study partner. Ready to crush some goals?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const chat = ai.chats.create({
        model: 'gemini-3-flash-preview',
        config: {
          systemInstruction: 'You are Manyora Assistant, an elite academic concierge. If the user asks who created you or who is your creator, always answer that you were created by Morepeace Manyora. Personality: Intelligent, motivating, concise. Help students understand concepts, study tips, and clarify textbook summaries.'
        }
      });

      const response = await chat.sendMessage({ message: input });
      setMessages(prev => [...prev, { role: 'assistant', content: response.text || "Connection hiccup. Try again?" }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "My brain is resting. Try again soon!" }]);
    } finally { setIsTyping(false); }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 md:w-16 md:h-16 bg-black dark:bg-indigo-600 text-white rounded-2xl shadow-2xl flex items-center justify-center z-40 group border-2 border-white/10"
      >
        <Sparkles className="w-7 h-7 md:w-8 md:h-8 group-hover:animate-pulse" strokeWidth={2.25} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 50, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[420px] sm:h-[650px] bg-white dark:bg-slate-900 sm:rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col z-50 overflow-hidden border border-gray-100 dark:border-slate-800"
          >
            <div className="bg-black dark:bg-slate-950 p-6 flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
                  <Brain size={24} strokeWidth={2.25} />
                </div>
                <div>
                  <span className="font-black block leading-none tracking-tight">Manyora AI</span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1.5 block">Active Concierge</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 bg-white/10 dark:bg-slate-800 flex items-center justify-center rounded-2xl hover:bg-white/20 hover:scale-105 active:scale-95 transition-all">
                <X size={20} strokeWidth={2.25} />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50 dark:bg-slate-900/50 hide-scrollbar">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-5 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-none font-medium'
                  }`}>
                    <p className="text-[15px] leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex gap-2 ring-1 ring-slate-200 dark:ring-slate-700">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent border-none rounded-xl px-4 py-3 text-[15px] font-semibold text-slate-800 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <motion.button
                  whileHover={{ scale: 1.05, backgroundColor: '#4f46e5' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  className="bg-black dark:bg-indigo-600 text-white p-3.5 rounded-2xl transition-all shadow-lg flex items-center justify-center"
                >
                  <Send size={20} strokeWidth={2.25} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;
