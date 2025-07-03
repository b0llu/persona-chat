import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthButton from './AuthButton';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import PersonaSelector from './PersonaSelector';
import ChatMessage from './ChatMessage';
import geminiService from '../services/geminiService';
import { Persona } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'persona';
  timestamp: Date;
}

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePersonaSelect = (persona: Persona) => {
    setSelectedPersona(persona);
    setMessages([
      {
        id: '1',
        text: `Hello! I'm ${persona.name}. ${persona.description} How can I help you today?`,
        sender: 'persona',
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedPersona) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    const currentInputMessage = inputMessage;
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Create an empty persona message that will be updated as we stream
    const personaMessageId = (Date.now() + 1).toString();
    const personaResponse: Message = {
      id: personaMessageId,
      text: '',
      sender: 'persona',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, personaResponse]);
    
    // Keep loading true until we start receiving text

    try {
      // Use Gemini API to generate streaming response
      const conversationHistory = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      let accumulatedText = '';

      await geminiService.generateStreamResponse({
        persona: {
          name: selectedPersona.name,
          description: selectedPersona.description,
          category: selectedPersona.category
        },
        userMessage: currentInputMessage,
        conversationHistory
      }, (chunk: string) => {
        // Stop loading when we receive the first chunk
        if (accumulatedText === '') {
          setIsLoading(false);
        }
        
        // Accumulate the streaming text
        accumulatedText += chunk;
        
        // Update the persona message with the accumulated text
        setMessages(prev => prev.map(msg => 
          msg.id === personaMessageId 
            ? { ...msg, text: accumulatedText }
            : msg
        ));
      });

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Update the streaming message with an error response
      const errorText = `I apologize, but I'm having trouble responding right now. Please try again in a moment.`;
      
      setMessages(prev => prev.map(msg => 
        msg.id === personaMessageId 
          ? { ...msg, text: errorText }
          : msg
      ));
          } finally {
        setIsLoading(false);
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setSelectedPersona(null);
    setMessages([]);
    navigate('/chat');
  };

  if (!selectedPersona) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Dashboard
                </Button>
                <h1 className="text-2xl font-bold text-foreground">Select a Persona</h1>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <AuthButton />
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <PersonaSelector onPersonaSelect={handlePersonaSelect} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <img
                  src={selectedPersona.avatar}
                  alt={selectedPersona.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <h1 className="text-lg font-semibold text-foreground">{selectedPersona.name}</h1>
                  <p className="text-sm text-muted-foreground">{selectedPersona.category}</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={startNewChat}
                className="ml-4"
              >
                New Chat
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => {
            const isLastMessage = index === messages.length - 1;
            const isStreaming = isLastMessage && message.sender === 'persona' && !isLoading && message.text.length > 0;

            return (
              <ChatMessage
                key={message.id}
                message={message}
                persona={selectedPersona}
                user={user}
                isStreaming={isStreaming}
              />
            );
          })}
          {isLoading && (
            <div className="flex items-center gap-3 p-4">
              <img
                src={selectedPersona.avatar}
                alt={selectedPersona.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="bg-card rounded-lg p-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-border/50 p-6">
          <div className="flex gap-3">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${selectedPersona.name}...`}
              className="flex-1 resize-none bg-muted border border-input rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent min-h-[60px] max-h-[120px]"
              rows={1}
            />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                variant="outline"
                className="self-end px-6"
              >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat; 