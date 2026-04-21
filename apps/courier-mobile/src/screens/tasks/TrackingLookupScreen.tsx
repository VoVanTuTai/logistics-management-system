import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '../../components/ui/Card';
import { Screen } from '../../components/ui/Screen';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTrackingLookupQuery } from '../../features/tracking/tracking.queries';
import type { TrackingTimelineEventDto } from '../../features/tracking/tracking.types';
import { useAppStore } from '../../store/appStore';
import { theme } from '../../theme';

function formatDateTime(value: string | null): string {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('vi-VN');
}

function resolveTimelineLocation(event: TrackingTimelineEventDto): string {
  return event.locationText ?? event.locationCode ?? 'Khong ro';
}

function normalizeShipmentCode(value: string): string {
  return value.trim().toUpperCase();
}

export function TrackingLookupScreen(): React.JSX.Element {
  const session = useAppStore((state) => state.session);
  const [shipmentCodeInput, setShipmentCodeInput] = useState('');
  const [submittedShipmentCode, setSubmittedShipmentCode] = useState('');

  const normalizedInput = useMemo(
    () => normalizeShipmentCode(shipmentCodeInput),
    [shipmentCodeInput],
  );

  const trackingQuery = useTrackingLookupQuery({
    accessToken: session?.tokens.accessToken ?? null,
    shipmentCode: submittedShipmentCode || null,
  });

  const onSubmit = (): void => {
    if (!normalizedInput) {
      return;
    }

    setSubmittedShipmentCode(normalizedInput);
    setShipmentCodeInput(normalizedInput);
    Keyboard.dismiss();
  };

  const timeline = trackingQuery.data?.timeline ?? [];

  return (
    <Screen
      contentContainerStyle={styles.content}
      onRefresh={
        submittedShipmentCode
          ? () => {
              void trackingQuery.refetch();
            }
          : undefined
      }
      refreshing={trackingQuery.isRefetching}
    >
      <Card style={styles.lookupCard}>
        <Text style={styles.lookupTitle}>Tra cứu hành trình don hang</Text>
        <Text style={styles.lookupSubtitle}>
          Nhap ma van don de xem toan bo lich su tu luc nhan hang den khi giao thanh cong.
        </Text>

        <View style={styles.inputRow}>
          <Ionicons name="barcode-outline" size={18} color={theme.colors.textMuted} />
          <TextInput
            value={shipmentCodeInput}
            onChangeText={setShipmentCodeInput}
            placeholder="VD: SHP001"
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={onSubmit}
            style={styles.input}
          />
        </View>

        <Pressable
          onPress={onSubmit}
          disabled={trackingQuery.isLoading || !normalizedInput}
          style={[
            styles.searchButton,
            (trackingQuery.isLoading || !normalizedInput) && styles.searchButtonDisabled,
          ]}
        >
          {trackingQuery.isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="search-outline" size={16} color="#FFFFFF" />
          )}
          <Text style={styles.searchButtonText}>
            {trackingQuery.isLoading ? 'Dang tra cuu...' : 'Tra cứu hành trình'}
          </Text>
        </Pressable>
      </Card>

      {!submittedShipmentCode ? (
        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>Nhap ma van don de bat dau tra cuu.</Text>
        </Card>
      ) : null}

      {trackingQuery.isError ? (
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>Khong tai duoc du lieu tracking</Text>
          <Text style={styles.errorText}>
            {trackingQuery.error instanceof Error
              ? trackingQuery.error.message
              : 'Tra cuu that bai. Vui long thu lai.'}
          </Text>
          <Pressable
            onPress={() => {
              void trackingQuery.refetch();
            }}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Thu lai</Text>
          </Pressable>
        </Card>
      ) : null}

      {trackingQuery.data ? (
        <>
          <Card style={styles.currentCard}>
            <View style={styles.currentHeader}>
              <Text style={styles.currentCode}>{trackingQuery.data.current.shipmentCode}</Text>
              <StatusBadge
                label={trackingQuery.data.current.currentStatus ?? 'UNKNOWN'}
                variant="info"
              />
            </View>

            <View style={styles.currentRow}>
              <Text style={styles.currentLabel}>Trang thai hien tai</Text>
              <Text style={styles.currentValue}>
                {trackingQuery.data.current.currentStatus ?? 'N/A'}
              </Text>
            </View>
            <View style={styles.currentRow}>
              <Text style={styles.currentLabel}>Vi tri hien tai</Text>
              <Text style={styles.currentValue}>
                {trackingQuery.data.current.currentLocationText ??
                  trackingQuery.data.current.currentLocationCode ??
                  'N/A'}
              </Text>
            </View>
            <View style={styles.currentRow}>
              <Text style={styles.currentLabel}>Su kien gan nhat</Text>
              <Text style={styles.currentValue}>
                {trackingQuery.data.current.lastEventType ?? 'N/A'}
              </Text>
            </View>
            <View style={styles.currentRow}>
              <Text style={styles.currentLabel}>Cap nhat luc</Text>
              <Text style={styles.currentValue}>
                {formatDateTime(
                  trackingQuery.data.current.lastEventAt ??
                    trackingQuery.data.current.updatedAt,
                )}
              </Text>
            </View>
          </Card>

          <Text style={styles.timelineTitle}>Hanh trinh van don ({timeline.length} su kien)</Text>
          {timeline.length === 0 ? (
            <Card style={styles.infoCard}>
              <Text style={styles.infoText}>Chua co su kien timeline cho van don nay.</Text>
            </Card>
          ) : (
            timeline.map((event) => (
              <Card key={event.id} style={styles.timelineCard}>
                <View style={styles.timelineTopRow}>
                  <View style={styles.timelineEventWrap}>
                    <Text style={styles.timelineEventType}>{event.eventType}</Text>
                    <Text style={styles.timelineEventTime}>
                      {formatDateTime(event.occurredAt)}
                    </Text>
                  </View>
                  <StatusBadge label={event.statusAfterEvent ?? 'UNKNOWN'} variant="neutral" />
                </View>

                <Text style={styles.timelineMeta}>Vi tri: {resolveTimelineLocation(event)}</Text>
                <Text style={styles.timelineMeta}>Nguon su kien: {event.eventSource}</Text>
              </Card>
            ))
          )}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  lookupCard: {
    gap: theme.spacing.sm,
  },
  lookupTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  lookupSubtitle: {
    ...theme.typography.body.sm,
    color: theme.colors.textMuted,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: '#FFFFFF',
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  currentCard: {
    gap: theme.spacing.xs,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  currentCode: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.primary,
    flex: 1,
  },
  currentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  currentLabel: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    flex: 1,
  },
  currentValue: {
    ...theme.typography.body.sm,
    color: theme.colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  timelineTitle: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
  },
  timelineCard: {
    gap: theme.spacing.xs,
  },
  timelineTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  timelineEventWrap: {
    flex: 1,
  },
  timelineEventType: {
    ...theme.typography.body.md,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  timelineEventTime: {
    ...theme.typography.caption.md,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  timelineMeta: {
    ...theme.typography.caption.md,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
  },
  infoText: {
    color: theme.colors.textMuted,
  },
  errorCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    gap: theme.spacing.xs,
  },
  errorTitle: {
    ...theme.typography.subtitle.sm,
    color: theme.colors.danger,
    fontWeight: '700',
  },
  errorText: {
    ...theme.typography.body.sm,
    color: '#991B1B',
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
