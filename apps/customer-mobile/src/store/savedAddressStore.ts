import AsyncStorage from '@react-native-async-storage/async-storage';

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
  isDefault: boolean;
}

const STORAGE_KEY = 'NEXUS_SAVED_ADDRESSES_V1';

export const savedAddressStore = {
  getAddresses: async (): Promise<SavedAddress[]> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filter out old initial mock address 'addr_default_1'
        const cleanList = (parsed as SavedAddress[]).filter((item) => item.id !== 'addr_default_1');
        if (cleanList.length !== parsed.length) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleanList));
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
    const foundDefault = list.find((a) => a.isDefault);
    return foundDefault || list[0] || null;
  },

  saveAddress: async (address: Omit<SavedAddress, 'id'> & { id?: string }): Promise<SavedAddress[]> => {
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

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  },

  setDefaultAddress: async (id: string): Promise<SavedAddress[]> => {
    const list = await savedAddressStore.getAddresses();
    const updatedList = list.map((item) => ({
      ...item,
      isDefault: item.id === id,
    }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    return updatedList;
  },

  deleteAddress: async (id: string): Promise<SavedAddress[]> => {
    const list = await savedAddressStore.getAddresses();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  },
};
