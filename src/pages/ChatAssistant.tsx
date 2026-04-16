import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { Send, User, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export default function ChatAssistant() {
  const { userProfile, foodLogs } = useData();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  // Load chat history from database
  useEffect(() => {
    if (!userId) return;
    
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;

        if (data && data.length > 0) {
          setMessages(data.map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            created_at: m.created_at
          })));
        } else {
          // First time - show welcome message and save it
          const welcomeMsg: ChatMessage = {
            role: 'assistant',
            content: `Bonjour ${userProfile?.full_name || ''} ! 👋\n\nJe suis l'assistant nutritionnel. J'ai accès à votre profil de santé et à votre historique alimentaire pour vous donner des conseils personnalisés.\n\nComment puis-je vous aider ?`
          };
          setMessages([welcomeMsg]);
          await saveMessage(userId, welcomeMsg);
        }
      } catch (err) {
        console.error('Error loading chat history:', err);
        setMessages([{
          role: 'assistant',
          content: `Bonjour ! Je suis l'assistant nutritionnel. Comment puis-je vous aider ?`
        }]);
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();
  }, [userId]);

  // Save a single message to supabase
  const saveMessage = async (uid: string, msg: ChatMessage) => {
    try {
      const { data } = await supabase
        .from('chat_messages')
        .insert({ user_id: uid, role: msg.role, content: msg.content })
        .select('id')
        .single();
      return data?.id;
    } catch (err) {
      console.error('Error saving message:', err);
      return null;
    }
  };

  // Clear chat history
  const clearHistory = async () => {
    if (!userId) return;
    if (!confirm('Supprimer tout l\'historique de conversation ?')) return;
    
    try {
      await supabase.from('chat_messages').delete().eq('user_id', userId);
      const welcomeMsg: ChatMessage = {
        role: 'assistant',
        content: 'Conversation effacée. Comment puis-je vous aider ?'
      };
      setMessages([welcomeMsg]);
      await saveMessage(userId, welcomeMsg);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !userId) return;

    const userMessage = input.trim();
    const userMsg: ChatMessage = { role: 'user', content: userMessage };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Save user message to DB
    await saveMessage(userId, userMsg);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { 
          message: userMessage,
          profile: {
            name: userProfile?.full_name,
            medical_conditions: userProfile?.medical_conditions,
            allergies: userProfile?.allergies,
            goal: userProfile?.goal_type
          },
          logs: foodLogs.slice(0, 5)
        }
      });

      if (error) throw error;
      
      const replyContent = data?.reply || "Désolé, je n'ai pas pu générer de réponse. Réessayez dans quelques instants.";
      const assistantMsg: ChatMessage = { role: 'assistant', content: replyContent };
      
      setMessages(prev => [...prev, assistantMsg]);
      await saveMessage(userId, assistantMsg);

    } catch (error: any) {
      console.error('Chat error:', error);
      
      // Check if backend returned a specific error message
      const errorText = error?.message || "Désolé, une erreur est survenue lors de la connexion au serveur. Veuillez réessayer.";
      
      const errorMsg: ChatMessage = {
        role: 'assistant',
        content: errorText
      };
      setMessages(prev => [...prev, errorMsg]);
      await saveMessage(userId, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-3 z-10 flex items-center justify-between border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-1.5 rounded-full border border-emerald-100 flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Assistant Nutritionnel</h2>
            <p className="text-[11px] text-emerald-600 font-medium">Connecté à vos données</p>
          </div>
        </div>
        <button onClick={clearHistory}
          className="w-9 h-9 bg-gray-50 border border-gray-100 flex items-center justify-center rounded-lg hover:bg-red-50 hover:border-red-100 transition-colors"
          title="Effacer l'historique">
          <Trash2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 max-w-3xl mx-auto w-full">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
              <p className="text-sm text-gray-400">Chargement des messages...</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                    msg.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-emerald-600'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <img src="/logo.png" alt="Assistant" className="w-7 h-7 object-contain" />}
                  </div>
                  <div>
                    <div className={`px-4 py-3 rounded-2xl ${
                      msg.role === 'user' 
                        ? 'bg-emerald-500 text-white rounded-tr-md' 
                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-md'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    </div>
                    {msg.created_at && (
                      <p className={`text-[10px] mt-1 px-1 ${msg.role === 'user' ? 'text-right text-gray-300' : 'text-gray-300'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2.5 max-w-[85%]">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-gray-200 text-emerald-600 flex items-center justify-center mt-1">
                    <img src="/logo.png" alt="Assistant" className="w-7 h-7 object-contain" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm rounded-tl-md flex items-center gap-1.5 h-10">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input  */}
      <div className="bg-white p-3 pb-5 lg:pb-4 border-t border-gray-100 z-10 w-full mt-auto">
        <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez une question..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
            disabled={loading || loadingHistory}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-emerald-500 text-white rounded-xl w-11 h-11 flex flex-shrink-0 items-center justify-center disabled:opacity-40 hover:bg-emerald-600 transition-colors"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
