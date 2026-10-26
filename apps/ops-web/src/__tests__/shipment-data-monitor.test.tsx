import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShipmentDataMonitorPage } from '../pages/function-groups/operations-platform/data-monitoring/ShipmentDataMonitorPage';
import { shipmentsClient } from '../features/shipments/shipments.client';
import { useAuthStore } from '../store/authStore';
import type { ShipmentListItemDto } from '../features/shipments/shipments.types';

vi.mock('../features/shipments/shipments.client', () => ({
  shipmentsClient: {
    list: vi.fn(),
  },
}));

vi.mock('../hooks/useHubScope', () => ({
  useHubScope: () => ({
    isAllSystem: true,
    scopedHubCodes: [],
    selectedHub: null,
    setSelectedHub: vi.fn(),
  }),
}));

const mockShipments: ShipmentListItemDto[] = [
  {
    id: 'ship-1',
    shipmentCode: '111595945558',
    currentStatus: 'SCAN_INBOUND',
    senderName: 'Nguyễn Văn Gửi',
    senderPhone: '0901234567',
    senderAddress: '123 Phố Huế',
    senderWard: 'Hàng Bài',
    senderDistrict: 'Hoàn Kiếm',
    senderProvince: 'Hà Nội',
    senderHubCode: 'HUB_ORIGIN',
    receiverName: 'Trần Thị Nhận',
    receiverPhone: '0987654321',
    receiverAddress: '15 Phố Huế, Hoàn Kiếm, Hà Nội',
    receiverRegion: 'Hà Nội',
    receiverHubCode: 'HUB_HANG_BAI',
    currentLocation: 'HUB_HANG_BAI',
    originHubCode: 'HUB_ORIGIN',
    destinationHubCode: 'HUB_HANG_BAI',
    codAmount: 250000,
    shippingFee: 30000,
    parcelType: 'FRAGILE',
    serviceType: 'EXPRESS',
    platform: 'SHOPEE',
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    deliveryNote: 'Hàng dễ vỡ xin nhẹ tay',
    requiresLabelReprint: false,
    labelReprintReason: null,
    isOperationLocked: false,
    operationLockReason: null,
    metadata: {
      package: {
        weightKg: 1.5,
      },
      inspectionPolicy: 'CHO_XEM_HANG',
    },
  },
  {
    id: 'ship-2',
    shipmentCode: '111595945559',
    currentStatus: 'SCAN_INBOUND',
    senderName: 'Lê Văn Shop',
    senderPhone: '0912345678',
    senderAddress: '456 Hai Bà Trưng',
    senderWard: 'Tràng Tiền',
    senderDistrict: 'Hoàn Kiếm',
    senderProvince: 'Hà Nội',
    senderHubCode: 'HUB_ORIGIN_2',
    receiverName: 'Phạm Văn Mua',
    receiverPhone: '0978901234',
    receiverAddress: '88 Lý Thường Kiệt',
    receiverRegion: 'Hà Nội',
    receiverHubCode: 'HUB_HANG_BAI',
    currentLocation: 'HUB_HANG_BAI',
    originHubCode: 'HUB_ORIGIN_2',
    destinationHubCode: 'HUB_HANG_BAI',
    codAmount: 0,
    shippingFee: 45000,
    parcelType: 'BULKY',
    serviceType: 'STANDARD',
    platform: 'TIKTOK',
    updatedAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(), // 7 hours ago (overdue)
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    deliveryNote: 'Giao giờ hành chính',
    requiresLabelReprint: true,
    labelReprintReason: 'Tem rách',
    isOperationLocked: false,
    operationLockReason: null,
    metadata: {
      package: {
        weightKg: 5,
        dimensions: {
          length: 50,
          width: 40,
          height: 30,
        },
      },
    },
  },
];

