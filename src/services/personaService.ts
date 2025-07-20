import { 
  collection, 
  doc,
  getDocs, 
  setDoc, 
  query, 
  orderBy,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Persona } from '../types';

const PERSONAS_COLLECTION = 'personas';

export const personaService = {
  // Load all personas from Firebase
  async loadPersonas(): Promise<Persona[]> {
    try {
      const personasRef = collection(db, PERSONAS_COLLECTION);
      const q = query(personasRef, orderBy('name'));
      const querySnapshot = await getDocs(q);
      
      const personas: Persona[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        personas.push({
          id: doc.id,
          name: data.name,
          description: data.description,
          avatar: data.avatar || '',
          category: data.category
        });
      });
      
      return personas;
    } catch (error) {
      console.error('Error loading personas from Firebase:', error);
      return [];
    }
  },

  // Save a new persona to Firebase
  async savePersona(persona: Persona, userId?: string): Promise<boolean> {
    try {
      const personaRef = doc(db, PERSONAS_COLLECTION, persona.id);
      await setDoc(personaRef, {
        name: persona.name,
        description: persona.description,
        avatar: persona.avatar,
        category: persona.category,
        createdBy: userId || 'unknown',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error saving persona to Firebase:', error);
      return false;
    }
  },

  // Update persona ownership when user logs in
  async updatePersonaOwnership(personaId: string, userId: string): Promise<boolean> {
    try {
      const personaRef = doc(db, PERSONAS_COLLECTION, personaId);
      await updateDoc(personaRef, {
        createdBy: userId,
        updatedAt: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Error updating persona ownership:', error);
      return false;
    }
  },
}; 