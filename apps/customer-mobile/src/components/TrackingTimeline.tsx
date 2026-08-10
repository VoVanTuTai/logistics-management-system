import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';
import type { TrackingEvent } from '../types';

interface TrackingTimelineProps {
  timeline: TrackingEvent[];
}

export function TrackingTimeline({ timeline }: TrackingTimelineProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {timeline.map((item, index) => {
        const isLast = index === timeline.length - 1;
        const isCompleted = item.completed;
        const isCurrent = item.isCurrent;

        return (
          <View key={item.id} style={styles.timelineRow}>
            <View style={styles.leftCol}>
              <View
                style={[
                  styles.dot,
                  isCompleted && styles.completedDot,
                  isCurrent && styles.currentDot,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color={colors.surface} />
                ) : null}
              </View>

              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    isCompleted && styles.completedLine,
                  ]}
                />
              ) : null}
            </View>

            <View style={styles.rightCol}>
              <Text
                style={[
                  styles.title,
                  isCurrent && styles.currentTitle,
                  !isCompleted && styles.pendingTitle,
                ]}
              >
                {item.title}
              </Text>
              <Text style={styles.timestamp}>{item.timestamp}</Text>
              {item.location ? (
                <Text style={styles.location}>{item.location}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 56,
  },
  leftCol: {
    width: 28,
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  completedDot: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  currentDot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  completedLine: {
    backgroundColor: colors.success,
  },
  rightCol: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  currentTitle: {
    color: colors.primary,
  },
  pendingTitle: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontStyle: 'italic',
  },
});
