import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { theme } from '../../theme';
import { ScanActionItem, type ScanActionItemData } from './ScanActionItem';

interface ScanActionGridProps {
  actions: ScanActionItemData[];
  onPressAction?: (action: ScanActionItemData) => void;
}

export function ScanActionGrid({
  actions,
  onPressAction,
}: ScanActionGridProps): React.JSX.Element {
  return (
    <FlatList
      data={actions}
      keyExtractor={(item) => item.id}
      numColumns={3}
      scrollEnabled={false}
      columnWrapperStyle={styles.column}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <View style={styles.itemWrap}>
          <ScanActionItem action={item} onPress={onPressAction} />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    rowGap: theme.spacing.sm,
  },
  column: {
    gap: theme.spacing.sm,
  },
  itemWrap: {
    flex: 1,
  },
});
