import { 
  collection, 
  setDoc,
  deleteDoc, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  ChatSession, 
  FirebaseChatMetadata, 
  FirebaseChatData
} from '../types';

const CHAT_METADATA_COLLECTION = 'chatMetadata';
const CHAT_DATA_COLLECTION = 'chatData';

// Generate a unique chat ID
export const generateChatId = (): string => {
  return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Convert Date to Firebase timestamp
const dateToTimestamp = (date: Date): number => {
  return date.getTime();
};

// Convert Firebase timestamp to Date
const timestampToDate = (timestamp: number): Date => {
  return new Date(timestamp);
};

// Convert ChatSession to Firebase-compatible format
const chatSessionToFirebase = (chat: ChatSession): { metadata: FirebaseChatMetadata, data: FirebaseChatData } => {
  const metadata: FirebaseChatMetadata = {
    id: chat.id,
    title: chat.title,
    persona: chat.persona,
    userId: chat.userId,
    messageCount: chat.messages.length,
    createdAt: dateToTimestamp(chat.createdAt),
    updatedAt: dateToTimestamp(chat.updatedAt)
  };

  const data: FirebaseChatData = {
    id: chat.id,
    messages: chat.messages.map(msg => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      timestamp: dateToTimestamp(msg.timestamp)
    })),
    userId: chat.userId,
    createdAt: dateToTimestamp(chat.createdAt),
    updatedAt: dateToTimestamp(chat.updatedAt)
  };

  return { metadata, data };
};

// Convert Firebase data back to ChatSession
const firebaseToChat = (metadata: FirebaseChatMetadata, data: FirebaseChatData): ChatSession => {
  return {
    id: metadata.id,
    title: metadata.title,
    persona: metadata.persona,
    userId: metadata.userId,
    messages: data.messages.map(msg => ({
      id: msg.id,
      text: msg.text,
      sender: msg.sender,
      timestamp: timestampToDate(msg.timestamp)
    })),
    createdAt: timestampToDate(metadata.createdAt),
    updatedAt: timestampToDate(metadata.updatedAt)
  };
};

// Create a new chat in Firebase
export const createChat = async (chat: ChatSession): Promise<void> => {
  const { metadata, data } = chatSessionToFirebase(chat);

  try {
    // Use the chat ID as the document ID to avoid duplicates
    await setDoc(doc(db, CHAT_METADATA_COLLECTION, chat.id), metadata);
    await setDoc(doc(db, CHAT_DATA_COLLECTION, chat.id), data);
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Update an existing chat (or create if it doesn't exist)
export const updateChat = async (chat: ChatSession): Promise<void> => {
  const { metadata, data } = chatSessionToFirebase(chat);

  try {
    // Use setDoc with the chat ID as document ID - this will create or update
    await setDoc(doc(db, CHAT_METADATA_COLLECTION, chat.id), metadata);
    await setDoc(doc(db, CHAT_DATA_COLLECTION, chat.id), data);
  } catch (error) {
    console.error('Error updating chat:', error);
    throw error;
  }
};

// Delete a chat
export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    // Delete documents directly using chat ID as document ID
    await deleteDoc(doc(db, CHAT_METADATA_COLLECTION, chatId));
    await deleteDoc(doc(db, CHAT_DATA_COLLECTION, chatId));
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

// Get chat list (metadata only) for a user
export const getChatList = async (userId: string): Promise<FirebaseChatMetadata[]> => {
  try {
    const q = query(
      collection(db, CHAT_METADATA_COLLECTION),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    const chats = snapshot.docs.map(doc => doc.data() as FirebaseChatMetadata);
    
    // Sort by updatedAt on client side to avoid index requirement
    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Error getting chat list:', error);
    throw error;
  }
};

// Get full chat data by ID
export const getChatById = async (chatId: string, userId: string): Promise<ChatSession | null> => {
  try {
    // Get metadata and data directly using chat ID as document ID
    const metadataDoc = await getDoc(doc(db, CHAT_METADATA_COLLECTION, chatId));
    const dataDoc = await getDoc(doc(db, CHAT_DATA_COLLECTION, chatId));
    
    if (!metadataDoc.exists() || !dataDoc.exists()) {
      return null;
    }

    const metadata = metadataDoc.data() as FirebaseChatMetadata;
    const data = dataDoc.data() as FirebaseChatData;

    // Verify the chat belongs to the user
    if (metadata.userId !== userId) {
      return null;
    }

    return firebaseToChat(metadata, data);
  } catch (error) {
    console.error('Error getting chat by ID:', error);
    throw error;
  }
};

// Listen to chat list changes for real-time updates
export const subscribeToChats = (userId: string, callback: (chats: FirebaseChatMetadata[]) => void) => {
  const q = query(
    collection(db, CHAT_METADATA_COLLECTION),
    where('userId', '==', userId)
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => doc.data() as FirebaseChatMetadata);
    
    // Sort by updatedAt on client side to avoid index requirement
    const sortedChats = chats.sort((a, b) => b.updatedAt - a.updatedAt);
    callback(sortedChats);
  });
};

// Check if a chat exists in Firebase
export const chatExistsInFirebase = async (chatId: string, userId: string): Promise<boolean> => {
  try {
    const metadataDoc = await getDoc(doc(db, CHAT_METADATA_COLLECTION, chatId));
    if (!metadataDoc.exists()) {
      return false;
    }
    
    // Verify the chat belongs to the user
    const metadata = metadataDoc.data() as FirebaseChatMetadata;
    return metadata.userId === userId;
  } catch (error) {
    console.error('Error checking if chat exists:', error);
    return false;
  }
}; 