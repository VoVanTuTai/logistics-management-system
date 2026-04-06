import React, { useMemo, useState } from 'react';

import { useHubsQuery } from '../../features/masterdata/masterdata.api';
import {
  useDeleteManifestMutation,
  useGenerateBagCodesMutation,
  useManifestsQuery,
} from '../../features/manifests/manifests.api';
import type {
  GenerateBagCodesInput,
  ManifestListItemDto,
} from '../../features/manifests/manifests.types';
import { openBagLabelPrint } from '../../printing/bagLabelPrint';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';
import { formatManifestStatusLabel } from '../../utils/logisticsLabels';
import { CreateManifestForm } from './CreateManifestForm';
import { ManifestsTable } from './ManifestsTable';

export function ManifestManagementPage(): React.JSX.Element {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.tokens.accessToken ?? null;
  const manifestsQuery = useManifestsQuery(accessToken);
  const hubsQuery = useHubsQuery(accessToken, {});
  const generateBagCodesMutation = useGenerateBagCodesMutation(accessToken);
  const deleteManifestMutation = useDeleteManifestMutation(accessToken);
  const [lastGeneratedBags, setLastGeneratedBags] = useState<ManifestListItemDto[]>(
    [],
  );
  const [deletingManifestId, setDeletingManifestId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const assignedHubCodes = session?.user.hubCodes ?? [];
  const originHubCode = assignedHubCodes[0] ?? '';
  const destinationHubOptions = useMemo(
    () =>
      (hubsQuery.data ?? [])
        .filter((hub) => hub.isActive && hub.code !== originHubCode)
        .sort((a, b) => a.code.localeCompare(b.code)),
    [hubsQuery.data, originHubCode],
  );

  const onGenerateBagCodes = async (payload: GenerateBagCodesInput) => {
    const createdBags = await generateBagCodesMutation.mutateAsync(payload);
    setLastGeneratedBags(createdBags);
    setActionMessage(`Da tao ${createdBags.length} ma bao trong.`);
  };

  const onDeleteManifest = async (item: ManifestListItemDto) => {
    if (item.status !== 'CREATED') {
      setActionMessage(`Chi xoa duoc bao dang o trang thai ${formatManifestStatusLabel('CREATED')}.`);
      return;
    }

    const ok = window.confirm(`Xoa ma bao ${item.manifestCode}?`);
    if (!ok) {
      return;
    }

    setActionMessage(null);
    setDeletingManifestId(item.id);
    try {
      await deleteManifestMutation.mutateAsync(item.id);
      setActionMessage(`Da xoa ma bao ${item.manifestCode}.`);
    } catch (error) {
      setActionMessage(getErrorMessage(error));
    } finally {
      setDeletingManifestId(null);
    }
  };

  const onPrintManifest = (item: ManifestListItemDto) => {
    const opened = openBagLabelPrint({
      bagCode: item.manifestCode,
      originHubCode: item.originHubCode ?? 'Khong co',
      destinationHubCode: item.destinationHubCode ?? 'Khong co',
      status: formatManifestStatusLabel(item.status),
      createdAtText: formatDateTime(item.createdAt ?? null),
    });

    if (!opened) {
      setActionMessage('Trinh duyet dang chan cua so in. Hay cho phep cua so in roi thu lai.');
      return;
    }

    setActionMessage(`Da mo nhan in QR cho ma bao ${item.manifestCode}.`);
  };

  return (
    <div>
      <h2>Quan ly bao tai</h2>
      <p style={{ color: '#2d3f99' }}>
        Tao ma bao trong theo hub dich de bo phan dieu hanh dung khi dong bao trung chuyen giua
        cac hub.
      </p>

      {originHubCode ? (
        <p style={styles.scopeText}>
          Hub hien tai cua ban: <strong>{originHubCode}</strong>
        </p>
      ) : (
        <p style={styles.warningText}>
          Tai khoan dieu hanh chua duoc gan hub nguon, chua the tao ma bao.
        </p>
      )}

      <CreateManifestForm
        isSubmitting={generateBagCodesMutation.isPending}
        originHubCode={originHubCode}
        destinationHubOptions={destinationHubOptions}
        onSubmit={onGenerateBagCodes}
      />

      {actionMessage ? (
        <p
          style={{
            ...styles.actionText,
            ...(actionMessage.startsWith('Da')
              ? styles.successText
              : styles.errorText),
          }}
        >
          {actionMessage}
        </p>
      ) : null}
      {hubsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(hubsQuery.error)}</p>
      ) : null}
      {generateBagCodesMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(generateBagCodesMutation.error)}</p>
      ) : null}
      {deleteManifestMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(deleteManifestMutation.error)}</p>
      ) : null}

      {lastGeneratedBags.length > 0 ? (
        <div style={styles.responseBox}>
          <strong>
            Da tao {lastGeneratedBags.length} ma bao trong luc{' '}
            {formatDateTime(new Date().toISOString())}
          </strong>
          <div style={styles.tagsWrap}>
            {lastGeneratedBags.map((bag) => (
              <span key={bag.id} style={styles.tag}>
                {bag.manifestCode}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {manifestsQuery.isLoading ? <p>Dang tai danh sach bao...</p> : null}
      {manifestsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(manifestsQuery.error)}</p>
      ) : null}
      {manifestsQuery.isSuccess && (manifestsQuery.data?.length ?? 0) === 0 ? (
        <p>Chua co bao nao.</p>
      ) : null}
      {manifestsQuery.isSuccess && (manifestsQuery.data?.length ?? 0) > 0 ? (
        <ManifestsTable
          items={manifestsQuery.data ?? []}
          deletingManifestId={deletingManifestId}
          onDeleteManifest={(item) => {
            void onDeleteManifest(item);
          }}
          onPrintManifest={onPrintManifest}
        />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorText: {
    color: '#b91c1c',
    marginTop: 12,
  },
  successText: {
    color: '#166534',
  },
  actionText: {
    marginTop: 12,
    fontWeight: 600,
  },
  warningText: {
    color: '#b45309',
    marginTop: 12,
    padding: '8px 12px',
    border: '1px solid #f59e0b',
    borderRadius: 10,
    backgroundColor: '#fffbeb',
    maxWidth: 760,
  },
  scopeText: {
    marginTop: 12,
    color: '#1f2b6f',
  },
  responseBox: {
    marginTop: 12,
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8f9ff',
    maxWidth: 920,
  },
  tagsWrap: {
    marginTop: 10,
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  tag: {
    border: '1px solid #c7d2fe',
    backgroundColor: '#eef2ff',
    color: '#1e3a8a',
    borderRadius: 999,
    padding: '4px 10px',
    fontSize: 13,
    fontWeight: 600,
  },
};


