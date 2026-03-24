import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  useAddShipmentMutation,
  useManifestDetailQuery,
  useReceiveHandoverMutation,
  useRemoveShipmentMutation,
  useSealManifestMutation,
} from '../../features/manifests/manifests.api';
import type {
  AddShipmentInput,
  ManifestActionResultDto,
  ReceiveHandoverInput,
  RemoveShipmentInput,
  SealManifestInput,
} from '../../features/manifests/manifests.types';
import { routePaths } from '../../navigation/routes';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { formatManifestStatusLabel } from '../../utils/logisticsLabels';
import { ManifestActionForms } from './ManifestActionForms';

export function ManifestDetailPage(): React.JSX.Element {
  const { manifestId = '' } = useParams();
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const detailQuery = useManifestDetailQuery(accessToken, manifestId);
  const addShipmentMutation = useAddShipmentMutation(accessToken, manifestId);
  const removeShipmentMutation = useRemoveShipmentMutation(accessToken, manifestId);
  const sealMutation = useSealManifestMutation(accessToken, manifestId);
  const receiveMutation = useReceiveHandoverMutation(accessToken, manifestId);
  const [lastActionName, setLastActionName] = useState<
    'addShipment' | 'removeShipment' | 'seal' | 'receiveHandover' | null
  >(null);
  const [lastActionResponse, setLastActionResponse] =
    useState<ManifestActionResultDto | null>(null);

  const onAddShipment = async (payload: AddShipmentInput) => {
    const response = await addShipmentMutation.mutateAsync(payload);
    setLastActionName('addShipment');
    setLastActionResponse(response);
  };

  const onRemoveShipment = async (payload: RemoveShipmentInput) => {
    const response = await removeShipmentMutation.mutateAsync(payload);
    setLastActionName('removeShipment');
    setLastActionResponse(response);
  };

  const onSealManifest = async (payload: SealManifestInput) => {
    const response = await sealMutation.mutateAsync(payload);
    setLastActionName('seal');
    setLastActionResponse(response);
  };

  const onReceiveHandover = async (payload: ReceiveHandoverInput) => {
    const response = await receiveMutation.mutateAsync(payload);
    setLastActionName('receiveHandover');
    setLastActionResponse(response);
  };
  const lastActionLabel =
    lastActionName === 'addShipment'
      ? 'them van don'
      : lastActionName === 'removeShipment'
        ? 'go van don'
        : lastActionName === 'seal'
          ? 'niem phong'
          : lastActionName === 'receiveHandover'
            ? 'nhan ban giao'
            : 'khong co';

  if (detailQuery.isLoading) {
    return <p>Dang tai chi tiet bao tai...</p>;
  }

  if (detailQuery.isError) {
    return <p style={styles.errorText}>{getErrorMessage(detailQuery.error)}</p>;
  }

  if (!detailQuery.data) {
    return <p>Khong tim thay bao tai.</p>;
  }

  return (
    <section>
      <h2>Chi tiet bao tai</h2>
      <p>
        <Link to={routePaths.manifests}>Quay lai danh sach bao tai</Link>
      </p>

      <p>Ma bao tai: {detailQuery.data.manifestCode}</p>
      <p>Trang thai: {formatManifestStatusLabel(detailQuery.data.status)}</p>
      <p>Hub di: {detailQuery.data.originHubCode ?? 'Khong co'}</p>
      <p>Hub den: {detailQuery.data.destinationHubCode ?? 'Khong co'}</p>
      <p>Niem phong luc: {formatDateTime(detailQuery.data.sealedAt)}</p>
      <p>
        Cap nhat luc:{' '}
        {detailQuery.data.updatedAt ? formatDateTime(detailQuery.data.updatedAt) : 'Khong co'}
      </p>
      <p>Ghi chu: {detailQuery.data.note ?? 'Khong co'}</p>
      <p>
        Ma van don:{' '}
        {detailQuery.data.shipmentCodes?.length
          ? detailQuery.data.shipmentCodes.join(', ')
          : 'Khong co'}
      </p>

      <ManifestActionForms
        manifestCode={detailQuery.data.manifestCode}
        onAddShipment={onAddShipment}
        onRemoveShipment={onRemoveShipment}
        onSealManifest={onSealManifest}
        onReceiveHandover={onReceiveHandover}
        isAddingShipment={addShipmentMutation.isPending}
        isRemovingShipment={removeShipmentMutation.isPending}
        isSealingManifest={sealMutation.isPending}
        isReceivingHandover={receiveMutation.isPending}
      />

      {addShipmentMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(addShipmentMutation.error)}</p>
      ) : null}
      {removeShipmentMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(removeShipmentMutation.error)}</p>
      ) : null}
      {sealMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(sealMutation.error)}</p>
      ) : null}
      {receiveMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(receiveMutation.error)}</p>
      ) : null}

      {lastActionResponse ? (
        <div style={styles.responseBox}>
          <strong>Phan hoi he thong gan nhat ({lastActionLabel})</strong>
          <pre style={styles.pre}>{JSON.stringify(lastActionResponse, null, 2)}</pre>
        </div>
      ) : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  responseBox: {
    marginTop: 16,
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8f9ff',
  },
  pre: {
    marginTop: 8,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 13,
  },
  errorText: {
    color: '#b91c1c',
  },
};

