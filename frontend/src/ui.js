import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { C, F } from './theme';

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setR).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setR);
    return () => sub?.remove?.();
  }, []);
  return r;
}

export const useWide = () => useWindowDimensions().width >= 900;

// Liquid glass: blurred, translucent pane with a bright edge and soft inner highlight.
export function Glass({ style, children, strong, radius = 22 }) {
  const base = {
    borderRadius: radius,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        backgroundColor: strong ? 'rgba(250,248,245,0.78)' : 'rgba(250,248,245,0.62)',
        backdropFilter: 'blur(22px) saturate(170%)',
        WebkitBackdropFilter: 'blur(22px) saturate(170%)',
        boxShadow:
          '0 10px 40px rgba(14,12,11,0.10), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(201,169,110,0.25)',
      },
      default: { shadowColor: '#0e0c0b', shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
    }),
  };
  if (Platform.OS === 'web') return <View style={[base, style]}>{children}</View>;
  return (
    <BlurView intensity={50} tint="light" style={[base, style]}>
      {children}
    </BlurView>
  );
}

// Slowly drifting solid-colour shapes that sit behind glass so the blur has something to bend.
export function Blob({ color, size, style, dx = 30, dy = 24, duration = 9000 }) {
  const t = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration, reduced]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        {
          transform: [
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
            { scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
          ],
        },
        style,
      ]}
    />
  );
}

// Fades and lifts children in the first time they scroll into view (web); plays on mount elsewhere.
export function Reveal({ children, delay = 0, style, from = 28 }) {
  const v = useRef(new Animated.Value(0)).current;
  const ref = useRef(null);
  const played = useRef(false);
  const reduced = useReducedMotion();

  const play = () => {
    if (played.current) return;
    played.current = true;
    Animated.timing(v, {
      toValue: 1,
      duration: 750,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (reduced || Platform.OS !== 'web' || typeof IntersectionObserver === 'undefined') {
      play();
      return;
    }
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          play();
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <Animated.View
      ref={ref}
      style={[{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }, style]}
    >
      {children}
    </Animated.View>
  );
}

export function Button({ label, onPress, variant = 'dark', disabled, style }) {
  const [hover, setHover] = useState(false);
  const s = useRef(new Animated.Value(1)).current;
  const to = (n) => Animated.spring(s, { toValue: n, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  const dark = variant === 'dark';
  const bg = disabled ? C.muted : hover ? C.rose : dark ? C.ink : 'transparent';
  return (
    <Animated.View style={[{ transform: [{ scale: s }] }, style]}>
      <Pressable
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !!disabled }}
        onPress={onPress}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        onPressIn={() => to(0.96)}
        onPressOut={() => to(1)}
        style={{
          backgroundColor: bg,
          borderWidth: 1,
          borderColor: dark ? bg : hover ? C.rose : C.ink,
          minHeight: 48,
          justifyContent: 'center',
          paddingVertical: 14,
          paddingHorizontal: 30,
          borderRadius: 999,
          alignItems: 'center',
          ...(Platform.OS === 'web' ? { transitionDuration: '250ms', cursor: disabled ? 'default' : 'pointer' } : null),
        }}
      >
        <Text
          style={{
            fontFamily: F.sans,
            fontSize: 12.5,
            letterSpacing: 1.6,
            textTransform: 'uppercase',
            fontWeight: '600',
            color: dark || hover ? C.paper : C.ink,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Counts up to a number once.
export function CountUp({ to, style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const v = new Animated.Value(0);
    const id = v.addListener(({ value }) => setN(Math.round(value)));
    Animated.timing(v, {
      toValue: to,
      duration: 1600,
      delay: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => v.removeListener(id);
  }, [to]);
  return <Text style={style}>{n}</Text>;
}

export const Eyebrow = ({ children, style }) => (
  <Text
    style={[
      { fontFamily: F.sans, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: C.goldText, fontWeight: '600' },
      style,
    ]}
  >
    {children}
  </Text>
);

export const H2 = ({ children, style }) => (
  <Text style={[{ fontFamily: F.serif, fontSize: 44, lineHeight: 50, color: C.heading, fontWeight: '500' }, style]}>
    {children}
  </Text>
);

export const P = ({ children, style }) => (
  <Text style={[{ fontFamily: F.sans, fontSize: 16, lineHeight: 26, color: C.body }, style]}>{children}</Text>
);
