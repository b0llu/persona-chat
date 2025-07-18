import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

if(typeof window !== 'undefined') {
    mixpanel.init(MIXPANEL_TOKEN, {
        debug: process.env.NODE_ENV === 'development',
        persistence: 'localStorage',
    });
}

// Helper function to check if mixpanel is properly initialized
const isMixpanelReady = () => {
    return typeof window !== 'undefined' && MIXPANEL_TOKEN && mixpanel;
};

export const mixpanelService = {
    // Track when a new persona is added to Firebase
    trackPersonaAdded: (persona: { 
        id: string; 
        name: string; 
        category: string; 
    }, userId?: string) => {
        if (!isMixpanelReady()) return;
        
        try {
            mixpanel.track('Persona Added', {
                persona_id: persona.id,
                persona_name: persona.name,
                persona_category: persona.category,
                user_id: userId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error tracking persona added:', error);
        }
    },

    // Track when a new chat is created in Firebase
    trackChatCreated: (chatData: {
        chat_id: string;
        persona_name?: string;
        persona_category?: string;
        user_id: string;
    }) => {
        if (!isMixpanelReady()) return;
        
        try {
            mixpanel.track('Chat Created', {
                chat_id: chatData.chat_id,
                persona_name: chatData.persona_name,
                persona_category: chatData.persona_category,
                user_id: chatData.user_id,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error tracking chat created:', error);
        }
    },

    // Track when a user logs in
    trackUserLogin: (userData: {
        user_id: string;
        email?: string;
        display_name?: string;
        is_new_user?: boolean;
    }) => {
        if (!isMixpanelReady()) {
            console.log('Mixpanel not ready, skipping tracking');
            return;
        }
        
        try {
            // Identify the user for Mixpanel
            mixpanel.identify(userData.user_id);
            
            // Set user properties
            mixpanel.people.set({
                $email: userData.email,
                $name: userData.display_name,
                last_login: new Date().toISOString()
            });
            
            // Track the login event
            mixpanel.track('User Login', {
                user_id: userData.user_id,
                email: userData.email,
                display_name: userData.display_name,
                is_new_user: userData.is_new_user || false,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error tracking user login:', error);
        }
    },

    // Track when a temporary chat is first used (first message sent)
    trackTempChatUsed: () => {
        if (!isMixpanelReady()) return;
        
        try {
            mixpanel.track('Temporary Chat Created');
        } catch (error) {
            console.error('Error tracking temporary chat used:', error);
        }
    },
};

export default mixpanelService;

