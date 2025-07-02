import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase/config';

interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

interface LoginEventProperties extends AnalyticsEventProperties {
  method: 'google' | 'email' | 'anonymous';
  success: boolean;
  error_message?: string;
}

interface PersonaEventProperties extends AnalyticsEventProperties {
  persona_id: string;
  persona_name: string;
  persona_category: string;
  is_generated: boolean;
}

interface ChatEventProperties extends AnalyticsEventProperties {
  chat_id: string;
  persona_id?: string;
  persona_name?: string;
  persona_category?: string;
}

export const analyticsService = {
  // Track user login events
  trackLogin: (userId: string, properties: LoginEventProperties) => {
    try {
      logEvent(analytics, 'login', {
        user_id: userId,
        method: properties.method,
        success: properties.success,
        ...(properties.error_message && { error_message: properties.error_message }),
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Error tracking login event:', error);
    }
  },

  // Track when a user adds/creates a new persona
  trackPersonaAdded: (userId: string, properties: PersonaEventProperties) => {
    try {
      logEvent(analytics, 'persona_added', {
        user_id: userId,
        persona_id: properties.persona_id,
        persona_name: properties.persona_name,
        persona_category: properties.persona_category,
        is_generated: properties.is_generated,
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Error tracking persona added event:', error);
    }
  },

  // Track when a user creates a new chat session
  trackChatCreated: (userId: string, properties: ChatEventProperties) => {
    try {
      logEvent(analytics, 'chat_created', {
        user_id: userId,
        chat_id: properties.chat_id,
        ...(properties.persona_id && { persona_id: properties.persona_id }),
        ...(properties.persona_name && { persona_name: properties.persona_name }),
        ...(properties.persona_category && { persona_category: properties.persona_category }),
        timestamp: new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('Error tracking chat created event:', error);
    }
  },
};

export default analyticsService; 