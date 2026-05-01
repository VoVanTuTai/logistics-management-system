export type CourierPermissionActor = 'OPS' | 'COURIER';

export type CourierPermissionFeature =
  | 'scan.delivery-sign'
  | 'scan.return-sign'
  | 'scan.pickup'
  | 'scan.bag-seal'
  | 'scan.bag-unseal'
  | 'scan.delivery'
  | 'scan.issue'
  | 'scan.outbound'
  | 'scan.inbound'
  | 'scan.vehicle-inbound'
  | 'scan.vehicle-outbound'
  | 'scan.inventory-check'
  | 'scan.branch-pickup'
  | 'scan.high-value-label'
  | 'scan.high-value-check';

export type CourierPermissionCategory =
  | 'handover'
  | 'bag'
  | 'hub'
  | 'delivery'
  | 'control';

export interface CourierPermissionFeatureDefinition {
  id: CourierPermissionFeature;
  label: string;
  category: CourierPermissionCategory;
  description: string;
  riskLevel: 'Thấp' | 'Trung bình' | 'Cao';
}

export type CourierPermissionMatrix = Record<
  CourierPermissionActor,
  Record<CourierPermissionFeature, boolean>
>;

export const COURIER_PERMISSION_ACTORS: Array<{
  id: CourierPermissionActor;
  label: string;
  description: string;
}> = [
  {
    id: 'OPS',
    label: 'Ops',
    description: 'Nhân sự điều hành/hub dùng mobile để xử lý vận hành tại bưu cục.',
  },
  {
    id: 'COURIER',
    label: 'Courier',
    description: 'Shipper/courier thao tác lấy hàng, giao hàng và xử lý bao được phân công.',
  },
];

export const COURIER_PERMISSION_CATEGORIES: Record<
  CourierPermissionCategory,
  string
> = {
  handover: 'Nhận/giao nhận',
  bag: 'Đóng/gỡ bao',
  hub: 'Hub & xe tuyến',
  delivery: 'Phát hàng',
  control: 'Kiểm soát',
};

export const COURIER_PERMISSION_FEATURES: CourierPermissionFeatureDefinition[] = [
  {
    id: 'scan.pickup',
    label: 'Nhận hàng',
    category: 'handover',
    description: 'Quét kiện nhận vào bưu cục hoặc xác nhận đã lấy hàng.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'scan.delivery-sign',
    label: 'Ký nhận',
    category: 'delivery',
    description: 'Quét mã để mở luồng ký nhận giao hàng.',
    riskLevel: 'Cao',
  },
  {
    id: 'scan.return-sign',
    label: 'Ký nhận chuyển hoàn',
    category: 'delivery',
    description: 'Xác nhận bàn giao/chuyển hoàn kiện.',
    riskLevel: 'Cao',
  },
  {
    id: 'scan.delivery',
    label: 'Phát hàng',
    category: 'delivery',
    description: 'Thao tác phát hàng nhanh từ trung tâm quét.',
    riskLevel: 'Cao',
  },
  {
    id: 'scan.issue',
    label: 'Vấn đề',
    category: 'delivery',
    description: 'Ghi nhận sự cố, ngoại lệ hoặc giao thất bại.',
    riskLevel: 'Cao',
  },
  {
    id: 'scan.bag-seal',
    label: 'Đóng bao',
    category: 'bag',
    description: 'Quét tem bao và thêm từng kiện vào bao.',
    riskLevel: 'Cao',
  },
  {
    id: 'scan.bag-unseal',
    label: 'Gỡ bao',
    category: 'bag',
    description: 'Quét tem bao và gỡ từng kiện kèm trách nhiệm nhân viên/hub.',
    riskLevel: 'Cao',
  },
  {
    id: 'scan.inbound',
    label: 'Kiện đến',
    category: 'hub',
    description: 'Quét nhập hub cho kiện hoặc chuyến đến.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'scan.outbound',
    label: 'Gửi kiện',
    category: 'hub',
    description: 'Quét xuất hub hoặc gửi kiện sang tuyến tiếp theo.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'scan.vehicle-inbound',
    label: 'Xe đến',
    category: 'hub',
    description: 'Ghi nhận xe/chuyến đến hub.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'scan.vehicle-outbound',
    label: 'Xe đi',
    category: 'hub',
    description: 'Ghi nhận xe/chuyến rời hub.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'scan.inventory-check',
    label: 'Kiểm tồn kho',
    category: 'control',
    description: 'Kiểm kê nhanh trạng thái tồn tại bưu cục/hub.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'scan.branch-pickup',
    label: 'Nhận hàng CB',
    category: 'handover',
    description: 'Nhận hàng tại chi nhánh/counter branch.',
    riskLevel: 'Trung bình',
  },
  {
    id: 'scan.high-value-label',
    label: 'Tem hàng giá trị cao',
    category: 'control',
    description: 'Tạo hoặc gắn nhãn kiểm soát hàng giá trị cao.',
    riskLevel: 'Cao',
  },
  {
    id: 'scan.high-value-check',
    label: 'Kiểm tra tem giá trị cao',
    category: 'control',
    description: 'Đối soát tem hàng giá trị cao trước/sau vận hành.',
    riskLevel: 'Cao',
  },
];

export const DEFAULT_COURIER_PERMISSION_MATRIX: CourierPermissionMatrix =
  COURIER_PERMISSION_ACTORS.reduce((actorAcc, actor) => {
    actorAcc[actor.id] = COURIER_PERMISSION_FEATURES.reduce((featureAcc, feature) => {
      featureAcc[feature.id] = true;
      return featureAcc;
    }, {} as Record<CourierPermissionFeature, boolean>);

    return actorAcc;
  }, {} as CourierPermissionMatrix);

export const COURIER_PERMISSION_STORAGE_KEY =
  'admin-web.courier-mobile-permission-matrix';

export function normalizeCourierPermissionMatrix(
  value: unknown,
): CourierPermissionMatrix {
  const source =
    value && typeof value === 'object' ? (value as Partial<CourierPermissionMatrix>) : {};

  return COURIER_PERMISSION_ACTORS.reduce((actorAcc, actor) => {
    const actorMatrix = source[actor.id] ?? {};

    actorAcc[actor.id] = COURIER_PERMISSION_FEATURES.reduce((featureAcc, feature) => {
      featureAcc[feature.id] =
        typeof actorMatrix[feature.id] === 'boolean'
          ? actorMatrix[feature.id]
          : DEFAULT_COURIER_PERMISSION_MATRIX[actor.id][feature.id];
      return featureAcc;
    }, {} as Record<CourierPermissionFeature, boolean>);

    return actorAcc;
  }, {} as CourierPermissionMatrix);
}

export function countActorEnabledPermissions(
  matrix: CourierPermissionMatrix,
  actor: CourierPermissionActor,
): number {
  return COURIER_PERMISSION_FEATURES.filter((feature) => matrix[actor][feature.id]).length;
}
