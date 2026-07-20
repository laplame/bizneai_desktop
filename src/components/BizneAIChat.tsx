import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Mic,
  Camera,
  Image as ImageIcon,
  Settings,
  Archive,
  Trash2,
  Lightbulb,
  Menu,
  Search,
  Bookmark,
  Download,
  X,
  Loader
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { chatAPI } from '../api/chat';
import { useStore } from '../contexts/StoreContext';
import { ChatMessage } from '../types/api';

interface BizneAIChatProps {
  isOpen?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "What are today's top selling products?",
  "Show low inventory alerts",
  "Generate sales report for this week",
  "What products need restocking?",
  "Show customer analytics"
];

const BizneAIChat: React.FC<BizneAIChatProps> = ({ isOpen = true }) => {
  const { storeIdentifiers } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat history on mount
  useEffect(() => {
    if (storeIdentifiers._id) {
      loadChatHistory();
    }
  }, [storeIdentifiers._id]);

  const loadChatHistory = async () => {
    if (!storeIdentifiers._id) return;
    
    try {
      const response = await chatAPI.getChatHistory(storeIdentifiers._id, {
        limit: 50,
        page: 1
      });
      
      if (response.success && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Load from local storage as fallback
      const localHistory = localStorage.getItem('bizneai-chat-history');
      if (localHistory) {
        try {
          setMessages(JSON.parse(localHistory));
        } catch (e) {
          console.error('Error parsing local chat history:', e);
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !storeIdentifiers._id) return;

    const userMessage: ChatMessage = {
      _id: `msg_${Date.now()}`,
      shopId: storeIdentifiers._id,
      content: inputMessage,
      context: {},
      senderType: 'staff',
      messageType: 'text',
      timestamp: new Date().toISOString(),
      status: 'sent'
    };

    // Add user message immediately
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveToLocalStorage(newMessages);
    const sentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setSelectedMessageId(null);

    const pushErrorMessage = (content: string) => {
      const errorMessage: ChatMessage = {
        _id: `ai_${Date.now()}`,
        shopId: storeIdentifiers._id!,
        content,
        context: {},
        senderType: 'ai',
        messageType: 'text',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
      saveToLocalStorage(updatedMessages);
    };

    try {
      const geminiApiKey = localStorage.getItem('bizneai-gemini-key') || undefined;
      const history = messages.slice(-10).map((m) => ({ senderType: m.senderType, content: m.content }));

      const response = await chatAPI.sendMessage(storeIdentifiers._id, {
        content: sentMessage,
        context: {
          businessType: storeIdentifiers.storeType || 'general',
          storeName: storeIdentifiers.storeName || undefined,
          timestamp: new Date().toISOString()
        },
        senderType: 'customer',
        messageType: 'text',
        geminiApiKey,
        history
      });

      if (response.success && response.data) {
        const updatedMessages = [...newMessages, response.data.aiResponse];
        setMessages(updatedMessages);
        saveToLocalStorage(updatedMessages);
      } else if (response.error === 'GEMINI_API_KEY_MISSING') {
        const text = 'No tienes configurada tu API key de Gemini. Ve a Configuración → IA para agregarla y poder usar el asistente.';
        toast.error(text);
        pushErrorMessage(text);
      } else {
        const text = response.message || 'No se pudo obtener respuesta del asistente de IA. Intenta de nuevo en unos segundos.';
        toast.error(text);
        pushErrorMessage(text);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const text = 'No se pudo conectar con el asistente de IA. Verifica tu conexión e inténtalo de nuevo.';
      toast.error(text);
      pushErrorMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToLocalStorage = (messagesToSave: ChatMessage[]) => {
    localStorage.setItem('bizneai-chat-history', JSON.stringify(messagesToSave));
  };

  const handleSuggestedQuestion = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleMessageAction = (action: 'process' | 'archive' | 'delete', messageId: string) => {
    if (action === 'delete') {
      const updatedMessages = messages.filter(msg => msg._id !== messageId);
      setMessages(updatedMessages);
      saveToLocalStorage(updatedMessages);
      toast.success('Mensaje eliminado');
    } else if (action === 'archive') {
      toast.success('Mensaje archivado');
    } else if (action === 'process') {
      toast.success('Procesando mensaje...');
    }
    setSelectedMessageId(null);
  };

  const formatMessageContent = (content: string) => {
    // Simple markdown-like formatting
    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('### ')) {
        return <h3 key={index} className="message-heading">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('* **')) {
        const match = line.match(/\*\* (.+?):\*\* (.+)/);
        if (match) {
          return (
            <p key={index} className="message-list-item">
              <strong>{match[1]}:</strong> {match[2]}
            </p>
          );
        }
      }
      if (line.startsWith('---')) {
        return <hr key={index} className="message-divider" />;
      }
      if (line.trim() === '') {
        return <br key={index} />;
      }
      return <p key={index}>{line}</p>;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="bizneai-chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <button className="chat-menu-btn">
            <Menu size={20} />
          </button>
          <div className="chat-header-title">
            <h1>BizneAI</h1>
            <p>Intelligent Business Assistant</p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="chat-action-btn" title="Search">
            <Search size={18} />
          </button>
          <button className="chat-action-btn" title="Bookmark">
            <Bookmark size={18} />
          </button>
          <button className="chat-action-btn" title="Download">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="chat-messages-container" ref={chatContainerRef}>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <MessageSquare size={64} />
              <h3>Inicia una conversación</h3>
              <p>Pregúntame sobre tu negocio, ventas, inventario o cualquier otra cosa que necesites.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`chat-message ${message.senderType === 'staff' ? 'user-message' : 'ai-message'}`}
              >
                <div className="message-bubble">
                  {message.senderType === 'staff' ? (
                    <>
                      <div className="message-content">
                        {message.content}
                      </div>
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      {selectedMessageId === message._id && (
                        <div className="message-actions">
                          <button
                            className="message-action-btn"
                            onClick={() => handleMessageAction('process', message._id)}
                            title="Process"
                          >
                            <Settings size={14} />
                          </button>
                          <button
                            className="message-action-btn"
                            onClick={() => handleMessageAction('archive', message._id)}
                            title="Archive"
                          >
                            <Archive size={14} />
                          </button>
                          <button
                            className="message-action-btn delete"
                            onClick={() => handleMessageAction('delete', message._id)}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <button
                        className="message-options-btn"
                        onClick={() => setSelectedMessageId(selectedMessageId === message._id ? null : message._id)}
                      >
                        <span>⋯</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="message-content">
                        {formatMessageContent(message.content)}
                      </div>
                      <div className="message-time">
                        {new Date(message.timestamp).toLocaleTimeString('es-MX', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="chat-message ai-message">
              <div className="message-bubble">
                <div className="message-content">
                  <Loader size={16} className="spinner" />
                  <span>Pensando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Suggested Questions */}
      {messages.length === 0 && (
        <div className="suggested-questions">
          <div className="suggested-questions-header">
            <Lightbulb size={18} />
            <span>Suggested Questions</span>
          </div>
          <div className="suggested-questions-list">
            {SUGGESTED_QUESTIONS.slice(0, 2).map((question, index) => (
              <button
                key={index}
                className="suggested-question-btn"
                onClick={() => handleSuggestedQuestion(question)}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-container">
        <div className="chat-input-actions">
          <button className="chat-input-btn" title="Microphone">
            <Mic size={20} />
          </button>
          <button className="chat-input-btn" title="Camera">
            <Camera size={20} />
          </button>
          <button className="chat-input-btn" title="Gallery">
            <ImageIcon size={20} />
          </button>
        </div>
        <input
          type="text"
          className="chat-input"
          placeholder="Ask me about your business..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <button
          className="chat-send-btn"
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          title="Send"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default BizneAIChat;

