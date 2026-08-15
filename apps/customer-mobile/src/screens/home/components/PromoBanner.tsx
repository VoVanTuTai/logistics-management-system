import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, shadows, spacing } from '../../../theme';

const promoRefundImg = require('../../../../assets/promo-refund.png');
const promoGlobalImg = require('../../../../assets/promo-global.png');
const promoOversizedImg = require('../../../../assets/promo-oversized.png');

const SCREEN_WIDTH = Dimensions.get('window').width;
const CONTAINER_PADDING = spacing.lg * 2;
const CARD_WIDTH = SCREEN_WIDTH - CONTAINER_PADDING;
const CARD_HEIGHT = CARD_WIDTH / 2.3;

interface PromoBannerProps {
  onPressPromo?: () => void;
}

const PROMO_SLIDES = [
  {
    id: 'p1',
    image: promoRefundImg,
    title: 'Nhận 100% cước hoàn vận chuyển',
  },
  {
    id: 'p2',
    image: promoGlobalImg,
    title: 'Cùng NEXUS Express tiến bước toàn cầu',
  },
  {
    id: 'p3',
    image: promoOversizedImg,
    title: 'Cỡ nào cũng giao - Luôn luôn đảm bảo',
  },
];

export function PromoBanner({ onPressPromo }: PromoBannerProps): React.JSX.Element {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const scrollRef = useRef<ScrollView>(null);

  // AUTO PLAY CAROUSEL TIMER (EVERY 4 SECONDS)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % PROMO_SLIDES.length;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: nextIndex * CARD_WIDTH,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / CARD_WIDTH);
    if (index >= 0 && index < PROMO_SLIDES.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const scrollToSlide = (index: number) => {
    setActiveIndex(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        x: index * CARD_WIDTH,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* SWIPEABLE CAROUSEL SCROLLVIEW */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        snapToAlignment="center"
      >
        {PROMO_SLIDES.map((slide) => (
          <TouchableOpacity
            key={slide.id}
            activeOpacity={0.92}
            style={[styles.bannerCard, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
            onPress={onPressPromo}
          >
            <Image
              source={slide.image}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* DYNAMIC CAROUSEL INDICATOR DOTS */}
      <View style={styles.dotsRow}>
        {PROMO_SLIDES.map((_, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            onPress={() => scrollToSlide(idx)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View
              style={[
                styles.dot,
                activeIndex === idx ? styles.activeDot : null,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  bannerCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.sm,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 18,
    backgroundColor: colors.primary,
  },
});
