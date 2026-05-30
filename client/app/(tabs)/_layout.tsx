/**
 * Bottom-tab layout with a custom tab bar that gives visual transition
 * feedback on every tab change.
 *
 * Why not `MaterialTopTabs` (which would give swipe-between-tabs)? It
 * depends on `react-native-pager-view`, and the SDK-54 build of Expo
 * Go has subtle native incompatibilities that crash the app on launch.
 * We'll revisit swipe support once we move off Expo Go onto a custom
 * dev client.
 *
 * What we DO get here:
 *   - An animated pill indicator that smoothly slides between tabs on
 *     tap (Reanimated `withTiming`).
 *   - Outline → filled icon cross-fade when a tab gains focus.
 *   - Subtle scale pop on the focused icon.
 *   - Elevated centre Send button (unchanged).
 */

import { Ionicons } from '@expo/vector-icons';
import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, Radii } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<
  string,
  { active: IoniconName; inactive: IoniconName; label: string }
> = {
  index: { active: 'home', inactive: 'home-outline', label: 'Home' },
  chats: { active: 'chatbubble', inactive: 'chatbubble-outline', label: 'Chats' },
  send: { active: 'paper-plane', inactive: 'paper-plane', label: 'Send' },
  travel: { active: 'globe', inactive: 'globe-outline', label: 'Travel' },
  profile: { active: 'person', inactive: 'person-outline', label: 'Profile' },
};

const INDICATOR_WIDTH = 28;
const INDICATOR_HEIGHT = 3;

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="chats" options={{ title: 'Chats' }} />
      <Tabs.Screen name="send" options={{ title: 'Send' }} />
      <Tabs.Screen name="travel" options={{ title: 'Travel' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const tabCount = state.routes.length;
  const tabWidth = screenWidth / tabCount;

  // `indicatorPosition` tracks the currently-active tab index (0..N-1)
  // but is smoothly tweened via Reanimated's `withTiming`, so the pill
  // SLIDES between cells rather than snapping.
  const indicatorPosition = useSharedValue(state.index);

  useEffect(() => {
    indicatorPosition.value = withTiming(state.index, { duration: 220 });
  }, [state.index, indicatorPosition]);

  const indicatorStyle = useAnimatedStyle(() => {
    const x =
      indicatorPosition.value * tabWidth + (tabWidth - INDICATOR_WIDTH) / 2;
    return { transform: [{ translateX: x }] };
  });

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: c.tint, width: INDICATOR_WIDTH },
          indicatorStyle,
        ]}
      />

      {state.routes.map((route, index) => {
        const icon = TAB_CONFIG[route.name];
        if (!icon) return null;

        const isFocused = state.index === index;
        const onPress = () => {
          if (!isFocused) navigation.navigate(route.name);
        };

        if (route.name === 'send') {
          return (
            <SendTab
              key={route.key}
              focused={isFocused}
              tintColor={c.tint}
              labelColor={c.textMuted}
              onPress={onPress}
            />
          );
        }

        return (
          <TabItem
            key={route.key}
            label={icon.label}
            activeIcon={icon.active}
            inactiveIcon={icon.inactive}
            focused={isFocused}
            activeColor={c.tint}
            inactiveColor={c.tabIconDefault}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Single tab cell — outline ⇄ filled cross-fade + scale pop on focus.
// ---------------------------------------------------------------------------

type TabItemProps = {
  label: string;
  activeIcon: IoniconName;
  inactiveIcon: IoniconName;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
  onPress: () => void;
};

function TabItem({
  label,
  activeIcon,
  inactiveIcon,
  focused,
  activeColor,
  inactiveColor,
  onPress,
}: TabItemProps) {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, focus]);

  const iconWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focus.value * 0.08 }],
  }));

  const activeIconStyle = useAnimatedStyle(() => ({
    opacity: focus.value,
  }));

  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - focus.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + focus.value * 0.45,
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabItem} android_ripple={null}>
      <Animated.View style={[styles.iconWrap, iconWrapStyle]}>
        <Animated.View style={[styles.iconLayer, inactiveIconStyle]}>
          <Ionicons name={inactiveIcon} size={22} color={inactiveColor} />
        </Animated.View>
        <Animated.View style={[styles.iconLayer, activeIconStyle]}>
          <Ionicons name={activeIcon} size={22} color={activeColor} />
        </Animated.View>
      </Animated.View>
      <Animated.View style={labelStyle}>
        <ThemedText
          style={[styles.label, { color: focused ? activeColor : inactiveColor }]}
        >
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Send tab — elevated circular button. Slight scale pulse when focused.
// ---------------------------------------------------------------------------

type SendTabProps = {
  focused: boolean;
  tintColor: string;
  labelColor: string;
  onPress: () => void;
};

function SendTab({ focused, tintColor, labelColor, onPress }: SendTabProps) {
  const focus = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    focus.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, focus]);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + focus.value * 0.1 }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.sendWrapper} android_ripple={null}>
      <Animated.View
        style={[
          styles.sendCircle,
          { backgroundColor: tintColor },
          circleStyle,
        ]}
      >
        <Ionicons name="paper-plane" size={22} color="#fff" />
      </Animated.View>
      <ThemedText style={[styles.sendLabel, { color: labelColor }]}>
        Send
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    height: INDICATOR_HEIGHT,
    borderRadius: INDICATOR_HEIGHT / 2,
    left: 0,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    gap: 2,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  },
  sendWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  sendCircle: {
    width: 52,
    height: 52,
    borderRadius: Radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  sendLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
