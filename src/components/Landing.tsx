import { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { MessageCircle, Sparkles, Users, Zap, LogIn } from 'lucide-react';

const Landing = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Navigation will be handled by the App component via the AuthGuard
    } catch (error) {
      console.error('Error signing in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: MessageCircle,
      title: "Chat with Anyone",
      description: "From historical figures to anime characters, talk to your favorite personas"
    },
    {
      icon: Sparkles,
      title: "AI-Powered",
      description: "Advanced AI brings each persona to life with authentic personalities"
    },
    {
      icon: Users,
      title: "Endless Variety",
      description: "Thousands of personas from movies, books, history, and more"
    },
    {
      icon: Zap,
      title: "Instant Responses",
      description: "Real-time conversations that feel natural and engaging"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

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
            className="max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-foreground mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Persona<span className="text-primary">Chat</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Chat with anyone, from anywhere, at any time. Historical figures, anime characters, 
              fictional heroes - all brought to life through AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="space-y-4"
            >
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                variant="outline"
                className="text-xl font-bold px-16 py-4 h-auto bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="lg"
              >
                                 {isLoading ? (
                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                 ) : (
                   <>
                     <LogIn className="w-6 h-6 mr-3" />
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
        </section>

        {/* Features Section */}
        <section className="py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Why Choose PersonaChat?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Experience conversations like never before with our cutting-edge AI technology
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -10 }}
                  className="bg-card rounded-2xl p-6 border border-border text-center"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-4">
              Join thousands of users already chatting with their favorite personas
            </p>
            
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="outline"
              className="text-xl font-bold px-16 py-4 h-auto bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mt-2"
              size="lg"
            >
                             {isLoading ? (
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
               ) : (
                 <>
                   <LogIn className="w-6 h-6 mr-3" />
                   Sign in with Google
                 </>
               )}
            </Button>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Landing; 