import React from 'react';
import { useForm } from 'react-hook-form';

import {
  useCreateManifestMutation,
  useManifestsQuery,
  useReceiveHandoverMutation,
  useSealManifestMutation,
} from '../../features/manifests/manifests.api';
import type {
  ReceiveHandoverInput,
  SealManifestInput,
} from '../../features/manifests/manifests.types';
import { useAuthStore } from '../../store/authStore';
import { formatDateTime } from '../../utils/format';

interface CreateManifestFormValues {
  originHubCode: string;
  destinationHubCode: string;
  shipmentCodesText: string;
}

export function ManifestManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const manifestsQuery = useManifestsQuery(accessToken);
  const createMutation = useCreateManifestMutation(accessToken);
  const sealMutation = useSealManifestMutation(accessToken);
  const receiveMutation = useReceiveHandoverMutation(accessToken);

  const createForm = useForm<CreateManifestFormValues>({
    defaultValues: { originHubCode: '', destinationHubCode: '', shipmentCodesText: '' },
  });
  const sealForm = useForm<SealManifestInput & { manifestId: string }>({
    defaultValues: { manifestId: '', sealCode: '' },
  });
  const receiveForm = useForm<ReceiveHandoverInput>({
    defaultValues: { manifestCode: '', receiverName: '' },
  });

  return (
    <section>
      <h2>Manifest management</h2>
      <div style={styles.grid}>
        <article style={styles.card}>
          <h3>Create manifest</h3>
          <form
            onSubmit={createForm.handleSubmit((v) =>
              createMutation.mutate({
                originHubCode: v.originHubCode,
                destinationHubCode: v.destinationHubCode,
                shipmentCodes: v.shipmentCodesText
                  .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
              }),
            )}
          >
            <input placeholder="Origin hub" {...createForm.register('originHubCode')} />
            <input
              placeholder="Destination hub"
              {...createForm.register('destinationHubCode')}
            />
            <input
              placeholder="Shipment codes, comma separated"
              {...createForm.register('shipmentCodesText')}
            />
            <button type="submit">Create</button>
          </form>
        </article>
        <article style={styles.card}>
          <h3>Seal manifest</h3>
          <form
            onSubmit={sealForm.handleSubmit((v) =>
              sealMutation.mutate({
                manifestId: v.manifestId,
                payload: { sealCode: v.sealCode },
              }),
            )}
          >
            <input placeholder="Manifest ID" {...sealForm.register('manifestId')} />
            <input placeholder="Seal code" {...sealForm.register('sealCode')} />
            <button type="submit">Seal</button>
          </form>
        </article>
        <article style={styles.card}>
          <h3>Receive handover</h3>
          <form onSubmit={receiveForm.handleSubmit((v) => receiveMutation.mutate(v))}>
            <input placeholder="Manifest code" {...receiveForm.register('manifestCode')} />
            <input placeholder="Receiver name" {...receiveForm.register('receiverName')} />
            <button type="submit">Receive</button>
          </form>
        </article>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Manifest</th>
            <th>Status</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>Sealed at</th>
          </tr>
        </thead>
        <tbody>
          {(manifestsQuery.data ?? []).map((manifest) => (
            <tr key={manifest.id}>
              <td>{manifest.manifestCode}</td>
              <td>{manifest.status}</td>
              <td>{manifest.originHubCode ?? 'N/A'}</td>
              <td>{manifest.destinationHubCode ?? 'N/A'}</td>
              <td>{formatDateTime(manifest.sealedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    border: '1px solid #e7ebf8',
    borderRadius: 12,
    padding: 12,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
};
