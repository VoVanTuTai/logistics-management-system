import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { theme } from '../../theme';
import type { HomeAppGridItem } from '../../components/home/AppGrid';
import type { AppNavigatorParamList } from '../../navigation/types';
import { DEFAULT_QUICK_APP_IDS } from './quickAppDefaults';
import type { CourierPermissionFeature } from '../permissions/courier-permissions';

export interface QuickAppItem extends HomeAppGridItem {
  description: string;
  permission?: CourierPermissionFeature;
}

export const QUICK_APP_CATALOG: QuickAppItem[] = [
  {
    id: 'task-list',
    label: 'Danh sách nhiệm vụ',
    description: 'Mở toàn bộ nhiệm vụ được giao',
    iconName: 'list-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
  },
  {
    id: 'pickup',
    label: 'Nhận hàng',
    description: 'Quét và xác nhận lấy hàng',
    iconName: 'cube-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
    permission: 'scan.pickup',
  },
  {
    id: 'delivery',
    label: 'Phát hàng',
    description: 'Xử lý phát hàng theo tuyến',
    iconName: 'paper-plane-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
    permission: 'scan.delivery',
  },
  {
    id: 'goods-arrival',
    label: 'Hàng đến',
    description: 'Ghi nhận hàng đến hub',
    iconName: 'download-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
    permission: 'scan.inbound',
  },
  {
    id: 'bag-seal',
    label: 'Đóng bao',
    description: 'Đóng bao và chốt danh sách hàng',
    iconName: 'archive-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
    permission: 'scan.bag-seal',
  },
  {
    id: 'bag-unseal',
    label: 'Gỡ bao',
    description: 'Mở bao và kiểm tra kiện',
    iconName: 'file-tray-outline',
    iconColor: '#7C3AED',
    iconBgColor: '#F3E8FF',
    permission: 'scan.bag-unseal',
  },
  {
    id: 'vehicle-out',
    label: 'Xe đi',
    description: 'Quét xe rời hub',
    iconName: 'car-sport-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
    permission: 'scan.vehicle-outbound',
  },
  {
    id: 'vehicle-in',
    label: 'Xe đến',
    description: 'Quét xe đến hub',
    iconName: 'bus-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
    permission: 'scan.vehicle-inbound',
  },
  {
    id: 'inventory-check',
    label: 'Kiểm tồn',
    description: 'Kiểm tra tồn kho tại điểm',
    iconName: 'clipboard-outline',
    iconColor: '#8A5A0A',
    iconBgColor: '#FFF4DD',
    permission: 'scan.inventory-check',
  },
  {
    id: 'cod',
    label: 'Tiền hàng COD',
    description: 'Theo dõi và thu tiền COD',
    iconName: 'wallet-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
  },
  {
    id: 'tracking',
    label: 'Theo dõi đơn',
    description: 'Tra cứu hành trình vận đơn',
    iconName: 'locate-outline',
    iconColor: theme.colors.primary,
    iconBgColor: theme.colors.infoSurface,
  },
  {
    id: 'scan-issue',
    label: 'Báo vấn đề',
    description: 'Gửi sự cố vận hành',
    iconName: 'alert-circle-outline',
    iconColor: '#C25B12',
    iconBgColor: '#FFEDD5',
    permission: 'scan.issue',
  },
  {
    id: 'stats',
    label: 'Thống kê',
    description: 'Xem hiệu suất cá nhân',
    iconName: 'stats-chart-outline',
    iconColor: '#1D4ED8',
    iconBgColor: '#EFF6FF',
  },
  {
    id: 'scan',
    label: 'Quét mã',
    description: 'Mở trung tâm quét mã',
    iconName: 'qr-code-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
  },
  {
    id: 'chat',
    label: 'Chat hỗ trợ',
    description: 'Trao đổi với điều phối',
    iconName: 'chatbubble-ellipses-outline',
    iconColor: '#1D4ED8',
    iconBgColor: '#EFF6FF',
  },
  {
    id: 'send-goods',
    label: 'Gửi hàng',
    description: 'Quét và gửi hàng đi',
    iconName: 'send-outline',
    iconColor: '#1A6B4A',
    iconBgColor: '#E6FAF1',
    permission: 'scan.outbound',
  },
];

const quickAppById = new Map(QUICK_APP_CATALOG.map((item) => [item.id, item]));

export function getQuickAppItems(appIds: string[]): QuickAppItem[] {
  const items = appIds
    .map((id) => quickAppById.get(id))
    .filter((item): item is QuickAppItem => Boolean(item));

  if (items.length > 0) {
    return items;
  }

  return DEFAULT_QUICK_APP_IDS.map((id) => quickAppById.get(id)).filter(
    (item): item is QuickAppItem => Boolean(item),
  );
}

export function navigateToQuickApp(
  appId: string,
  navigation: NativeStackNavigationProp<AppNavigatorParamList>,
): void {
  if (appId === 'task-list') {
    navigation.navigate('TaskList', {
      initialTaskType: 'ALL',
      initialStatus: 'ALL',
    });
    return;
  }

  if (appId === 'pickup') {
    navigation.navigate('PickupScan', {});
    return;
  }

  if (appId === 'delivery') {
    navigation.navigate('DeliveryDispatch');
    return;
  }

  if (appId === 'goods-arrival') {
    navigation.navigate('GoodsArrival');
    return;
  }

  if (appId === 'bag-seal') {
    navigation.navigate('BagSeal');
    return;
  }

  if (appId === 'bag-unseal') {
    navigation.navigate('BagUnseal');
    return;
  }

  if (appId === 'vehicle-out') {
    navigation.navigate('VehicleOutbound');
    return;
  }

  if (appId === 'vehicle-in') {
    navigation.navigate('VehicleInbound');
    return;
  }

  if (appId === 'inventory-check') {
    navigation.navigate('InventoryCheck');
    return;
  }

  if (appId === 'cod') {
    navigation.navigate('CodStats');
    return;
  }

  if (appId === 'tracking') {
    navigation.navigate('TrackingLookup');
    return;
  }

  if (appId === 'scan-issue') {
    navigation.navigate('ScanIssue');
    return;
  }

  if (appId === 'stats') {
    navigation.navigate('MainTabs', { screen: 'Stats' });
    return;
  }

  if (appId === 'scan') {
    navigation.navigate('MainTabs', { screen: 'Scan' });
    return;
  }

  if (appId === 'chat') {
    navigation.navigate('MainTabs', { screen: 'Chat' });
    return;
  }

  if (appId === 'send-goods') {
    navigation.navigate('SendGoods');
  }
}
