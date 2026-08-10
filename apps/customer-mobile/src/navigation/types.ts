import type { NavigatorScreenParams } from '@react-navigation/native';
import type { OrderModel } from '../types';

export type MainTabParamList = {
  HomeTab: undefined;
  OrdersTab: { initialCategory?: 'SENT' | 'RECEIVED' } | undefined;
  TrackingTab: { initialCode?: string } | undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  CreateOrder: undefined;
  CreateOrderSuccess: { orderCode: string };
  OrderDetail: { order: OrderModel };
  PriceCalculator: undefined;
  AddressManagement: undefined;
};
