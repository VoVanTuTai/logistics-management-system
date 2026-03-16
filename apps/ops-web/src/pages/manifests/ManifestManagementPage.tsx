import React, { useState } from 'react';

import { useCreateManifestMutation, useManifestsQuery } from '../../features/manifests/manifests.api';
import type {
  CreateManifestInput,
  ManifestActionResultDto,
} from '../../features/manifests/manifests.types';
import { getErrorMessage } from '../../services/api/errors';
import { useAuthStore } from '../../store/authStore';
import { CreateManifestForm } from './CreateManifestForm';
import { ManifestsTable } from './ManifestsTable';

export function ManifestManagementPage(): React.JSX.Element {
  const accessToken = useAuthStore((state) => state.session?.tokens.accessToken ?? null);
  const manifestsQuery = useManifestsQuery(accessToken);
  const createMutation = useCreateManifestMutation(accessToken);
  const [lastCreateResponse, setLastCreateResponse] =
    useState<ManifestActionResultDto | null>(null);

  const onCreateManifest = async (payload: CreateManifestInput) => {
    const response = await createMutation.mutateAsync(payload);
    setLastCreateResponse(response);
  };

  return (
    <div>
      <h2>Manifest management</h2>
      <p style={{ color: '#2d3f99' }}>
        Manifest create workflow only sends payload to gateway and displays server response.
      </p>

      <CreateManifestForm
        isSubmitting={createMutation.isPending}
        onSubmit={onCreateManifest}
      />
      {createMutation.isError ? (
        <p style={styles.errorText}>{getErrorMessage(createMutation.error)}</p>
      ) : null}
      {lastCreateResponse ? (
        <div style={styles.responseBox}>
          <strong>Last create response</strong>
          <pre style={styles.pre}>{JSON.stringify(lastCreateResponse, null, 2)}</pre>
        </div>
      ) : null}

      {manifestsQuery.isLoading ? <p>Loading manifests...</p> : null}
      {manifestsQuery.isError ? (
        <p style={styles.errorText}>{getErrorMessage(manifestsQuery.error)}</p>
      ) : null}
      {manifestsQuery.isSuccess && (manifestsQuery.data?.length ?? 0) === 0 ? (
        <p>No manifests found.</p>
      ) : null}
      {manifestsQuery.isSuccess && (manifestsQuery.data?.length ?? 0) > 0 ? (
        <ManifestsTable items={manifestsQuery.data ?? []} />
      ) : null}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorText: {
    color: '#b91c1c',
    marginTop: 12,
  },
  responseBox: {
    marginTop: 12,
    border: '1px solid #d9def3',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f8f9ff',
    maxWidth: 920,
  },
  pre: {
    marginTop: 8,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: 13,
  },
};

