'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useLanguage } from '@/contexts/LanguageContext';

// Helper để render markdown cơ bản (In đậm, In nghiêng, Xuống dòng)
const formatMarkdown = (text: string) => {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
  return { __html: html };
};

export function FloatingMinaChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const [messages, setMessages] = useState<{role: 'mina'|'user', text: string}[]>([
    { role: 'mina', text: t('ai.minaGreeting') }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await apiClient.request<{ reply: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg })
      });
      setMessages(prev => [...prev, { role: 'mina', text: res.reply || t('ai.minaError') }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'mina', text: t('ai.minaNetworkError') }]);
    }
    setLoading(false);
  };

  const handleSendPrompt = async (promptMsg: string) => {
    if (loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: promptMsg }]);
    setLoading(true);

    try {
      const res = await apiClient.request<{ reply: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: promptMsg })
      });
      setMessages(prev => [...prev, { role: 'mina', text: res.reply || t('ai.minaError') }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'mina', text: t('ai.minaNetworkError') }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-indigo-100 dark:border-gray-800 overflow-hidden flex flex-col h-[550px] max-h-[85vh] animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Sparkles className="w-5 h-5 text-purple-100 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Quản gia Mina AI</h3>
                <p className="text-[10px] text-indigo-200">Trợ lý phân tích số liệu</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-800/20">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-indigo-500' : 'bg-gradient-to-tr from-purple-500 to-indigo-500'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div 
                  className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                  }`}
                  dangerouslySetInnerHTML={formatMarkdown(msg.text)}
                />
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 text-gray-800 rounded-tl-none border border-gray-100 shadow-sm w-16 flex justify-center items-center">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 pt-2 pb-1 bg-white dark:bg-gray-900 overflow-x-auto custom-scrollbar flex gap-2 w-full border-t border-gray-100 dark:border-gray-800 shrink-0">
            {[
              t('ai.billThisMonth'),
              t('ai.weatherAndTemp'),
              t('ai.systemAlerts'),
              t('ai.weeklyConsumption'),
            ].map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendPrompt(prompt)}
                className="whitespace-nowrap px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 rounded-xl transition-all shrink-0 active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 pt-1 bg-white dark:bg-gray-900">
            <div className="relative">
              <input 
                id="chat-input-mina"
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('ai.minaPlaceholder')}
                className="w-full bg-gray-100 dark:bg-gray-800 border-transparent rounded-full py-2.5 px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-800 dark:text-gray-100"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl flex items-center justify-center text-white hover:scale-105 transition-transform duration-200 active:scale-95"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-7 h-7" />}
      </button>
    </div>
  );
}
