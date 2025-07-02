import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, X, Plus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import PersonaSelector from './PersonaSelector';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { Button } from './ui/button';
import { Message, Persona, ChatSession } from '../types';
import geminiService from '../services/geminiService';

const ChatInterface = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize with a default new chat if no chats exist
  useEffect(() => {
    if (chatSessions.length === 0) {
      createNewChat();
    } else if (chatId) {
      const chat = chatSessions.find(c => c.id === chatId);
      if (chat) {
        setCurrentChat(chat);
        setSelectedPersona(chat.persona);
      }
    } else if (!chatId && chatSessions.length > 0) {
      // If no chatId but we have chats, navigate to the first one
      navigate(`/chat/${chatSessions[0].id}`);
    }
  }, [chatId, chatSessions, navigate]);

  // Close mobile sidebar when selecting a chat
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [currentChat]);

  const createNewChat = () => {
    // Check if there's already an empty chat (no persona selected and no messages)
    const hasEmptyChat = chatSessions.some(chat => 
      !chat.persona && chat.messages.length === 0
    );
    
    if (hasEmptyChat) {
      // Navigate to the existing empty chat instead of creating a new one
      const emptyChat = chatSessions.find(chat => 
        !chat.persona && chat.messages.length === 0
      );
      if (emptyChat) {
        handleChatSelect(emptyChat);
        return;
      }
    }

    const newChat: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      persona: null,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setChatSessions(prev => [newChat, ...prev]);
    setCurrentChat(newChat);
    setSelectedPersona(null);
    navigate(`/chat/${newChat.id}`);
    setIsMobileSidebarOpen(false);
  };

  const handlePersonaSelect = (persona: Persona) => {
    if (!currentChat) return;

    const welcomeMessage: Message = {
      id: '1',
      text: `Hello! I'm ${persona.name}. ${persona.description} How can I help you today?`,
      sender: 'persona',
      timestamp: new Date(),
    };

    const updatedChat: ChatSession = {
      ...currentChat,
      persona,
      title: `Chat with ${persona.name}`,
      messages: [welcomeMessage],
      updatedAt: new Date(),
    };

    setChatSessions(prev => prev.map(chat => 
      chat.id === currentChat.id ? updatedChat : chat
    ));
    setCurrentChat(updatedChat);
    setSelectedPersona(persona);
  };

  const handleSendMessage = async (text: string) => {
    if (!currentChat || !selectedPersona || !text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...currentChat.messages, userMessage];
    const updatedChat: ChatSession = {
      ...currentChat,
      messages: updatedMessages,
      updatedAt: new Date(),
    };

    setChatSessions(prev => prev.map(chat => 
      chat.id === currentChat.id ? updatedChat : chat
    ));
    setCurrentChat(updatedChat);
    setIsLoading(true);

    // Create an empty persona message that will be updated as we stream
    const personaMessageId = (Date.now() + 1).toString();
    const personaResponse: Message = {
      id: personaMessageId,
      text: '',
      sender: 'persona',
      timestamp: new Date(),
    };

    const messagesWithStreaming = [...updatedMessages, personaResponse];
    const chatWithStreaming: ChatSession = {
      ...updatedChat,
      messages: messagesWithStreaming,
      updatedAt: new Date(),
    };

    setChatSessions(prev => prev.map(chat => 
      chat.id === currentChat.id ? chatWithStreaming : chat
    ));
    setCurrentChat(chatWithStreaming);

    try {
      // Use Gemini API to generate streaming response
      const conversationHistory = currentChat.messages.map(msg => ({
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
        userMessage: text,
        conversationHistory
      }, (chunk: string) => {
        // Stop loading when we receive the first chunk
        if (accumulatedText === '') {
          setIsLoading(false);
        }
        
        // Accumulate the streaming text
        accumulatedText += chunk;
        
        // Update the persona message with the accumulated text
        setChatSessions(prev => prev.map(chat => {
          if (chat.id === currentChat.id) {
            const updatedMessages = chat.messages.map(msg => 
              msg.id === personaMessageId 
                ? { ...msg, text: accumulatedText }
                : msg
            );
            return { ...chat, messages: updatedMessages, updatedAt: new Date() };
          }
          return chat;
        }));

        // Also update the current chat state
        setCurrentChat(prev => {
          if (!prev || prev.id !== currentChat.id) return prev;
          const updatedMessages = prev.messages.map(msg => 
            msg.id === personaMessageId 
              ? { ...msg, text: accumulatedText }
              : msg
          );
          return { ...prev, messages: updatedMessages, updatedAt: new Date() };
        });
      });

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Update the streaming message with an error response
      const errorText = `I apologize, but I'm having trouble responding right now. Please try again in a moment.`;
      
      setChatSessions(prev => prev.map(chat => {
        if (chat.id === currentChat.id) {
          const updatedMessages = chat.messages.map(msg => 
            msg.id === personaMessageId 
              ? { ...msg, text: errorText }
              : msg
          );
          return { ...chat, messages: updatedMessages, updatedAt: new Date() };
        }
        return chat;
      }));

      setCurrentChat(prev => {
        if (!prev || prev.id !== currentChat.id) return prev;
        const updatedMessages = prev.messages.map(msg => 
          msg.id === personaMessageId 
            ? { ...msg, text: errorText }
            : msg
        );
        return { ...prev, messages: updatedMessages, updatedAt: new Date() };
      });
          } finally {
        setIsLoading(false);
      }
  };

  const handleChatSelect = (chat: ChatSession) => {
    setCurrentChat(chat);
    setSelectedPersona(chat.persona);
    navigate(`/chat/${chat.id}`);
    setIsMobileSidebarOpen(false);
  };

  const handleDeleteChat = (chatId: string) => {
    setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      const remainingChats = chatSessions.filter(chat => chat.id !== chatId);
      if (remainingChats.length > 0) {
        handleChatSelect(remainingChats[0]);
      } else {
        createNewChat();
      }
    }
  };

  return (
    <div className="flex h-screen bg-background relative">
      {/* Mobile Navigation Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-md border-b border-border z-40 h-14">
        <div className="flex items-center justify-between px-4 h-full">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2 min-w-0 flex-1 mx-3">
            {selectedPersona ? (
              <>
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">
                  {selectedPersona.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-foreground truncate">
                  {selectedPersona.name}
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-foreground">
                Choose Persona
              </span>
            )}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={createNewChat}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setIsMobileSidebarOpen(false)}>
          <div className="w-80 max-w-[85vw] h-full bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Chats</h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="h-[calc(100%-4rem)]">
              <Sidebar
                chatSessions={chatSessions}
                currentChatId={currentChat?.id || null}
                onNewChat={createNewChat}
                onChatSelect={handleChatSelect}
                onDeleteChat={handleDeleteChat}
                user={user}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          chatSessions={chatSessions}
          currentChatId={currentChat?.id || null}
          onNewChat={createNewChat}
          onChatSelect={handleChatSelect}
          onDeleteChat={handleDeleteChat}
          user={user}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-14 lg:pt-0 min-w-0">
        {!selectedPersona ? (
          <PersonaSelector onPersonaSelect={handlePersonaSelect} />
        ) : (
          <ChatArea
            chat={currentChat}
            persona={selectedPersona}
            user={user}
            isLoading={isLoading}
            onSendMessage={handleSendMessage}
            onNewChat={createNewChat}
          />
        )}
      </div>
    </div>
  );
};

export default ChatInterface; 