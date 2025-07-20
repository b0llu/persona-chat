import { GoogleGenAI } from "@google/genai";
import type { Persona } from '../types';
import { generatePersonasPrompt, intelligentPersonaSearchPrompt } from './prompts';

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

interface AIGeneratedPersona {
  name: string;
  description: string;
  category: string;
}

interface PersonaWithAvatar {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar: string;
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

Please respond to the user's messages in character. Keep your responses engaging, authentic to the character, and conversational. Stay true to the persona's personality and background while being knowledgeable about both your world and the real world.

Key guidelines:
- Always respond as ${persona.name} with your unique personality, mannerisms, and speaking style
- You have knowledge of both your fictional/character world AND the real world (current events, people, technology, etc.)
- Feel free to discuss real-world topics, current events, and people while maintaining your character's perspective and personality
- Don't let knowledge limitations of your original character restrict meaningful conversations
- Keep responses natural and conversational
- Don't break character or mention that you're an AI
- Respond directly to what the user says without repeating their message
- When discussing real-world topics, filter them through your character's unique viewpoint and personality`;
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
      model: "gemini-2.5-flash-lite-preview-06-17",
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
      model: "gemini-2.5-flash-lite-preview-06-17",
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

export const generatePersonas = async (searchTerm: string): Promise<AIGeneratedPersona[]> => {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini service is not available. Please check your API key configuration.');
  }

  try {
    const prompt = generatePersonasPrompt(searchTerm);

    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: prompt,
    });

    const text = response.text;
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }

    // Clean up the response to ensure it's valid JSON
    let cleanedText = text.trim();
    
    // Remove any markdown code block formatting
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const personas: AIGeneratedPersona[] = JSON.parse(cleanedText);
    
    // Validate the response structure
    if (!Array.isArray(personas)) {
      throw new Error('Invalid response format: expected array');
    }

    // Filter and validate personas
    const validPersonas = personas
      .filter(persona => 
        persona && 
        typeof persona.name === 'string' && 
        typeof persona.description === 'string' && 
        typeof persona.category === 'string' &&
        persona.name.trim() !== '' &&
        persona.description.trim() !== ''
      )
      .slice(0, 10); // Ensure max 10 personas

    return validPersonas;
  } catch (error) {
    console.error('Error generating personas from Gemini:', error);
    throw new Error('Failed to generate personas. Please try a different search term.');
  }
};

export const intelligentPersonaSearch = async (
  searchQuery: string,
  existingPersonas: Persona[]
): Promise<PersonaWithAvatar[]> => {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini service is not available. Please check your API key configuration.');
  }

  try {
    // Create a prompt that includes information about existing personas
    const existingPersonasList = existingPersonas.map(p => `- ${p.name}: ${p.description} (${p.category})`).join('\n');
    
    const prompt = intelligentPersonaSearchPrompt(searchQuery, existingPersonasList);

    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash-lite-preview-06-17",
      contents: prompt,
    });

    const text = response.text;
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response from Gemini API');
    }

    // Clean up the response to ensure it's valid JSON
    let cleanedText = text.trim();
    
    // Remove any markdown code block formatting
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const aiResponse = JSON.parse(cleanedText);
    const result: PersonaWithAvatar[] = [];

    // Add existing personas that AI recommended
    if (aiResponse.useExisting && Array.isArray(aiResponse.useExisting)) {
      for (const personaName of aiResponse.useExisting) {
        const existingPersona = existingPersonas.find(p => 
          p.name.toLowerCase() === personaName.toLowerCase()
        );
        if (existingPersona && result.length < 3) {
          result.push({
            id: existingPersona.id,
            name: existingPersona.name,
            description: existingPersona.description,
            category: existingPersona.category,
            avatar: existingPersona.avatar
          });
        }
      }
    }

    // Generate new personas if needed
    if (aiResponse.generateNew && Array.isArray(aiResponse.generateNew)) {
      for (const newPersona of aiResponse.generateNew) {
        if (result.length >= 3) break;
        
        try {
          if (newPersona.name && newPersona.description && newPersona.category) {
            result.push({
              id: `ai-${Date.now()}-${newPersona.name.toLowerCase().replace(/\s+/g, '-')}`,
              name: newPersona.name,
              description: newPersona.description,
              category: newPersona.category,
              avatar: ''
            });
          }
        } catch (personaError) {
          console.warn('Failed to process new persona', newPersona.name, personaError);
        }
      }
    }

    // Ensure we have exactly 3 personas
    return result.slice(0, 3);

  } catch (error) {
    console.error('Error in intelligent persona search:', error);
    throw new Error('Failed to search personas. Please try again.');
  }
};

// For backward compatibility, create a service object
export const geminiService = {
  isAvailable: isGeminiAvailable,
  generateResponse,
  generateStreamResponse,
  generatePersonas,
  intelligentPersonaSearch
};

export default geminiService; 