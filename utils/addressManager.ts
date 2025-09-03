import { SavedAddress } from '../types/settings';
import { StorageManager } from './storage';

export class AddressManager {
  private static readonly ADDRESSES_KEY = 'saved_addresses';

  // Save address
  static async saveAddress(address: Omit<SavedAddress, 'id' | 'dateAdded'>): Promise<void> {
    try {
      const addresses = await this.getAddresses();
      
      // If this is set as default, remove default from others
      if (address.isDefault) {
        addresses.forEach(a => a.isDefault = false);
      }

      const newAddress: SavedAddress = {
        ...address,
        id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: Date.now(),
      };

      addresses.push(newAddress);
      await StorageManager.setItem(this.ADDRESSES_KEY, addresses);
    } catch (error) {
      console.error('Failed to save address:', error);
      throw error;
    }
  }

  // Get all saved addresses
  static async getAddresses(): Promise<SavedAddress[]> {
    return StorageManager.getItem<SavedAddress[]>(this.ADDRESSES_KEY, []);
  }

  // Delete address
  static async deleteAddress(id: string): Promise<void> {
    try {
      const addresses = await this.getAddresses();
      const filtered = addresses.filter(a => a.id !== id);
      await StorageManager.setItem(this.ADDRESSES_KEY, filtered);
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    }
  }

  // Update address
  static async updateAddress(id: string, updates: Partial<SavedAddress>): Promise<void> {
    try {
      const addresses = await this.getAddresses();
      const index = addresses.findIndex(a => a.id === id);
      
      if (index >= 0) {
        // If setting as default, remove default from others
        if (updates.isDefault) {
          addresses.forEach(a => a.isDefault = false);
        }
        
        addresses[index] = { ...addresses[index], ...updates };
        await StorageManager.setItem(this.ADDRESSES_KEY, addresses);
      }
    } catch (error) {
      console.error('Failed to update address:', error);
      throw error;
    }
  }

  // Validate address fields
  static validateAddress(address: Partial<SavedAddress>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!address.name?.trim()) errors.push('Name is required');
    if (!address.street?.trim()) errors.push('Street address is required');
    if (!address.city?.trim()) errors.push('City is required');
    if (!address.state?.trim()) errors.push('State is required');
    if (!address.zipCode?.trim()) errors.push('ZIP code is required');
    if (!address.country?.trim()) errors.push('Country is required');
    
    // Validate email if provided
    if (address.email && !this.isValidEmail(address.email)) {
      errors.push('Invalid email address');
    }
    
    // Validate phone if provided
    if (address.phone && !this.isValidPhone(address.phone)) {
      errors.push('Invalid phone number');
    }
    
    return { isValid: errors.length === 0, errors };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  // Clear all addresses
  static async clearAllAddresses(): Promise<void> {
    await StorageManager.setItem(this.ADDRESSES_KEY, []);
  }

  // Export addresses as vCard
  static exportAsVCard(addresses: SavedAddress[]): string {
    let vcard = '';
    
    addresses.forEach(address => {
      vcard += 'BEGIN:VCARD\n';
      vcard += 'VERSION:3.0\n';
      vcard += `FN:${address.name}\n`;
      vcard += `ADR:;;${address.street};${address.city};${address.state};${address.zipCode};${address.country}\n`;
      if (address.phone) vcard += `TEL:${address.phone}\n`;
      if (address.email) vcard += `EMAIL:${address.email}\n`;
      vcard += 'END:VCARD\n\n';
    });
    
    return vcard;
  }
}