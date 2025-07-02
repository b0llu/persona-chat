export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'persona';
  timestamp: Date;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  avatar: string;
  category: 'celebrity' | 'anime' | 'cartoon' | 'historical' | 'fictional' | 'custom';
  isGenerated?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  persona: Persona | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export interface AIGeneratedPersona {
  name: string;
  description: string;
  category: string;
} 