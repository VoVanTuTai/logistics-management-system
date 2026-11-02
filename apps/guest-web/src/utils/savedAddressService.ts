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

const STORAGE_PREFIX = 'NEXUS_SAVED_ADDRESSES_V2';

function resolveStorageKey(identifier?: string | null): string {
  if (identifier && identifier.trim()) {
    return `${STORAGE_PREFIX}_${identifier.trim()}`;
  }
  try {
    const rawAuth = localStorage.getItem('nexus_guest_auth');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      const id = parsed?.user?.id || parsed?.user?.username || parsed?.phone;
      if (id) return `${STORAGE_PREFIX}_${id}`;
    }
  } catch {}
  return `${STORAGE_PREFIX}_GUEST`;
}

export function getSavedAddresses(identifier?: string | null): SavedAddress[] {
  try {
    const key = resolveStorageKey(identifier);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => item.id && item.name);
    }
    return [];
  } catch {
    return [];
  }
}

export function getDefaultAddress(identifier?: string | null): SavedAddress | null {
  const list = getSavedAddresses(identifier);
  if (list.length === 0) return null;
  const foundDefault = list.find((a) => a.isDefault);
  return foundDefault || list[0] || null;
}

export function saveAddress(
  identifier: string | null | undefined,
  address: Omit<SavedAddress, 'id'> & { id?: string },
): SavedAddress[] {
  const key = resolveStorageKey(identifier);
  const list = getSavedAddresses(identifier);
  const id = address.id || `addr_${Date.now()}`;
  const newAddress: SavedAddress = {
    ...address,
    id,
    name: address.name.trim(),
    phone: address.phone.trim(),
    addressDetail: address.addressDetail.trim(),
    composedAddress: address.composedAddress.trim(),
  };

  let updatedList: SavedAddress[];
  if (address.isDefault) {
    updatedList = list.map((item) => ({ ...item, isDefault: false }));
  } else {
    updatedList = [...list];
  }

  const existingIndex = updatedList.findIndex((item) => item.id === id);
  if (existingIndex >= 0) {
    updatedList[existingIndex] = newAddress;
  } else {
    if (updatedList.length === 0) {
      newAddress.isDefault = true;
    }
    updatedList.unshift(newAddress);
  }

  try {
    localStorage.setItem(key, JSON.stringify(updatedList));
  } catch {}
  return updatedList;
}

export function setDefaultAddress(identifier: string | null | undefined, id: string): SavedAddress[] {
  const key = resolveStorageKey(identifier);
  const list = getSavedAddresses(identifier);
  const updatedList = list.map((item) => ({
    ...item,
    isDefault: item.id === id,
  }));
  try {
    localStorage.setItem(key, JSON.stringify(updatedList));
  } catch {}
  return updatedList;
}

export function deleteAddress(identifier: string | null | undefined, id: string): SavedAddress[] {
  const key = resolveStorageKey(identifier);
  const list = getSavedAddresses(identifier);
  const updatedList = list.filter((item) => item.id !== id);

  // If deleted address was default, reassign default to the first remaining
  if (updatedList.length > 0 && !updatedList.some((item) => item.isDefault)) {
    updatedList[0].isDefault = true;
  }

  try {
    localStorage.setItem(key, JSON.stringify(updatedList));
  } catch {}
  return updatedList;
}

