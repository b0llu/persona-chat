import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Plus, MessageCircle, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import PersonaSelector from './PersonaSelector';
import Sidebar from './Sidebar';
import ChatArea from '../chat/ChatArea';
import { Button } from '../../components/ui/button';
import { Message, Persona, ChatSession, FirebaseChatMetadata } from '../../types';
import geminiService from '../../services/geminiService';
import { mixpanelService } from '../../services/mixpanelService';
import * as chatService from '../../services/chatService';
import { imageService } from '../../services/imageService';
import { personaService } from '../../services/personaService';

const ChatInterface = () => {
  const { chatId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chatSessions, setChatSessions] = useState<FirebaseChatMetadata[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const hasCreatedInitialChat = useRef(false);
  const [localChats, setLocalChats] = useState<Map<string, ChatSession>>(new Map());
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Detect if this is a temporary chat route
  const isTemporaryChat = location.pathname.startsWith('/temp-chat');

  // Load user's chat list from Firebase on component mount
  useEffect(() => {
    if (!user?.uid) {
      setIsLoadingChats(false);
      hasCreatedInitialChat.current = false;
      setLocalChats(new Map());
      return;
    }

    // Reset the flag when user changes
    hasCreatedInitialChat.current = false;
    setLocalChats(new Map());

    const loadChatList = async () => {
      try {
        const chats = await chatService.getChatList(user.uid);
        setChatSessions(chats);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChatList();

    // Subscribe to real-time chat updates
    const unsubscribe = chatService.subscribeToChats(user.uid, (chats) => {
      setChatSessions(chats);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Clean up local chats that have been saved to Firebase
  useEffect(() => {
    if (chatSessions.length === 0) return;
    
    for (const [chatId] of localChats) {
      const existsInFirebase = chatSessions.find(chat => chat.id === chatId);
      if (existsInFirebase) {
        // Chat now exists in Firebase, remove from local storage
        setLocalChats(prev => {
          const newMap = new Map(prev);
          newMap.delete(chatId);
          return newMap;
        });
      }
    }
  }, [chatSessions, localChats]);

  // Combine Firebase chats and local chats for sidebar display
  const allChats = React.useMemo(() => {
    const combined: ChatSession[] = [];
    
    // Add Firebase chats (convert metadata to ChatSession for display)
    chatSessions.forEach(metadata => {
      combined.push({
        id: metadata.id,
        title: metadata.title,
        persona: metadata.persona,
        userId: metadata.userId,
        messages: [], // Metadata doesn't include messages
        createdAt: new Date(metadata.createdAt),
        updatedAt: new Date(metadata.updatedAt),
        temporary: false,
      });
    });
    
    // Add local chats that aren't in Firebase yet
    for (const [chatId, localChat] of localChats) {
      if (!chatSessions.find(chat => chat.id === chatId) && !localChat.temporary) {
        combined.unshift(localChat); // Add to beginning (newest first)
      }
    }
    
    // Sort by updatedAt (newest first)
    return combined.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [chatSessions, localChats]);

  // Generate image for a persona that doesn't have one
  const generatePersonaImage = async (persona: Persona): Promise<Persona> => {
    if (!user?.uid) return persona;
    
    setIsGeneratingImage(true);
    try {
      const prompt = `A portrait of ${persona.name}, ${persona.description}, in a modern digital art style, must be a portrait, no text, no watermark, centered, high quality`;
      
      // Generate the image using Gemini
      const imageDataUrl = await imageService.generateImage({ prompt });
      
      // Upload to Cloudinary with a custom name
      const avatarUrl = await imageService.uploadToCloudinary(imageDataUrl, persona.name);
      
      // Create updated persona with avatar
      const updatedPersona: Persona = {
        ...persona,
        avatar: avatarUrl
      };
      
      // Update the persona in Firebase with the new avatar
      await personaService.savePersona(updatedPersona, user.uid);
      
      // Update the current chat metadata if it exists in Firebase
      if (currentChat && currentChat.persona && currentChat.persona.id === persona.id) {
        try {
          const chatExists = await chatService.chatExistsInFirebase(currentChat.id, user.uid);
          if (chatExists) {
            // Update the chat with the new persona avatar
            const updatedChat: ChatSession = {
              ...currentChat,
              persona: updatedPersona,
              updatedAt: new Date()
            };
            await chatService.updateChat(updatedChat);
          }
        } catch (chatUpdateError) {
          console.error('Error updating chat metadata with new avatar:', chatUpdateError);
        }
      }
      
      return updatedPersona;
    } catch (error) {
      console.error('Error generating persona image:', error);
      // Return original persona if image generation fails
      return persona;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const createNewChat = useCallback(() => {
    if (!user?.uid) return;

    // Check if there's already a new chat (no persona and no user messages)
    const existingNewChat = allChats.find(chat => 
      !chat.persona && 
      (chat.messages.length === 0 || 
       chat.messages.every(msg => msg.sender === 'persona'))
    );

    if (existingNewChat) {
      // Navigate to existing new chat instead of creating another one
      setCurrentChat(existingNewChat);
      setSelectedPersona(null);
      navigate(`/chat/${existingNewChat.id}`);
      setIsMobileSidebarOpen(false);
      return;
    }

    // Create a local chat that will be saved to Firebase only when user sends first message
    const newChat: ChatSession = {
      id: chatService.generateChatId(),
      title: 'New Chat',
      persona: null,
      userId: user.uid,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Store in local chats map
    setLocalChats(prev => new Map(prev).set(newChat.id, newChat));
    
    setCurrentChat(newChat);
    setSelectedPersona(null);
    navigate(`/chat/${newChat.id}`);
    setIsMobileSidebarOpen(false);
  }, [user?.uid, navigate, allChats]);

  // Handle chat selection by ID from URL
  useEffect(() => {
    if (!user?.uid || isLoadingChats) return;

    const handleChatFromUrl = async () => {
      if (chatId) {
        try {
          // First check if it's a local chat (not yet saved to Firebase)
          const localChat = localChats.get(chatId);
          if (localChat) {
            setCurrentChat(localChat);
            setSelectedPersona(localChat.persona);
            return;
          }

          // If current chat ID matches URL chat ID, don't reload unnecessarily
          if (currentChat?.id === chatId) {
            return;
          }

          // If not local, try to load from Firebase
          const chat = await chatService.getChatById(chatId, user.uid);
          if (chat) {
            setCurrentChat(chat);
            setSelectedPersona(chat.persona);
          } else {
            // Chat not found in Firebase or local, redirect to dashboard
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error loading chat:', error);
          navigate('/dashboard');
        }
      } else {
        // No chatId in URL - this means we're on /dashboard
        // Don't auto-create, just clear current chat
        setCurrentChat(null);
        setSelectedPersona(null);
      }
      
      
    };

    handleChatFromUrl();
  }, [chatId, user?.uid, isLoadingChats, navigate]);

  // Close mobile sidebar when selecting a chat
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [currentChat]);

  // Generate image for persona if it doesn't have one when chat is loaded
  useEffect(() => {
    console.log('selectedPersona', selectedPersona);
    console.log('isGeneratingImage', isGeneratingImage);
    console.log('user?.uid', user?.uid);
    if (selectedPersona && !selectedPersona.avatar && !isGeneratingImage && user?.uid) {
      generatePersonaImage(selectedPersona).then(updatedPersona => {
        // Update the selected persona and current chat with the new avatar
        setSelectedPersona(updatedPersona);
        if (currentChat) {
          setCurrentChat(prev => prev ? { ...prev, persona: updatedPersona } : null);
        }
      });
    }
  }, [selectedPersona?.id, selectedPersona?.avatar, isGeneratingImage, user?.uid]);

  const handlePersonaSelect = (persona: Persona) => {
    if (!currentChat || !user?.uid) return;

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

    // Update local state immediately
    setCurrentChat(updatedChat);
    setSelectedPersona(persona);

    // Update local chat if it exists
    if (localChats.has(currentChat.id)) {
      setLocalChats(prev => new Map(prev).set(currentChat.id, updatedChat));
    }

    // Chat will be saved to Firebase only when user sends first message
  };

  const handleSendMessage = async (text: string) => {
    if (!currentChat || !selectedPersona || !text.trim() || !user?.uid) return;

    // Track temporary chat usage when user sends first message
    if (isTemporaryChat && currentChat.messages.length === 1 && currentChat.messages[0].sender === 'persona') {
      mixpanelService.trackTempChatUsed();
    }

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

    // Update local state immediately for responsiveness
    setCurrentChat(updatedChat);
    setIsLoading(true);

    let chatExists = false;
    // Check if this chat exists in Firebase - if not, create it (lazy creation)
    if (!isTemporaryChat) {
      chatExists = await chatService.chatExistsInFirebase(currentChat.id, user.uid);
      if (!chatExists) {
        try {
          await chatService.createChat({
            id: updatedChat.id,
            title: updatedChat.title,
            persona: updatedChat.persona,
            userId: updatedChat.userId,
            messages: updatedMessages, // Include the user message
            createdAt: updatedChat.createdAt,
            updatedAt: updatedChat.updatedAt,
          });
          
          // Track chat creation in Mixpanel
          mixpanelService.trackChatCreated({
            chat_id: updatedChat.id,
            persona_name: updatedChat.persona?.name,
            persona_category: updatedChat.persona?.category,
            user_id: updatedChat.userId,
          });
          
        } catch (error) {
          console.error('Error creating chat in Firebase:', error);
          // Continue with local state even if Firebase fails
        }
      }
    }

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
        const updatedStreamingMessages = messagesWithStreaming.map(msg => 
          msg.id === personaMessageId 
            ? { ...msg, text: accumulatedText }
            : msg
        );
        
        const finalUpdatedChat: ChatSession = {
          ...chatWithStreaming,
          messages: updatedStreamingMessages,
          updatedAt: new Date()
        };
        
        setCurrentChat(finalUpdatedChat);
      });

      // Save the final chat to Firebase after streaming is complete
      if (!isTemporaryChat) {
        const finalMessages = messagesWithStreaming.map(msg => 
          msg.id === personaMessageId 
            ? { ...msg, text: accumulatedText }
            : msg
        );
        
        const finalChat: ChatSession = {
          ...chatWithStreaming,
          messages: finalMessages,
          updatedAt: new Date()
        };

        await chatService.updateChat(finalChat);

        // Don't immediately remove from local chats - let the Firebase listener handle it
        // This prevents the sidebar from briefly showing "No chats yet"
      }

    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Update the streaming message with an error response
      const errorText = `I apologize, but I'm having trouble responding right now. Please try again in a moment.`;
      
      const errorMessages = messagesWithStreaming.map(msg => 
        msg.id === personaMessageId 
          ? { ...msg, text: errorText }
          : msg
      );
      
      const errorChat: ChatSession = {
        ...chatWithStreaming,
        messages: errorMessages,
        updatedAt: new Date()
      };
      
      setCurrentChat(errorChat);
      
      // Try to save error state to Firebase (only if chat exists)
      try {
        if (chatExists) {
          await chatService.updateChat(errorChat);
        }
      } catch (saveError) {
        console.error('Error saving error state:', saveError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSelect = async (chat: ChatSession) => {
    if (!user?.uid) return;

    try {
      // Check if it's a local chat first
      const localChat = localChats.get(chat.id);
      if (localChat) {
        setCurrentChat(localChat);
        setSelectedPersona(localChat.persona);
        navigate(`/chat/${chat.id}`);
        setIsMobileSidebarOpen(false);
        return;
      }

      // Load full chat data from Firebase
      const fullChat = await chatService.getChatById(chat.id, user.uid);
      if (fullChat) {
        setCurrentChat(fullChat);
        setSelectedPersona(fullChat.persona);
        navigate(`/chat/${chat.id}`);
        setIsMobileSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      // Fallback to the metadata we have
      setCurrentChat(chat);
      setSelectedPersona(chat.persona);
      navigate(`/chat/${chat.id}`);
      setIsMobileSidebarOpen(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user?.uid) return;

    try {
      // Check if it's a local chat first
      if (localChats.has(chatId)) {
        // Remove from local chats
        setLocalChats(prev => {
          const newMap = new Map(prev);
          newMap.delete(chatId);
          return newMap;
        });
      } else {
        // Remove from Firebase
        await chatService.deleteChat(chatId);
        
        // Remove from local state
        setChatSessions(prev => prev.filter(chat => chat.id !== chatId));
      }
      
      if (currentChat?.id === chatId) {
        const remainingChats = allChats.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          handleChatSelect(remainingChats[0]);
        } else {
          // No more chats, go to dashboard
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
      };

  // Handler to toggle temporary chat state before user input
  const handleToggleTemporaryChat = useCallback((toTemporary: boolean) => {
    if (!currentChat) return;
    if (
      currentChat.persona &&
      currentChat.messages.length === 1 &&
      currentChat.messages[0].sender === 'persona'
    ) {
      const updatedChat: ChatSession = {
        ...currentChat,
        temporary: toTemporary,
      };
      setLocalChats(prev => new Map(prev).set(updatedChat.id, updatedChat));
      setCurrentChat(updatedChat);
      if (toTemporary) {
        navigate(`/temp-chat/${updatedChat.id}`);
      } else {
        navigate(`/chat/${updatedChat.id}`);
      }
    }
  }, [currentChat, navigate]);

  // Show loading state while chats are being loaded
  if (isLoadingChats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show dashboard content when no chatId (regardless of whether chats exist)
  if (!chatId) {
    return (
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar - Empty State */}
        <div className="hidden lg:block">
          <Sidebar
            chatSessions={allChats}
            currentChatId={null}
            onNewChat={createNewChat}
            onChatSelect={handleChatSelect}
            onDeleteChat={handleDeleteChat}
          />
        </div>

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
            
            <span className="text-sm font-medium text-foreground">
              Persona Chat
            </span>
            
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
                  chatSessions={allChats}
                  currentChatId={null}
                  onNewChat={createNewChat}
                  onChatSelect={handleChatSelect}
                  onDeleteChat={handleDeleteChat}
                  isMobile={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="flex-1 flex flex-col pt-14 lg:pt-0 min-w-0">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-8">
              {/* Welcome Section */}
              <div className="space-y-4">
                <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-12 h-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-foreground">
                    {allChats.length === 0 ? 'Welcome to Persona Chat' : 'Dashboard'}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {allChats.length === 0 
                      ? 'Chat with your favorite personas and characters'
                      : `You have ${allChats.length} chat${allChats.length === 1 ? '' : 's'}. Start a new one or select from the sidebar.`
                    }
                  </p>
                </div>
              </div>

              {/* Features - only show for new users */}
              {allChats.length === 0 && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-card rounded-lg border border-border p-4 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">AI-Powered Conversations</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enjoy realistic conversations powered by advanced AI technology
                    </p>
                  </div>

                  <div className="bg-card rounded-lg border border-border p-4 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">Diverse Personas</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Choose from celebrities, anime characters, and historical figures
                    </p>
                  </div>
                </div>
              )}

              {/* Call to Action */}
              <div className="space-y-4">
                <Button 
                  onClick={createNewChat}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {allChats.length === 0 ? 'Start Your First Chat' : 'Start New Chat'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  {allChats.length === 0 
                    ? 'Choose a persona and start chatting immediately'
                    : 'Create a new conversation with any persona'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                {selectedPersona.avatar ? (
                  <img
                    src={selectedPersona.avatar}
                    alt={selectedPersona.name}
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-xs flex-shrink-0">
                    {selectedPersona.name.charAt(0).toUpperCase()}
                  </div>
                )}
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
                chatSessions={allChats}
                currentChatId={currentChat?.id || null}
                onNewChat={createNewChat}
                onChatSelect={handleChatSelect}
                onDeleteChat={handleDeleteChat}
                isMobile={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          chatSessions={allChats}
          currentChatId={currentChat?.id || null}
          onNewChat={createNewChat}
          onChatSelect={handleChatSelect}
          onDeleteChat={handleDeleteChat}
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
            isTemporaryChat={isTemporaryChat}
            onToggleTemporaryChat={handleToggleTemporaryChat}
            isGeneratingImage={isGeneratingImage}
          />
        )}
      </div>
    </div>
  );
};

export default ChatInterface; 