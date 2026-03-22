import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { theme } from '../../theme';
import { AppGridItem, type AppGridIconName } from './AppGridItem';

export interface HomeAppGridItem {
  id: string;
  label: string;
  iconName: AppGridIconName;
  iconColor: string;
  iconBgColor: string;
}

interface AppGridProps {
  title?: string;
  items: HomeAppGridItem[];
  onPressItem?: (item: HomeAppGridItem) => void;
}

export function AppGrid({
  title = 'Ứng dụng',
  items,
  onPressItem,
}: AppGridProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.gridWrap}>
        {items.map((item) => (
          <AppGridItem
            key={item.id}
            label={item.label}
            iconName={item.iconName}
            iconColor={item.iconColor}
            iconBgColor={item.iconBgColor}
            onPress={
              onPressItem
                ? () => {
                    onPressItem(item);
                  }
                : undefined
            }
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  title: {
    ...theme.typography.subtitle.lg,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});
