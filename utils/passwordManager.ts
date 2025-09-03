import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { SavedPassword } from '@/types/settings';
import { SavedPassword } from '../types/settings';

// Conditional import for LocalAuthentication
let LocalAuthentication: any = null;

if (Platform.OS !== 'web') {
  try {
    LocalAuthentication = require('expo-local-authentication');
  } catch (error) {
    console.warn('LocalAuthentication not available:', error);
  }
}

export class PasswordManager {
  private static readonly PASSWORDS_KEY = 'saved_passwords';
  private static readonly MASTER_KEY = 'master_password_key';

  // Check if biometric authentication is available
  static async isBiometricAvailable(): Promise<boolean> {
    if (Platform.OS === 'web' || !LocalAuthentication) return false;
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch {
      return false;
    }
  }

  // Authenticate with biometrics
  static async authenticateWithBiometrics(): Promise<boolean> {
    if (Platform.OS === 'web' || !LocalAuthentication) return true;
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access passwords',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });
      return result.success;
    } catch {
      return false;
    }
  }

  // Save password securely
  static async savePassword(password: Omit<SavedPassword, 'id' | 'dateAdded' | 'lastUsed'>): Promise<void> {
    try {
      const passwords = await this.getPasswords();
      const newPassword: SavedPassword = {
        ...password,
        id: `pwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: Date.now(),
        lastUsed: Date.now(),
      };

      passwords.push(newPassword);
      await this.storePasswords(passwords);
    } catch (error) {
      console.error('Failed to save password:', error);
      throw error;
    }
  }

  // Get all saved passwords
  static async getPasswords(): Promise<SavedPassword[]> {
    try {
      if (Platform.OS === 'web') {
        const stored = localStorage.getItem(this.PASSWORDS_KEY);
        return stored ? JSON.parse(stored) : [];
      }
      
      const stored = await SecureStore.getItemAsync(this.PASSWORDS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Store passwords securely
  private static async storePasswords(passwords: SavedPassword[]): Promise<void> {
    const data = JSON.stringify(passwords);
    
    if (Platform.OS === 'web') {
      localStorage.setItem(this.PASSWORDS_KEY, data);
    } else {
      await SecureStore.setItemAsync(this.PASSWORDS_KEY, data);
    }
  }

  // Delete password
  static async deletePassword(id: string): Promise<void> {
    try {
      const passwords = await this.getPasswords();
      const filtered = passwords.filter(p => p.id !== id);
      await this.storePasswords(filtered);
    } catch (error) {
      console.error('Failed to delete password:', error);
      throw error;
    }
  }

  // Check for compromised passwords
  static async checkPasswordSecurity(passwords: SavedPassword[]): Promise<SavedPassword[]> {
    // Simulate security check - in real app, use HaveIBeenPwned API
    return passwords.map(password => ({
      ...password,
      isCompromised: password.password.length < 8 || password.password === '123456',
    }));
  }

  // Generate strong password
  static generateStrongPassword(length = 16): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }

  // Clear all passwords
  static async clearAllPasswords(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(this.PASSWORDS_KEY);
      } else {
        await SecureStore.deleteItemAsync(this.PASSWORDS_KEY);
      }
    } catch (error) {
      console.error('Failed to clear passwords:', error);
      throw error;
    }
  }
}