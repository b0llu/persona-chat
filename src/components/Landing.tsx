import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { MessageCircle, Sparkles, Users, Zap, LogIn } from 'lucide-react';

const Landing = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Navigation will be handled by the App component via the AuthGuard
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKnowMore = async () => {
    // First animate title to top, then show features
    setShowFeatures(true);
  };

  const features = [
    {
      icon: MessageCircle,
      title: "Learn & Understand",
      description: "Explore new ideas uniquely."
    },
    {
      icon: Users,
      title: "Create Personal Connections",
      description: "Relive conversations with cherished memories."
    },
    {
      icon: Zap,
      title: "Financial Guidance",
      description: "Get smart financial insights."
    },
    {
      icon: Sparkles,
      title: "Expert Consultation",
      description: "Receive tailored guidance."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-64 h-64 rounded-full bg-primary/5"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: 0 
            }}
            animate={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
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
            className="max-w-4xl mx-auto w-full"
          >
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-foreground mb-4"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Persona<span className="text-primary">Chat</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col justify-center space-y-8"
            >
              {/* Flip Container */}
              <motion.div 
                className="perspective-1000 flex items-center justify-center"
                initial={{ height: "auto" }}
                animate={{ 
                  height: showFeatures ? "360px" : "auto" 
                }}
                transition={{ 
                  duration: 0.6, 
                  ease: "easeInOut" 
                }}
              >
                <AnimatePresence mode="wait">
                  {!showFeatures ? (
                    /* Know More Button - Front Side */
                    <motion.div
                      key="know-more"
                      initial={{ opacity: 0, rotateY: 0 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      exit={{ opacity: 0, rotateY: 180 }}
                      transition={{ duration: 0.6 }}
                      className="space-y-4"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <Button
                        onClick={handleKnowMore}
                        variant="outline"
                        className="text-lg font-semibold px-12 py-3 h-auto bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 rounded-full"
                        size="default"
                      >
                        Know More
                      </Button>
                      
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          Discover what makes PersonaChat special
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    /* Features and Sign In - Back Side */
                    <motion.div
                      key="features-signin"
                      initial={{ opacity: 0, rotateY: -180 }}
                      animate={{ opacity: 1, rotateY: 0 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-8 w-full"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      {/* Features Grid */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
                      >
                        {features.map((feature, index) => (
                          <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}

                            className="bg-card rounded-2xl p-6 border border-border text-center"
                          >
                            <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                              <feature.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground text-sm">{feature.description}</p>
                          </motion.div>
                        ))}
                      </motion.div>

                      {/* Sign In Button */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                        className="space-y-4"
                      >
                        <Button
                          onClick={handleGoogleSignIn}
                          disabled={isLoading}
                          variant="outline"
                          className="text-lg font-semibold px-8 py-3 h-auto bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                          size="default"
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                          ) : (
                            <>
                              <LogIn className="w-5 h-5 mr-2" />
                              Sign in with Google
                            </>
                          )}
                        </Button>
                        
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Free to start • No credit card required
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Landing; 