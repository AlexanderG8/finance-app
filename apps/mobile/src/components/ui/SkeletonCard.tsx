import { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface SkeletonCardProps {
  height?: number;
  borderRadius?: number;
}

function SkeletonBox({ height = 16, borderRadius = 8 }: SkeletonCardProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={{ height, borderRadius, backgroundColor: '#e2e8f0', opacity }}
    />
  );
}

export function SkeletonCard() {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f1f5f9',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <SkeletonBox height={14} borderRadius={6} />
        </View>
        <SkeletonBox height={14} borderRadius={6} />
      </View>
      <SkeletonBox height={10} borderRadius={5} />
      <View style={{ marginTop: 8 }}>
        <SkeletonBox height={10} borderRadius={5} />
      </View>
      <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <SkeletonBox height={8} borderRadius={4} />
        </View>
        <View style={{ flex: 1 }}>
          <SkeletonBox height={8} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}
