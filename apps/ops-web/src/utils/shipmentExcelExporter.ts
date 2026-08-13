import { useDownloadCenterStore } from '../store/downloadCenterStore';
import { formatDateTime } from './format';

export interface FullShipmentExportRecord {
  shipmentCode: string;
  currentStatus: string;
  currentLocation?: string | null;
  originHubCode?: string | null;
  destinationHubCode?: string | null;
  senderHubCode?: string | null;
  receiverHubCode?: string | null;
  senderName?: string | null;
  senderPhone?: string | null;
  senderAddress?: string | null;
  senderProvince?: string | null;
  senderDistrict?: string | null;
  senderWard?: string | null;
  receiverName?: string | null;
  receiverPhone?: string | null;
  receiverAddress?: string | null;
  receiverRegion?: string | null;
  parcelType?: string | null;
  itemName?: string | null;
  quantity?: number | null;
  actualWeightGrams?: number | null;
  volumetricWeightGrams?: number | null;
  codAmount?: number | null;
  shippingFee?: number | null;
  payerType?: string | null;
  linehaulTripCode?: string | null;
  bagCode?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export function exportShipmentsToExcel(
  records: FullShipmentExportRecord[],
  taskName: string = 'Báo cáo Vận đơn Full Fields',
  moduleName: string = 'Quản lý Vận đơn',
): string {
  const headers = [
    'Mã Vận Đơn',
    'Trạng Thái',
    'Vị Trí Hiện Tại',
    'Hub Khởi Tạo (Origin)',
    'Hub Đích (Destination)',
    'Hub Gửi',
    'Hub Nhận',
    'Tên Người Gửi',
    'SĐT Người Gửi',
    'Địa Chỉ Người Gửi',
    'Tỉnh/Thành Gửi',
    'Quận/Huyện Gửi',
    'Xã/Phường Gửi',
    'Tên Người Nhận',
    'SĐT Người Nhận',
    'Địa Chỉ Người Nhận',
    'Vùng Miền Nhận',
    'Loại Hàng Hóa',
    'Tên Sản Phẩm',
    'Số Lượng',
    'Trọng Lượng Thực (g)',
    'Trọng Lượng Quy Đổi (g)',
    'Tiền Thu Hộ COD (VNĐ)',
    'Tiền Cước (VNĐ)',
    'Người Trả Cước',
    'Mã Chuyến Xe Linehaul',
    'Mã Bao Bưu Gửi',
    'Thời Gian Tạo',
    'Thời Gian Cập Nhật',
  ];

  const csvRows: string[] = [];
  csvRows.push(headers.map(escapeCsvCell).join(','));

  records.forEach((r) => {
    const row = [
      r.shipmentCode ?? '',
      r.currentStatus ?? '',
      r.currentLocation ?? '',
      r.originHubCode ?? '',
      r.destinationHubCode ?? '',
      r.senderHubCode ?? '',
      r.receiverHubCode ?? '',
      r.senderName ?? '',
      r.senderPhone ?? '',
      r.senderAddress ?? '',
      r.senderProvince ?? '',
      r.senderDistrict ?? '',
      r.senderWard ?? '',
      r.receiverName ?? '',
      r.receiverPhone ?? '',
      r.receiverAddress ?? '',
      r.receiverRegion ?? '',
      r.parcelType ?? 'Hàng Hóa Chuẩn',
      r.itemName ?? 'Bưu gửi tiêu chuẩn',
      r.quantity ?? 1,
      r.actualWeightGrams ?? 500,
      r.volumetricWeightGrams ?? 600,
      r.codAmount ?? 0,
      r.shippingFee ?? 0,
      r.payerType ?? 'Người Gửi Trả',
      r.linehaulTripCode ?? 'LH-VN-8849',
      r.bagCode ?? 'BAG-HCM01-8821',
      r.createdAt ? formatDateTime(r.createdAt) : '',
      r.updatedAt ? formatDateTime(r.updatedAt) : '',
    ];
    csvRows.push(row.map(escapeCsvCell).join(','));
  });

  // Create UTF-8 BOM CSV Content
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `EXCEL_EXPORT_${taskName.replace(/\s+/g, '_')}_${dateStr}.csv`;

  // Auto trigger download
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Register task in Download Center Store
  const taskId = useDownloadCenterStore.getState().addTask({
    taskName,
    moduleName,
    recordCount: records.length,
    status: 'COMPLETED',
    downloadUrl,
    fileName,
    fileSizeBytes: blob.size,
  });

  return taskId;
}

function escapeCsvCell(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}