describe('ShipmentDataMonitorPage - Inbound Arrival Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    useAuthStore.setState({
      session: {
        user: {
          id: 'user-ops-1',
          username: 'ops.hangbai',
          roles: ['SYSTEM_ADMIN'],
          hubCodes: ['HUB_HANG_BAI'],
        },
        tokens: {
          tokenType: 'Bearer',
          accessToken: 'mock-test-access-token',
          refreshToken: 'mock-test-refresh-token',
          accessTokenExpiresAt: '2099-01-01T00:00:00.000Z',
          refreshTokenExpiresAt: '2099-01-01T00:00:00.000Z',
        },
      },
      status: 'authenticated',
    });

    vi.mocked(shipmentsClient.list).mockResolvedValue(mockShipments);
  });

  it('renders the golden table headers, parcel badges, and IATA weight calculation', async () => {
    render(<ShipmentDataMonitorPage mode="arrival" />);

    // Check title
    expect(await screen.findByText('Giám sát hàng đến')).toBeInTheDocument();
    expect(screen.getByText('MONITOR_DATA_HANG_DEN')).toBeInTheDocument();

    // Check header columns
    expect(screen.getByText('Mã vận đơn & Nguồn')).toBeInTheDocument();
    expect(screen.getAllByText('Trạng thái').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Loại hàng')).toBeInTheDocument();
    expect(screen.getByText(/KL tính cước/)).toBeInTheDocument();
    expect(screen.getAllByText('BC đến').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Hub gửi/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Bên gửi')).toBeInTheDocument();
    expect(screen.getByText('Bên nhận')).toBeInTheDocument();
    expect(screen.getByText('Tiền COD & Cước')).toBeInTheDocument();
    expect(screen.getByText(/Tuổi xử lý/)).toBeInTheDocument();

    // Check shipment code display
    expect(await screen.findByText('111595945558')).toBeInTheDocument();
    expect(screen.getByText('111595945559')).toBeInTheDocument();

    // Check classification badges
    expect(screen.getByText('DỄ VỠ')).toBeInTheDocument();
    expect(screen.getByText('CỒNG KỀNH')).toBeInTheDocument();

    // Check IATA volumetric badge for the bulky parcel (50x40x30 / 6000 = 10kg > 5kg)
    expect(screen.getByText('📐 Thể tích IATA')).toBeInTheDocument();
    expect(screen.getByText('10.0 kg')).toBeInTheDocument();

    // Check overdue badge (>= 6 hours)
    expect(screen.getByText('⚠️ Quá 6h')).toBeInTheDocument();

    // Check label reprint badge
    expect(screen.getByText('In lại tem')).toBeInTheDocument();
  });

  it('supports row selection, select-all, and clear-selection action strip', async () => {
    const user = userEvent.setup();
    render(<ShipmentDataMonitorPage mode="arrival" />);

    await screen.findByText('111595945558');

    // Initially no selection strip
    expect(screen.queryByText(/Đã chọn:/)).not.toBeInTheDocument();

    // Select row 1
    const row1Checkbox = screen.getByLabelText('Chọn vận đơn 111595945558');
    await user.click(row1Checkbox);

    // Selection strip appears
    expect(await screen.findByText(/✓ Đã chọn: 1 vận đơn/)).toBeInTheDocument();

    // Click "Bỏ chọn"
    const clearButton = screen.getByRole('button', { name: 'Bỏ chọn' });
    await user.click(clearButton);

    // Selection strip disappears
    expect(screen.queryByText(/✓ Đã chọn:/)).not.toBeInTheDocument();

    // Select all on page via header checkbox
    const selectAllCheckbox = screen.getByLabelText('Chọn tất cả vận đơn trên trang');
    await user.click(selectAllCheckbox);

    expect(await screen.findByText(/✓ Đã chọn: 2 vận đơn/)).toBeInTheDocument();
  });

  it('renders ColumnVisibilityPicker and allows toggling columns', async () => {
    render(<ShipmentDataMonitorPage mode="arrival" />);

    await screen.findByText('111595945558');

    // Column picker button
    const colPickerBtn = screen.getByRole('button', { name: /Tùy chỉnh cột/ });
    expect(colPickerBtn).toBeInTheDocument();

    // Open dropdown
    fireEvent.click(colPickerBtn);
    expect(screen.getByText('Ẩn / Hiện Cột')).toBeInTheDocument();

    // Toggle Ghi chú vận hành column in dropdown
    const checkbox = screen.getByRole('checkbox', { name: 'Ghi chú vận hành' });
    fireEvent.click(checkbox);

    // Verify localStorage has persisted the setting
    const saved = localStorage.getItem('ops_monitor_arrival_visible_columns_v2');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed.deliveryNote).toBe(false);
  });
});
