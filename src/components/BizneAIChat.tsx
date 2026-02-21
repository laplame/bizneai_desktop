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
    setInputMessage('');
    setIsLoading(true);
    setSelectedMessageId(null);

    try {
      const response = await chatAPI.sendMessage(storeIdentifiers._id, {
        content: inputMessage,
        context: {
          businessType: storeIdentifiers.storeType || 'general',
          timestamp: new Date().toISOString()
        },
        senderType: 'customer',
        messageType: 'text'
      });

      if (response.success && response.data) {
        const updatedMessages = [...newMessages, response.data.aiResponse];
        setMessages(updatedMessages);
        saveToLocalStorage(updatedMessages);
      } else {
        // Simulate AI response if API fails
        const aiResponse: ChatMessage = {
          _id: `ai_${Date.now()}`,
          shopId: storeIdentifiers._id,
          content: generateMockResponse(inputMessage),
          context: {},
          senderType: 'ai',
          messageType: 'text',
          timestamp: new Date().toISOString(),
          status: 'sent'
        };
        const updatedMessages = [...newMessages, aiResponse];
        setMessages(updatedMessages);
        saveToLocalStorage(updatedMessages);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Generate mock response on error
      const aiResponse: ChatMessage = {
        _id: `ai_${Date.now()}`,
        shopId: storeIdentifiers._id,
        content: generateMockResponse(inputMessage),
        context: {},
        senderType: 'ai',
        messageType: 'text',
        timestamp: new Date().toISOString(),
        status: 'sent'
      };
      const updatedMessages = [...newMessages, aiResponse];
      setMessages(updatedMessages);
      saveToLocalStorage(updatedMessages);
      toast.error('Error al enviar mensaje. Usando respuesta simulada.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('venta') || lowerMessage.includes('sale')) {
      return `¡Entendido! He procesado la venta simulada. Aquí tienes el resumen de la transacción y cómo afecta tus métricas en tiempo real:

### Ticket de Venta
* **Producto:** Producto Ejemplo
* **Cantidad:** 1 unidad
* **Precio Unitario:** $100
* **Total de la Venta:** **$100**

---

### Actualización de Inventario
He actualizado el inventario según la venta procesada.
* **Stock Anterior:** 10 unidades
* **Venta:** -1 unidad
* **Stock Nuevo:** **9 unidades**`;
    }
    
    if (lowerMessage.includes('inventario') || lowerMessage.includes('inventory') || lowerMessage.includes('stock')) {
      return `Aquí está la información actualizada de tu inventario:

### Resumen de Inventario
* **Total de productos:** 25
* **Productos con stock bajo:** 3
* **Productos agotados:** 1
* **Valor total del inventario:** $15,000

¿Te gustaría ver detalles de algún producto específico o recibir alertas de stock bajo?`;
    }
    
    if (lowerMessage.includes('ventas') || lowerMessage.includes('sales') || lowerMessage.includes('reporte')) {
      return `### Reporte de Ventas

**Hoy:**
* Total de ventas: $1,250
* Número de transacciones: 15
* Promedio por venta: $83.33

**Esta semana:**
* Total de ventas: $8,500
* Número de transacciones: 102
* Producto más vendido: Producto A (45 unidades)

¿Necesitas un reporte más detallado o de un período específico?`;
    }
    
    return `¡Hola! Soy tu asistente inteligente de BizneAI. Estoy aquí para ayudarte con:

* Gestión de ventas y transacciones
* Control de inventario
* Reportes y análisis
* Consultas sobre productos y clientes

¿En qué puedo ayudarte hoy?`;
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

