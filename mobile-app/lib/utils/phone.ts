/**
 * Phone number utility functions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PHONE_KEY = 'user_phone';

/**
 * Store phone number in AsyncStorage
 */
export async function storePhoneNumber(phone: string): Promise<void> {
  try {
    await AsyncStorage.setItem(PHONE_KEY, phone);
  } catch (error) {
    console.error('Failed to store phone number:', error);
  }
}

/**
 * Get stored phone number from AsyncStorage
 */
export async function getStoredPhoneNumber(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(PHONE_KEY);
  } catch (error) {
    console.error('Failed to get stored phone number:', error);
    return null;
  }
}

/**
 * Clear stored phone number
 */
export async function clearStoredPhoneNumber(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PHONE_KEY);
  } catch (error) {
    console.error('Failed to clear phone number:', error);
  }
}

/**
 * Mask phone number for display (e.g., "9876543210" -> "******3210")
 */
export function maskPhoneNumber(phone: string): string {
  if (phone.length < 4) {
    return phone;
  }
  const last4 = phone.slice(-4);
  const masked = '*'.repeat(Math.max(0, phone.length - 4));
  return `${masked}${last4}`;
}

