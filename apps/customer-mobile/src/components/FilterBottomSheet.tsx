import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

export interface FilterOptionItem<T> {
  label: string;
  value: T;
}

interface FilterBottomSheetProps<T> {
  visible: boolean;
  title: string;
  options: FilterOptionItem<T>[];
  selectedValue: T;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function FilterBottomSheet<T extends string>({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: FilterBottomSheetProps<T>): React.JSX.Element {
  const [tempSelected, setTempSelected] = React.useState<T>(selectedValue);

  React.useEffect(() => {
    setTempSelected(selectedValue);
  }, [selectedValue, visible]);

  const handleConfirm = () => {
    onSelect(tempSelected);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              <View style={styles.handleBar} />

              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
                {options.map((item) => {
                  const isSelected = tempSelected === item.value;
                  return (
                    <TouchableOpacity
                      key={String(item.value)}
                      activeOpacity={0.7}
                      style={[styles.optionRow, isSelected && styles.selectedOptionRow]}
                      onPress={() => setTempSelected(item.value)}
                    >
                      <Text style={[styles.optionLabel, isSelected && styles.selectedOptionLabel]}>
                        {item.label}
                      </Text>

                      <View style={[styles.radioCircle, isSelected && styles.selectedRadioCircle]}>
                        {isSelected ? <View style={styles.radioInnerDot} /> : null}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.footer}>
                <PrimaryButton title="Xác nhận" onPress={handleConfirm} size="lg" />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '75%',
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  optionsList: {
    maxHeight: 320,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  selectedOptionRow: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
  },
  optionLabel: {
    fontSize: 15,
    color: colors.textPrimary,
  },
  selectedOptionLabel: {
    fontWeight: '700',
    color: colors.primary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioCircle: {
    borderColor: colors.primary,
  },
  radioInnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  footer: {
    marginTop: spacing.lg,
  },
});
