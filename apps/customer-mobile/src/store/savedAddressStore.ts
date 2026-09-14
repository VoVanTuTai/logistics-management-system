import AsyncStorage from '@react-native-async-storage/async-storage';
import { authStore } from './authStore';

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  province: string;
  district?: string;
  ward: string;
  addressDetail: string;
  composedAddress: string;
  hubCode?: string;
  hubName?: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

const STORAGE_PREFIX = 'NEXUS_SAVED_ADDRESSES_V2';

function resolveStorageKey(): string {
  const user = authStore.getUser();
  if (user?.id || user?.username) {
    return `${STORAGE_PREFIX}_${user.id || user.username}`;
  }
  return `${STORAGE_PREFIX}_GUEST`;
}

export const savedAddressStore = {
  getAddresses: async (): Promise<SavedAddress[]> => {
    try {
      const key = resolveStorageKey();
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out any invalid or old mock entries
        const cleanList = (parsed as SavedAddress[]).filter(
          (item) => item.id && item.id !== 'addr_default_1',
        );
        if (cleanList.length !== parsed.length) {
          await AsyncStorage.setItem(key, JSON.stringify(cleanList));
        }
        return cleanList;
      }
      return [];
    } catch {
      return [];
    }
  },

  getDefaultAddress: async (): Promise<SavedAddress | null> => {
    const list = await savedAddressStore.getAddresses();
    if (list.length === 0) return null;
    const foundDefault = list.find((a) => a.isDefault);
    return foundDefault || list[0] || null;
  },

  saveAddress: async (address: Omit<SavedAddress, 'id'> & { id?: string }): Promise<SavedAddress[]> => {
    const key = resolveStorageKey();
    const list = await savedAddressStore.getAddresses();
    const id = address.id || `addr_${Date.now()}`;
    const newAddress: SavedAddress = { ...address, id };

    let updatedList: SavedAddress[];
    if (address.isDefault) {
      // Unset previous defaults
      updatedList = list.map((item) => ({ ...item, isDefault: false }));
    } else {
      updatedList = [...list];
    }

    const existingIndex = updatedList.findIndex((item) => item.id === id);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = newAddress;
    } else {
      // If this is the first address, force default
      if (updatedList.length === 0) {
        newAddress.isDefault = true;
      }
      updatedList.unshift(newAddress);
    }

    await AsyncStorage.setItem(key, JSON.stringify(updatedList));
    return updatedList;
  },

  setDefaultAddress: async (id: string): Promise<SavedAddress[]> => {
    const key = resolveStorageKey();
    const list = await savedAddressStore.getAddresses();
    const updatedList = list.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    await AsyncStorage.setItem(key, JSON.stringify(updatedList));
    return updatedList;
  },

  deleteAddress: async (id: string): Promise<SavedAddress[]> => {
    const key = resolveStorageKey();
    const list = await savedAddressStore.getAddresses();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }
    await AsyncStorage.setItem(key, JSON.stringify(filtered));
    return filtered;
  },

  clearAddresses: async (): Promise<void> => {
    const key = resolveStorageKey();
    await AsyncStorage.removeItem(key);
  },
};
