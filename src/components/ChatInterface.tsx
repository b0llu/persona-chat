import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PersonaSelector from './PersonaSelector';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
import { Message, Persona, ChatSession } from '../types';

const ChatInterface = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

    // Simulate AI response
    setTimeout(() => {
      const personaResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `As ${selectedPersona.name}, I understand your message. This is where I would respond in character! In a real implementation, this would be connected to an AI service that responds as the selected persona.`,
        sender: 'persona',
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, personaResponse];
      const finalChat: ChatSession = {
        ...updatedChat,
        messages: finalMessages,
        updatedAt: new Date(),
      };

      setChatSessions(prev => prev.map(chat => 
        chat.id === currentChat.id ? finalChat : chat
      ));
      setCurrentChat(finalChat);
      setIsLoading(false);
    }, 1000);
  };

  const handleChatSelect = (chat: ChatSession) => {
    setCurrentChat(chat);
    setSelectedPersona(chat.persona);
    navigate(`/chat/${chat.id}`);
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
    <div className="flex h-screen bg-background">
      <Sidebar
        chatSessions={chatSessions}
        currentChatId={currentChat?.id || null}
        onNewChat={createNewChat}
        onChatSelect={handleChatSelect}
        onDeleteChat={handleDeleteChat}
        user={user}
      />
      
      <div className="flex-1 flex flex-col">
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