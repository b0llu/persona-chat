import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Check, Mail } from 'lucide-react';
import { mixpanelService } from '../services/mixpanelService';

interface WishlistProps {
  persona?: {
    name: string;
    avatar?: string;
  };
  onWishlistComplete?: () => void;
}

const Wishlist = ({ persona, onWishlistComplete }: WishlistProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Check localStorage on component mount
  useEffect(() => {
    const hasWishlistedStored = localStorage.getItem('persona-chat-wishlisted');
    if (hasWishlistedStored === 'true') {
      setIsSubmitted(true);
      onWishlistComplete?.();
    }
  }, [onWishlistComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Track wishlist signup
      mixpanelService.trackWishlistSignup({
        email: email.trim(),
        persona_name: persona?.name,
        timestamp: new Date().toISOString()
      });

      // Simulate API call (you can replace this with actual backend call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store in localStorage
      localStorage.setItem('persona-chat-wishlisted', 'true');
      localStorage.setItem('persona-chat-wishlist-email', email.trim());
      
      setIsSubmitted(true);
      onWishlistComplete?.();
    } catch (error) {
      console.error('Error submitting wishlist:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="border border-green-200/50 bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-md rounded-xl p-6"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4">
            <motion.div 
              className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
            >
              <Check className="w-6 h-6" />
            </motion.div>
            <div className="flex-1 text-center sm:text-left">
              <motion.h3 
                className="text-xl font-semibold text-green-800 mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                You're on the wishlist! 🎉
              </motion.h3>
              <motion.p 
                className="text-green-700"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                We'll notify you the moment PersonaChat launches. Thanks for joining us!
              </motion.p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border/50 bg-gradient-to-r from-card/60 to-card/40 backdrop-blur-md rounded-xl p-6 shadow-lg"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Want to continue chatting?
          </h3>
          <p className="text-muted-foreground text-lg">
            Join our wishlist to be the first to know when PersonaChat launches!
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 text-foreground bg-background/80 border-border/50 focus:border-primary/50 rounded-lg px-4"
                disabled={isSubmitting}
              />
              {error && (
                <motion.p 
                  className="text-red-500 text-sm mt-2 text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.p>
              )}
            </div>
            
            <Button 
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 font-semibold text-base rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              disabled={isSubmitting || !email.trim()}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                  <span>Joining...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <span>Join the Wishlist</span>
                </div>
              )}
            </Button>
          </div>
        </form>
        
        <p className="text-center text-sm text-muted-foreground/70 mt-4">
          No spam, just updates. Unsubscribe anytime.
        </p>
      </div>
    </motion.div>
  );
};

export default Wishlist; 