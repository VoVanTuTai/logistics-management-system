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

const INITIAL_DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr_default_1',
    name: 'Trần Tấn Tài',
    phone: '0908123456',
    province: 'Thành phố Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    addressDetail: '123 Đường Nguyễn Huệ',
    composedAddress: '123 Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
    hubCode: 'HUB_SGN_01',
    hubName: 'Hub Trung tâm Sài Gòn',
    isDefault: true,
  },
];

export const savedAddressStore = {
  getAddresses: async (): Promise<SavedAddress[]> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Save initial default mock address on first run
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEFAULT_ADDRESSES));
        return INITIAL_DEFAULT_ADDRESSES;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as SavedAddress[];
      }
      return INITIAL_DEFAULT_ADDRESSES;
    } catch {
      return INITIAL_DEFAULT_ADDRESSES;
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
