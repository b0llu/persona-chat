import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PersonaSelector from './PersonaSelector';
import Sidebar from './Sidebar';
import ChatArea from './ChatArea';
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