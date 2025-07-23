import { collection, addDoc, query, where, getDocs, serverTimestamp, Timestamp, FieldValue } from 'firebase/firestore';
import { db } from '../firebase/config';

export interface WishlistEntry {
  email: string;
  personaName?: string;
  timestamp: Timestamp | FieldValue;
  ipAddress?: string;
  userAgent?: string;
}

export interface WishlistSubmission {
  email: string;
  personaName?: string;
}

class WishlistService {
  private collectionName = 'wishlist';

  /**
   * Add an email to the wishlist
   */
  async addToWishlist(data: WishlistSubmission): Promise<string> {
    try {
      // Check if email already exists
      const existingEntry = await this.checkEmailExists(data.email);
      if (existingEntry) {
        throw new Error('Email already exists in wishlist');
      }

      const wishlistEntry: WishlistEntry = {
        email: data.email.trim().toLowerCase(),
        personaName: data.personaName,
        timestamp: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collectionName), wishlistEntry);
      console.log('Wishlist entry added with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      throw error;
    }
  }

  /**
   * Check if an email already exists in the wishlist
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('email', '==', email.trim().toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email existence:', error);
      throw error;
    }
  }

  /**
   * Get all wishlist entries (admin function)
   */
  async getAllWishlistEntries(): Promise<WishlistEntry[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      const entries: WishlistEntry[] = [];
      
      querySnapshot.forEach((doc) => {
        entries.push({ ...doc.data() as WishlistEntry });
      });
      
      return entries.sort((a, b) => {
        // Sort by timestamp descending (newest first)
        if (a.timestamp && b.timestamp && 
            a.timestamp instanceof Timestamp && b.timestamp instanceof Timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds;
        }
        return 0;
      });
    } catch (error) {
      console.error('Error getting wishlist entries:', error);
      throw error;
    }
  }

  /**
   * Get wishlist count
   */
  async getWishlistCount(): Promise<number> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.size;
    } catch (error) {
      console.error('Error getting wishlist count:', error);
      throw error;
    }
  }
}

export const wishlistService = new WishlistService(); 