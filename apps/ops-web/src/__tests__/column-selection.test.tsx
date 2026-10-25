import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShipmentsTable } from '../pages/shipments/ShipmentsTable';
import type { ShipmentListItemDto } from '../features/shipments/shipments.types';

const mockShipments: ShipmentListItemDto[] = [
  {
    id: 's-1',
    shipmentCode: '111595945558',
    currentStatus: 'SCAN_INBOUND',
    senderName: 'Nguyễn Văn Gửi',
    senderPhone: '0901234567',
    senderAddress: '123 Phố Huế',
    receiverName: 'Trần Thị Nhận',
    receiverPhone: '0987654321',
    receiverAddress: '15 Phố Huế, Hoàn Kiếm, Hà Nội',
    receiverHubCode: 'HUB_HN',
    destinationHubCode: 'HUB_HN',
    codAmount: 250000,
    shippingFee: 30000,
    parcelType: 'FRAGILE',
    serviceType: 'EXPRESS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 's-2',
    shipmentCode: '111595945559',
    currentStatus: 'DELIVERING',
    senderName: 'Lê Hoàng Minh',
    senderPhone: '0912345678',
    senderAddress: '456 Cầu Giấy',
    receiverName: 'Phạm Thị Thảo',
    receiverPhone: '0976543210',
    receiverAddress: '789 Giải Phóng, Hai Bà Trưng, Hà Nội',
    receiverHubCode: 'HUB_HN',
    destinationHubCode: 'HUB_HN',
    codAmount: 500000,
    shippingFee: 35000,
    parcelType: 'GENERAL',
    serviceType: 'STANDARD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
] as unknown as ShipmentListItemDto[];

describe('ShipmentsTable Column Selection and Highlighting Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders all table cells with data-col-key and data-copy-value attributes', () => {
    const { container } = render(
      <ShipmentsTable
        items={mockShipments}
        selectedShipmentCodes={[]}
        onToggleShipment={vi.fn()}
        onToggleAllVisible={vi.fn()}
      />,
    );

    // Code column
    const codeCells = container.querySelectorAll('td[data-col-key="code"]');
    expect(codeCells.length).toBe(2);
    expect(codeCells[0].getAttribute('data-copy-value')).toBe('111595945558');
    expect(codeCells[1].getAttribute('data-copy-value')).toBe('111595945559');

    // Receiver Phone column
    const phoneCells = container.querySelectorAll('td[data-col-key="receiverPhone"]');
    expect(phoneCells.length).toBe(2);
    expect(phoneCells[0].getAttribute('data-copy-value')).toBe('0987654321');
    expect(phoneCells[1].getAttribute('data-copy-value')).toBe('0976543210');

    // Receiver Name column
    const nameCells = container.querySelectorAll('td[data-col-key="receiverName"]');
    expect(nameCells.length).toBe(2);
    expect(nameCells[0].getAttribute('data-copy-value')).toBe('Trần Thị Nhận');
    expect(nameCells[1].getAttribute('data-copy-value')).toBe('Phạm Thị Thảo');
  });

  it('renders quick copy buttons and double-click triggers on column headers', async () => {
    const { container } = render(
      <ShipmentsTable
        items={mockShipments}
        selectedShipmentCodes={[]}
        onToggleShipment={vi.fn()}
        onToggleAllVisible={vi.fn()}
      />,
    );

    const codeHeader = container.querySelector('th[data-col-key="code"]');
    expect(codeHeader).toBeDefined();

    // Click the copy button on code column header
    const copyBtn = codeHeader?.querySelector('.ops-col-copy-btn');
    expect(copyBtn).toBeDefined();
    if (copyBtn) {
      fireEvent.click(copyBtn);
    }

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '111595945558\n111595945559',
    );

    // Toast should appear
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/Đã sao chép 2 giá trị cột/)).toBeInTheDocument();
    });
  });

  it('supports double clicking column header to copy values', async () => {
    const { container } = render(
      <ShipmentsTable
        items={mockShipments}
        selectedShipmentCodes={[]}
        onToggleShipment={vi.fn()}
        onToggleAllVisible={vi.fn()}
      />,
    );

    const phoneHeader = container.querySelector('th[data-col-key="receiverPhone"]');
    expect(phoneHeader).toBeDefined();

    if (phoneHeader) {
      fireEvent.doubleClick(phoneHeader);
    }

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      '0987654321\n0976543210',
    );
  });

  it('supports vertical drag selection across rows in a single column', async () => {
    const { container } = render(
      <ShipmentsTable
        items={mockShipments}
        selectedShipmentCodes={[]}
        onToggleShipment={vi.fn()}
        onToggleAllVisible={vi.fn()}
      />,
    );

    const tableShell = container.querySelector('.ops-shipments-table-shell');
    const firstCodeCell = container.querySelector('td[data-col-key="code"][data-row-index="0"]');
    const secondCodeCell = container.querySelector('td[data-col-key="code"][data-row-index="1"]');

    expect(firstCodeCell).toBeDefined();
    expect(secondCodeCell).toBeDefined();

    // Mouse down on row 0
    fireEvent.mouseDown(firstCodeCell!, { clientX: 100, clientY: 100 });

    // Drag down to row 1 (move > 5px vertically)
    fireEvent.mouseMove(secondCodeCell!, { clientX: 100, clientY: 150 });

    // Table shell should have data-selecting-col="code"
    expect(tableShell?.getAttribute('data-selecting-col')).toBe('code');

    // Both cells should be active
    expect(firstCodeCell?.getAttribute('data-col-active')).toBe('true');
    expect(secondCodeCell?.getAttribute('data-col-active')).toBe('true');

    // Cells in other columns should NOT be active
    const otherCell = container.querySelector('td[data-col-key="receiverPhone"][data-row-index="0"]');
    expect(otherCell?.getAttribute('data-col-active')).toBeNull();
    expect(otherCell?.classList.contains('ops-col-cell-selected')).toBe(false);

    // selectstart event must be prevented to stop browser text selection from bleeding
    const selectStartEvent = new Event('selectstart', { bubbles: true, cancelable: true });
    tableShell?.dispatchEvent(selectStartEvent);
    expect(selectStartEvent.defaultPrevented).toBe(true);

    // Mouse up ends dragging but leaves selection active for copying
    fireEvent.mouseUp(firstCodeCell!);

    // Trigger copy event
    const copyEvent = new Event('copy', { bubbles: true, cancelable: true });
    const clipboardDataMock = {
      setData: vi.fn(),
    };
    Object.assign(copyEvent, { clipboardData: clipboardDataMock });
    document.dispatchEvent(copyEvent);

    expect(clipboardDataMock.setData).toHaveBeenCalledWith(
      'text/plain',
      '111595945558\n111595945559',
    );
  });

  it('suppresses onRowClick while selecting columns so drawer does not popup', () => {
    const onRowClickMock = vi.fn();
    const { container } = render(
      <ShipmentsTable
        items={mockShipments}
        selectedShipmentCodes={[]}
        onToggleShipment={vi.fn()}
        onToggleAllVisible={vi.fn()}
        onRowClick={onRowClickMock}
      />,
    );

    const firstCodeCell = container.querySelector('td[data-col-key="code"][data-row-index="0"]');
    const row0 = container.querySelector('tr[data-row-index="0"]');

    // Mouse down and drag
    fireEvent.mouseDown(firstCodeCell!, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(firstCodeCell!, { clientX: 100, clientY: 160 });
    fireEvent.mouseUp(firstCodeCell!);

    // Click event immediately after mouseup
    fireEvent.click(row0!);

    // onRowClick should have been suppressed!
    expect(onRowClickMock).not.toHaveBeenCalled();
  });
});
