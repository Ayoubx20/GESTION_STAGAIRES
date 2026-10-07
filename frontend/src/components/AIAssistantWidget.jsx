import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { sendAIChatMessage } from '../services/aiService';
import {
  SparklesIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  TrashIcon,
  ArrowsPointingOutIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

const AIAssistantWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('stagia_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback default
      }
    }
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: `Bonjour ${user?.firstName || 'Stagiaire'} ! 👋\nJe suis **StagIA**, votre assistant virtuel propulsé par Gemini 2.0.\n\nComment puis-je vous aider aujourd'hui ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Quick Action Chips
  const quickActions = [
    { label: '⚡ Mes Tâches', prompt: 'Résume mes tâches en cours et leurs priorités' },
    { label: '⏱️ Pointage', prompt: 'Comment enregistrer mes heures de présence ?' },
    { label: '📄 Rapports', prompt: 'Comment soumettre mon rapport de stage ?' },
    { label: '🎯 Évaluation', prompt: 'Comment fonctionnent les évaluations de stage ?' }
  ];

  // Save conversation history to local storage
  useEffect(() => {
    localStorage.setItem('stagia_chat_history', JSON.stringify(messages));
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      // Build history payload
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text
        }));

      const response = await sendAIChatMessage(text, history);

      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: response.reply || "Je n'ai pas pu générer de réponse pour le moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        model: response.model
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: `⚠️ Désolé, une erreur s'est produite lors de la connexion à StagIA. Réessayez dans un instant.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    const defaultMsg = [
      {
        id: Date.now().toString(),
        role: 'assistant',
        text: `Discussion réinitialisée. Comment puis-je vous aider, ${user?.firstName || 'Stagiaire'} ?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setMessages(defaultMsg);
    localStorage.removeItem('stagia_chat_history');
  };

  // Simple Markdown text renderer helper
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Format bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm my-0.5">
            {formattedParts.slice(0).map(p => typeof p === 'string' ? p.replace(/^[-*]\s*/, '') : p)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-sm my-1 leading-relaxed">
          {formattedParts}
        </p>
      );
    });
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans">
      {/* TRIGGER FLOATING BUTTON */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative group flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
          title="Ouvrir StagIA Assistant"
        >
          {/* Animated Glow Halo */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 blur group-hover:opacity-100 transition duration-500 animate-pulse pointer-events-none" />
          
          <div className="relative flex items-center justify-center w-7 h-7 bg-white/20 backdrop-blur-md rounded-full">
            <SparklesIcon className="w-5 h-5 text-yellow-200 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <span className="relative font-bold text-sm tracking-wide">StagIA</span>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        </button>
      )}

      {/* CHAT WINDOW */}
      {isOpen && (
        <div
          className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 overflow-hidden ${
            isMinimized
              ? 'w-80 h-16'
              : 'w-96 sm:w-[420px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* CHAT HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-md rounded-xl border border-white/20">
                <SparklesIcon className="w-5 h-5 text-yellow-300" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  StagIA Assistant
                  <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-white/20 rounded-md text-white/90">Gemini</span>
                </h3>
                <p className="text-[11px] text-white/80 flex items-center gap-1">
                  <span>Assistant intelligent de stage</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                title="Effacer la conversation"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'Agrandir' : 'Réduire'}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowsPointingOutIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Fermer"
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CHAT BODY (HIDDEN WHEN MINIMIZED) */}
          {!isMinimized && (
            <>
              {/* MESSAGES CONTAINER */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-gray-900/50 scrollbar-thin">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none'
                          : msg.isError
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-tl-none'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/60 rounded-tl-none'
                      }`}
                    >
                      {renderFormattedText(msg.text)}
                    </div>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                      {msg.timestamp} {msg.model && `• ${msg.model}`}
                    </span>
                  </div>
                ))}

                {/* TYPING / LOADING INDICATOR */}
                {loading && (
                  <div className="flex items-start gap-2">
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5 font-medium">StagIA réfléchit...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK ACTION CHIPS */}
              <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {quickActions.map((action, idx) => (
                  <button
                    key={idx}
                    disabled={loading}
                    onClick={() => handleSendMessage(action.prompt)}
                    className="flex-shrink-0 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-800/50 rounded-full transition-colors disabled:opacity-50"
                  >
                    {action.label}
                  </button>
                ))}
              </div>

              {/* CHAT INPUT AREA */}
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                  placeholder="Posez une question à StagIA..."
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || loading}
                  className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Envoyer"
                >
                  <PaperAirplaneIcon className="w-5 h-5 transform -rotate-45 translate-x-0.5 -translate-y-0.5" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistantWidget;
