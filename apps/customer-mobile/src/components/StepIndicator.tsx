import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';

interface StepIndicatorProps {
  currentStep: number; // 1, 2, 3
  onStepPress?: (step: number) => void;
}

const STEPS = [
  { step: 1, label: 'Địa chỉ' },
  { step: 2, label: 'Hàng hóa' },
  { step: 3, label: 'Cước phí' },
];

export function StepIndicator({ currentStep, onStepPress }: StepIndicatorProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((item, index) => {
          const isActive = currentStep === item.step;
          const isDone = currentStep > item.step;
          const isClickable = typeof onStepPress === 'function';

          return (
            <React.Fragment key={item.step}>
              <TouchableOpacity
                activeOpacity={isClickable ? 0.7 : 1}
                disabled={!isClickable}
                onPress={() => onStepPress?.(item.step)}
                style={styles.stepItem}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <View
                  style={[
                    styles.circle,
                    isActive && styles.activeCircle,
                    isDone && styles.doneCircle,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.circleText,
                        (isActive || isDone) && styles.activeCircleText,
                      ]}
                    >
                      {item.step}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.activeStepLabel,
                    isDone && styles.doneStepLabel,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>

              {index < STEPS.length - 1 ? (
                <View
                  style={[
                    styles.line,
                    currentStep > item.step && styles.activeLine,
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  activeCircle: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doneCircle: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  activeCircleText: {
    color: colors.surface,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  activeStepLabel: {
    color: colors.primary,
    fontWeight: '700',
  },
  doneStepLabel: {
    color: colors.success,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: colors.border,
    marginHorizontal: spacing.xs,
    marginBottom: 16,
  },
  activeLine: {
    backgroundColor: colors.success,
  },
});
