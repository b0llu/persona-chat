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
}

export interface ChatSession {
  id: string;
  title: string;
  persona: Persona | null;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  temporary?: boolean; // Indicates if this is a temporary chat
}

export interface FirebaseChatMetadata {
  id: string;
  title: string;
  persona: Persona | null;
  userId: string;
  messageCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface FirebaseChatData {
  id: string;
  messages: {
    id: string;
    text: string;
    sender: 'user' | 'persona';
    timestamp: number;
  }[];
  userId: string;
  createdAt: number;
  updatedAt: number;
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