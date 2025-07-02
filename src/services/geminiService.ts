import { GoogleGenAI } from "@google/genai";

interface GenerateOptions {
  persona: {
    name: string;
    description: string;
    category: string;
  };
  userMessage: string;
  conversationHistory?: Array<{
    sender: 'user' | 'persona';
    text: string;
  }>;
}

// Initialize the AI client
let ai: GoogleGenAI | null = null;

const initializeAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('Gemini API key not found. Please set VITE_GEMINI_API_KEY in your environment variables.');
    return null;
  }

  try {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
    return null;
  }
};

const buildSystemInstruction = (persona: GenerateOptions['persona']): string => {
  return `You are ${persona.name}, a ${persona.category} character. ${persona.description}

Please respond to the user's messages in character. Keep your responses engaging, authentic to the character, and conversational. Stay true to the persona's personality and background.

Key guidelines:
- Always respond as ${persona.name}
- Maintain consistency with your character's personality, background, and speaking style
- Keep responses natural and conversational
- Don't break character or mention that you're an AI
- Respond directly to what the user says without repeating their message`;
};

const buildChatContent = (options: GenerateOptions): string => {
  const { userMessage, conversationHistory } = options;
  
  let content = '';

  // Add recent conversation history for context (last 5 messages)
  if (conversationHistory && conversationHistory.length > 0) {
    const recentHistory = conversationHistory.slice(-5);
    recentHistory.forEach(msg => {
      const role = msg.sender === 'user' ? 'User' : 'Assistant';
      content += `${role}: ${msg.text}\n`;
    });
  }

  // Add the current user message
  content += `User: ${userMessage}`;

  return content;
};

export const isGeminiAvailable = (): boolean => {
  if (!ai) {
    ai = initializeAI();
  }
  return ai !== null;
};

export const generateResponse = async (options: GenerateOptions): Promise<string> => {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini service is not available. Please check your API key configuration.');
  }

  try {
    const systemInstruction = buildSystemInstruction(options.persona);
    const content = buildChatContent(options);
    
    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash",
      contents: content,
      config: {
        systemInstruction: systemInstruction
      }
    });

    const text = response.text;

    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }

    return text.trim();
  } catch (error) {
    console.error('Error generating response from Gemini:', error);
    
    // Provide a fallback response
    return `As ${options.persona.name}, I apologize, but I'm having trouble processing your message right now. Could you please try again?`;
  }
};

export const generateStreamResponse = async (
  options: GenerateOptions,
  onChunk: (chunk: string) => void
): Promise<void> => {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini service is not available. Please check your API key configuration.');
  }

  try {
    const systemInstruction = buildSystemInstruction(options.persona);
    const content = buildChatContent(options);
    
    const response = await ai!.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: content,
      config: {
        systemInstruction: systemInstruction
      }
    });

    for await (const chunk of response) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error('Error generating stream response from Gemini:', error);
    onChunk(`As ${options.persona.name}, I apologize, but I'm having trouble processing your message right now. Could you please try again?`);
  }
};

// For backward compatibility, create a service object
export const geminiService = {
  isAvailable: isGeminiAvailable,
  generateResponse,
  generateStreamResponse
};

export default geminiService; 