import { useState, useEffect } from 'react';
import { wishlistService, WishlistEntry, WishlistSubmission } from '../services/wishlistService';

export const useWishlist = () => {
  const [entries, setEntries] = useState<WishlistEntry[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntries = async () => {
    setLoading(true);
    setError(null);
    try {
      const wishlistEntries = await wishlistService.getAllWishlistEntries();
      setEntries(wishlistEntries);
    } catch (err) {
      console.error('Error fetching wishlist entries:', err);
      setError('Failed to load wishlist entries');
    } finally {
      setLoading(false);
    }
  };

  const fetchCount = async () => {
    try {
      const wishlistCount = await wishlistService.getWishlistCount();
      setCount(wishlistCount);
    } catch (err) {
      console.error('Error fetching wishlist count:', err);
    }
  };

  const addToWishlist = async (data: WishlistSubmission) => {
    setLoading(true);
    setError(null);
    try {
      const id = await wishlistService.addToWishlist(data);
      await fetchEntries(); // Refresh the list
      await fetchCount(); // Refresh the count
      return id;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      setError(err instanceof Error ? err.message : 'Failed to add to wishlist');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      return await wishlistService.checkEmailExists(email);
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchCount();
  }, []);

  return {
    entries,
    count,
    loading,
    error,
    fetchEntries,
    fetchCount,
    addToWishlist,
    checkEmailExists,
    refresh: () => {
      fetchEntries();
      fetchCount();
    }
  };
}; 