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

interface AIGeneratedPersona {
  name: string;
  description: string;
  category: string;
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

export const generatePersonas = async (searchTerm: string): Promise<AIGeneratedPersona[]> => {
  if (!isGeminiAvailable()) {
    throw new Error('Gemini service is not available. Please check your API key configuration.');
  }

  try {
    const prompt = `Generate up to 5 personas related to or exactly named "${searchTerm}". The personas could be real world people, fictional characters, or historical figures. For each persona, provide:
- name: The full name of the persona
- description: A brief, engaging description (1 sentences)
- category: Add a category that best describes the persona, use the following categories: [
    "Historical Figure",
    "Contemporary Figure",
    "Celebrity",
    "Fictional Character",
    "Mythological Figure",
    "Literary Figure",
    "Politician/World Leader",
    "Scientist/Inventor",
    "Artist/Creator",
    "Business/Entrepreneur",
    "Generic Persona/Occupation",
    "AI/Virtual Persona",
    "Pop Culture/Meme",
    "Finance Expert",
    "Investor/Trader",
    "Anime Character",
    "Manga Character",
    "Video Game Character",
    "Comic Book Character",
    "Cartoon Character",
    "Media Personality",
    "Sports Personality",
    "Influencer",
    "Philosopher",
    "Educator/Teacher",
    "Medical Professional",
    "Legal Professional",
    "Tech Innovator",
    "Fictional Creature",
    "Superhero/Villain"
  ]


Format your response as a JSON array of objects with these exact properties. Make sure the personas are diverse and interesting. Focus on well-known characters or people that would be engaging to chat with.

Example format:
[
  {
    "name": "Example Name",
    "description": "Brief description of the persona",
    "category": "celebrity"
  }
]

Only return the JSON array, no additional text.`;

    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash",
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

// For backward compatibility, create a service object
export const geminiService = {
  isAvailable: isGeminiAvailable,
  generateResponse,
  generateStreamResponse,
  generatePersonas
};

export default geminiService; 