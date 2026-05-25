export interface MerchantProfile {
  id: string;
  username: string;
  citizenId: string;
  regionCode: string;
  regionLabel: string;
  defaultHubCode: string | null;
  defaultHubName: string | null;
  defaultSenderAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MerchantProfileListFilters {
  username?: string;
  citizenId?: string;
  regionCode?: string;
  defaultHubCode?: string;
  q?: string;
}

export interface MerchantProfileWriteInput {
  username: string;
  citizenId: string;
  regionCode: string;
  regionLabel: string;
  defaultHubCode?: string | null;
  defaultHubName?: string | null;
  defaultSenderAddress?: string | null;
}
