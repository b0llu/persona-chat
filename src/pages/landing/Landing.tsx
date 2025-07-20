import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { LogIn, Search, Send } from 'lucide-react';
import { personaService } from '../../services/personaService';
import { Persona, Message, ChatSession } from '../../types';
import geminiService from '../../services/geminiService';
import { imageService } from '../../services/imageService';
import ChatMessage from '../chat/ChatMessage';
import BouncingDots from '../chat/BouncingDots';
import { useAuth } from '@/hooks/useAuth';

const Landing = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Persona[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [translateX, setTranslateX] = useState(0);
  const [allPersonas, setAllPersonas] = useState<Persona[]>([]);
  const { signInWithGoogle } = useAuth();
  
    // Chat-related state
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isChatActive, setIsChatActive] = useState(false);
  const [isCreatingPersona, setIsCreatingPersona] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const MAX_MESSAGES = 2;

  const carouselItems = [
    {
      title: "Financial Advisor",
      description: "Get expert financial advice and investment guidance"
    },
    {
      title: "Therapist",
      description: "Talk through your thoughts with a caring mental health professional"
    },
    {
      title: "Personal Trainer",
      description: "Receive workout plans and fitness motivation tailored to you"
    },
    {
      title: "Career Coach",
      description: "Navigate your career path with professional development insights"
    },
    {
      title: "Language Tutor",
      description: "Practice and learn new languages with patient teaching"
    },
    {
      title: "Life Coach",
      description: "Set goals and build habits with personalized life coaching"
    }
  ];

  // Create multiple copies for seamless infinite scroll
  const infiniteItems = [...carouselItems, ...carouselItems, ...carouselItems];

  // Load personas on component mount
  useEffect(() => {
    const loadPersonas = async () => {
      const personas = await personaService.loadPersonas();
      setAllPersonas(personas);
    };
    loadPersonas();
  }, []);

  // Auto-scroll with seamless infinite loop
  useEffect(() => {
    if (showSearch) return; // Stop carousel when search is active

    const interval = setInterval(() => {
      setTranslateX(prev => {
        const newTranslateX = prev - 100; // Move one slide width (100%)
        
        // Reset position when we've scrolled through one complete set
        if (Math.abs(newTranslateX) >= carouselItems.length * 100) {
          return 0; // Reset to beginning seamlessly
        }
        
        return newTranslateX;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [carouselItems.length, showSearch]);

  const handleStartChatting = () => {
    setShowSearch(true);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // Clear previous results immediately when starting new search
    setSearchResults([]);
    setIsSearching(true);
    
    try {
      let personasToUse = allPersonas;
      
      // If no personas loaded yet, try to load them
      if (personasToUse.length === 0) {
        const personas = await personaService.loadPersonas();
        setAllPersonas(personas);
        personasToUse = personas;
      }
      
      // Use the intelligent search function
      const intelligentResults = await geminiService.intelligentPersonaSearch(searchQuery, personasToUse);
      
      // Convert PersonaWithAvatar to Persona format
      const convertedResults = intelligentResults.map(result => ({
        id: result.id,
        name: result.name,
        description: result.description,
        avatar: result.avatar,
        category: result.category
      }));
      
      setSearchResults(convertedResults);
        } catch (error) {
      console.error('Error in intelligent search:', error);
      // Show empty results if AI search fails
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };



  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (showChat && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, showChat]);

    const handlePersonaSelect = async (persona: Persona) => {
    // Check if this persona already exists in our database
    const existingPersona = allPersonas.find(p => p.id === persona.id);
    
    if (existingPersona) {
      // Persona already exists with avatar, start chat immediately
      setSelectedPersona(existingPersona);
      setShowChat(true);
      setMessages([]);
      setMessageCount(0);
      setIsChatActive(false);
      
      const welcomeMessage: Message = {
        id: '1',
        text: `Hello! I'm ${existingPersona.name}. ${existingPersona.description} How can I help you today?`,
        sender: 'persona',
        timestamp: new Date(),
      };
      
      setMessages([welcomeMessage]);
    } else {
      // This is a new persona, create it with avatar
      setIsCreatingPersona(true);
      
      try {
        // Generate image for the persona using the same prompt as PersonaSearchModal
        let avatarUrl = '';
        try {
          const prompt = `A portrait of ${persona.name}, ${persona.description}, in a modern digital art style, must be a portrait, no text, no watermark, centered, high quality`;
          
          // Generate the image using Gemini
          const imageDataUrl = await imageService.generateImage({ prompt });
          
          // Upload to Cloudinary with a custom name
          avatarUrl = await imageService.uploadToCloudinary(imageDataUrl, persona.name);
        } catch (imageError) {
          console.error('Error generating/uploading persona image:', imageError);
          // Continue without image if generation fails
          avatarUrl = '';
        }
        
        // Create a proper persona object with the generated image
        const newPersona: Persona = {
          ...persona,
          avatar: avatarUrl
        };
        
        // Save to Firebase (without user ID since user isn't logged in yet)
        const saveSuccess = await personaService.savePersona(newPersona);
        
        if (saveSuccess) {
          // Update the personas list to include the new one
          setAllPersonas(prev => [...prev, newPersona]);
        }
        
        // Start the chat with the complete persona (whether save succeeded or not)
        setSelectedPersona(newPersona);
        setShowChat(true);
        setMessages([]);
        setMessageCount(0);
        setIsChatActive(false);
        
        // Create welcome message
        const welcomeMessage: Message = {
          id: '1',
          text: `Hello! I'm ${newPersona.name}. ${newPersona.description} How can I help you today?`,
          sender: 'persona',
          timestamp: new Date(),
        };
        
        setMessages([welcomeMessage]);
        
      } catch (error) {
        console.error('Error processing new persona:', error);
        // Fallback: start chat with original persona without avatar
        setSelectedPersona(persona);
        setShowChat(true);
        setMessages([]);
        setMessageCount(0);
        setIsChatActive(false);
        
        const welcomeMessage: Message = {
          id: '1',
          text: `Hello! I'm ${persona.name}. ${persona.description} How can I help you today?`,
          sender: 'persona',
          timestamp: new Date(),
        };
        
        setMessages([welcomeMessage]);
      } finally {
        setIsCreatingPersona(false);
      }
    }
  };



  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedPersona || messageCount >= MAX_MESSAGES || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setMessageCount(prev => prev + 1);
    setIsLoading(true);
    setIsChatActive(true);

    // Create an empty persona message that will be updated as we stream
    const personaMessageId = (Date.now() + 1).toString();
    const personaResponse: Message = {
      id: personaMessageId,
      text: '',
      sender: 'persona',
      timestamp: new Date(),
    };

    const messagesWithStreaming = [...updatedMessages, personaResponse];
    setMessages(messagesWithStreaming);

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
        userMessage: userMessage.text,
        conversationHistory
      }, (chunk: string) => {
        // Stop loading when we receive the first chunk
        if (accumulatedText === '') {
          setIsLoading(false);
        }
        
        // Accumulate the streaming text
        accumulatedText += chunk;
        
        // Update the persona message with the accumulated text
        setMessages(messagesWithStreaming.map(msg => 
          msg.id === personaMessageId 
            ? { ...msg, text: accumulatedText }
            : msg
        ));
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Update the streaming message with an error response
      const errorText = `I apologize, but I'm having trouble responding right now. Please try again in a moment.`;
      
      setMessages(messagesWithStreaming.map(msg => 
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
      if (showChat) {
        handleSendMessage();
      } else {
        handleSearch();
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Store current chat state before login
      const currentChatState = {
        selectedPersona,
        messages,
        messageCount,
        isChatActive
      };
      
      const user = await signInWithGoogle();
      
      // Update ownership of the persona the user was chatting with (if any)
      if (user && currentChatState.selectedPersona) {
        try {
          await personaService.updatePersonaOwnership(currentChatState.selectedPersona.id, user.uid);
        } catch (error) {
          console.error('Error updating persona ownership after login:', error);
        }
      }
      
      // If login successful and there's an active chat with messages, create it in Firebase
      if (user && currentChatState.selectedPersona && currentChatState.messages.length > 0) {
        // Import chat service dynamically to avoid circular dependencies
        const { createChat, generateChatId } = await import('../../services/chatService');
        const { mixpanelService } = await import('../../services/mixpanelService');
        
        // Create a new chat session
        const newChat: ChatSession = {
          id: generateChatId(),
          title: `Chat with ${currentChatState.selectedPersona.name}`,
          persona: currentChatState.selectedPersona,
          userId: user.uid,
          messages: currentChatState.messages,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        try {
          // Save to Firebase
          await createChat(newChat);
          
          // Track chat creation
          mixpanelService.trackChatCreated({
            chat_id: newChat.id,
            persona_name: newChat.persona?.name,
            persona_category: newChat.persona?.category,
            user_id: newChat.userId,
          });
          
          // Redirect to dashboard with the created chat
          window.location.href = `/chat/${newChat.id}`;
          return;
        } catch (error) {
          console.error('Error creating chat after login:', error);
          // Fallback: just redirect to dashboard
        }
      }
      
      // Default redirect to dashboard if no active chat
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-primary/5"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              scale: 0 
            }}
            animate={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              scale: 1 
            }}
            transition={{
              duration: 20 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-6xl mx-auto w-full flex flex-col items-center space-y-16"
          >
            {/* Title - Hidden when search is active */}
            <AnimatePresence>
              {!showSearch && (
                <motion.h1 
                  className="text-6xl md:text-8xl font-bold text-foreground"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.6 }}
                >
                  Persona<span className="text-primary">Chat</span>
                </motion.h1>
              )}
            </AnimatePresence>

            {/* Content Area - Either Carousel+Button OR Search Interface OR Chat Interface */}
            <div className="w-full max-w-4xl min-h-[200px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {showChat ? (
                  /* Chat Interface */
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.6 }}
                    className="fixed inset-0 flex flex-col bg-background"
                  >
                    {/* Chat Header */}
                    <div className="flex items-center justify-center p-4 border-b border-border bg-card/80 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                        {selectedPersona?.avatar ? (
                          <img 
                            src={selectedPersona.avatar} 
                            alt={selectedPersona.name}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg">
                            {selectedPersona?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{selectedPersona?.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{selectedPersona?.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
                        {messages.map((message, index) => {
                          const isLastMessage = index === messages.length - 1;
                          const isStreaming = isLastMessage && message.sender === 'persona' && !isLoading && message.text.length > 0;

                          return (
                            <ChatMessage
                              key={message.id}
                              message={message}
                              persona={selectedPersona!}
                              user={null}
                              isStreaming={isStreaming}
                              shouldStream={isChatActive}
                            />
                          );
                        })}
                        
                        {isLoading && (
                          <div className="flex items-center gap-3">
                            {selectedPersona?.avatar ? (
                              <img 
                                src={selectedPersona.avatar} 
                                alt={selectedPersona.name}
                                className="w-6 h-6 lg:w-8 lg:h-8 rounded-xl object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xs lg:text-sm">
                                {selectedPersona?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="bg-card rounded-lg p-3 border border-border">
                              <BouncingDots />
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Login Prompt - Shows after message limit */}
                    {messageCount >= MAX_MESSAGES && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border-t border-border p-6 bg-card/50 backdrop-blur-md"
                      >
                        <div className="max-w-4xl mx-auto">
                          <div className="flex items-center justify-center gap-4">
                            {selectedPersona?.avatar ? (
                              <img 
                                src={selectedPersona.avatar} 
                                alt={selectedPersona.name}
                                className="w-12 h-12 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg">
                                {selectedPersona?.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 text-center sm:text-left">
                              <h3 className="text-lg font-semibold text-foreground">Want to keep chatting?</h3>
                              <p className="text-sm text-muted-foreground">Join thousands having unlimited conversations</p>
                            </div>
                            <Button 
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              size="lg"
                              onClick={handleGoogleSignIn}
                            >
                              <LogIn className="w-4 h-4 mr-2" />
                              Continue with Google
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Floating Input Area - Only show when under message limit */}
                    {messageCount < MAX_MESSAGES && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent">
                        <div className="max-w-4xl mx-auto">
                          <div className="bg-card border border-border rounded-xl shadow-lg p-3">
                            <div className="flex gap-3 items-end">
                              <div className="flex-1">
                                <Textarea
                                  value={inputMessage}
                                  onChange={(e) => setInputMessage(e.target.value)}
                                  onKeyDown={handleKeyPress}
                                  placeholder={`Message ${selectedPersona?.name}...`}
                                  className="w-full resize-none bg-transparent border-none px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[120px] leading-5"
                                  rows={1}
                                />
                              </div>
                              <Button
                                onClick={handleSendMessage}
                                disabled={!inputMessage.trim() || isLoading}
                                variant="outline"
                                className="h-[44px] px-4 flex-shrink-0"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : !showSearch ? (
                  /* Original Carousel and Button */
                  <motion.div
                    key="carousel"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.6 }}
                    className="w-full flex flex-col items-center space-y-16"
                  >
                    {/* Carousel Container */}
                    <div className="w-full">
                      <div className="relative h-24 overflow-hidden">
                        <div
                          className="flex transition-transform duration-500 ease-in-out"
                          style={{
                            transform: `translateX(${translateX}%)`
                          }}
                        >
                          {infiniteItems.map((item, index) => (
                            <div
                              key={`${item.title}-${index}`}
                              className="w-full flex-shrink-0 flex flex-col items-center justify-center space-y-2"
                            >
                              <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
                                {item.title}
                              </h2>
                              <p className="text-lg md:text-xl text-muted-foreground">
                                {item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Start Button */}
                    <Button
                      onClick={handleStartChatting}
                      variant="outline"
                      className="text-lg font-semibold px-8 py-3 h-auto bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-lg"
                      size="default"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Start Chatting
                    </Button>
                  </motion.div>
                ) : (
                  /* Search Interface */
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                    transition={{ duration: 0.6 }}
                    className="w-full flex flex-col items-center space-y-8"
                  >
                    {/* Search Question */}
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                      Who do you want to talk with?
                    </h2>

                    {/* Search Input */}
                    <div className="relative w-full max-w-2xl">
                      <Input
                        type="text"
                        placeholder="Describe who you want to chat with or your intent..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full text-foreground pr-12 h-12 text-base rounded-lg"
                        autoFocus
                      />
                      <Button
                        onClick={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8"
                        size="sm"
                      >
                        {isSearching ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Shared Results Container - Shows both loading and results */}
                    {(isSearching || searchResults.length > 0 || isCreatingPersona) && (
                      <div className="w-full max-w-4xl">
                        <AnimatePresence mode="wait">
                          {isCreatingPersona ? (
                            <motion.div
                              key="creating"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center justify-center py-16"
                            >
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">Creating Your Persona</h3>
                                <p className="text-lg text-muted-foreground">Generating avatar and setting up the chat...</p>
                              </div>
                            </motion.div>
                          ) : isSearching ? (
                            <motion.div
                              key="loading"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center justify-center py-16"
                            >
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-xl text-muted-foreground">Finding perfect personas for you...</p>
                              </div>
                            </motion.div>
                          ) : searchResults.length > 0 ? (
                            <motion.div
                              key="results"
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full"
                            >
                              <h3 className="text-2xl font-bold text-foreground mb-8 text-center">Choose Your Conversation Partner</h3>
                              <div className="grid md:grid-cols-3 gap-4">
                                {searchResults.map((persona, index) => (
                                  <motion.div
                                    key={persona.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ 
                                      delay: index * 0.1, 
                                      duration: 0.4
                                    }}
                                    onClick={() => !isCreatingPersona && handlePersonaSelect(persona)}
                                    className={`group ${isCreatingPersona ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                  >
                                    <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-lg p-4 h-full transition-all duration-300 hover:bg-card/60 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5">
                                      
                                      {/* Name */}
                                      <h4 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                                        {persona.name}
                                      </h4>
                                      
                                      {/* Description */}
                                      <p className="text-muted-foreground text-sm leading-relaxed">
                                        {persona.description}
                                      </p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Landing; 