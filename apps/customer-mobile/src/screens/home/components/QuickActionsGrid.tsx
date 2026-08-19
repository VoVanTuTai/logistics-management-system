import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing } from '../../../theme';

interface QuickActionsGridProps {
  onPressCreateOrder: () => void;
  onPressMyOrders: () => void;
  onPressTracking: () => void;
  onPressRateCalculator: () => void;
}

export function QuickActionsGrid({
  onPressCreateOrder,
  onPressMyOrders,
  onPressTracking,
  onPressRateCalculator,
}: QuickActionsGridProps): React.JSX.Element {
  const features = [
    {
      id: 'smart_create',
      title: 'Tạo đơn\nthông minh',
      badge: 'Beta',
      icon: 'cube-outline',
      iconColor: colors.primary,
      onPress: onPressCreateOrder,
    },
    {
      id: 'express_create',
      title: 'Tạo đơn giao\nngay nội tỉnh',
      icon: 'flash-outline',
      iconColor: '#EA8A2F',
      onPress: onPressCreateOrder,
    },
    {
      id: 'intl_create',
      title: 'Tạo đơn\nquốc tế',
      icon: 'airplane-outline',
      iconColor: '#EC4899',
      onPress: onPressCreateOrder,
    },
    {
      id: 'my_orders',
      title: 'Đơn hàng\ncủa tôi',
      icon: 'list-outline',
      iconColor: '#10B981',
      onPress: onPressMyOrders,
    },
    {
      id: 'price_lookup',
      title: 'Tra cứu\ncước phí',
      icon: 'calculator-outline',
      iconColor: '#8B5CF6',
      onPress: onPressRateCalculator,
    },
    {
      id: 'hubs_help',
      title: 'Tìm bưu cục\n& trợ giúp',
      icon: 'help-circle-outline',
      iconColor: '#3B82F6',
      onPress: onPressTracking,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tính năng</Text>
        <TouchableOpacity
          style={styles.seeAllBtn}
          activeOpacity={0.7}
          onPress={onPressMyOrders}
        >
          <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* SINGLE ROW HORIZONTALLY SCROLLABLE CAROUSEL */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {features.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.8}
            style={styles.card}
            onPress={item.onPress}
          >
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}

            <View style={styles.iconContainer}>
              <Ionicons name={item.icon as any} size={26} color={item.iconColor} />
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  seeAllBtn: {
    padding: 4,
  },
  scrollContainer: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  card: {
    width: 115,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.md,
    paddingTop: spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    position: 'relative',
    ...shadows.sm,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  iconContainer: {
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 16,
  },
});
