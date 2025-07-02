import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthButton from './AuthButton';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import PersonaSelector from './PersonaSelector';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'persona';
  timestamp: Date;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  avatar: string;
  category: 'celebrity' | 'anime' | 'cartoon' | 'historical' | 'fictional';
}

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  // chatId will be used in future for loading specific chats
  console.log('Current chat ID:', chatId);
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

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response (in a real app, this would call an AI API)
    setTimeout(() => {
      const personaResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `As ${selectedPersona.name}, I understand your message. This is where I would respond in character! In a real implementation, this would be connected to an AI service that responds as the selected persona.`,
        sender: 'persona',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, personaResponse]);
      setIsLoading(false);
    }, 1000);
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
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              persona={selectedPersona}
              user={user}
            />
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 p-4">
              <img
                src={selectedPersona.avatar}
                alt={selectedPersona.name}
                className="w-8 h-8 rounded-full"
              />
              <div className="bg-card rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse flex space-x-1">
                    <div className="rounded-full bg-muted h-2 w-2"></div>
                    <div className="rounded-full bg-muted h-2 w-2"></div>
                    <div className="rounded-full bg-muted h-2 w-2"></div>
                  </div>
                  <span className="text-sm text-muted-foreground">typing...</span>
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