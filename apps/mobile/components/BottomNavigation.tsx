import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Tab } from './types';

type BottomNavigationProps = {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
};

const items: { icon: string; label: string; tab: Tab }[] = [
  { icon: '⌂', label: '首页', tab: 'home' },
  { icon: '＋', label: '添加小票', tab: 'add' },
  { icon: '●', label: '我的', tab: 'profile' },
];

export function BottomNavigation({ activeTab, onChange }: BottomNavigationProps) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      {items.map((item) => {
        const selected = activeTab === item.tab;

        return (
          <Pressable
            accessibilityLabel={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={item.tab}
            onPress={() => onChange(item.tab)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Text style={[styles.icon, selected && styles.selected]}>{item.icon}</Text>
            <Text style={[styles.label, selected && styles.selected]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E2E7E1',
    borderTopWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    paddingBottom: 6,
    paddingHorizontal: 8,
  },
  item: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 60 },
  icon: { color: '#89978F', fontSize: 23, fontWeight: '700', lineHeight: 25 },
  label: { color: '#89978F', fontSize: 11, fontWeight: '600', marginTop: 3 },
  selected: { color: '#2E6A51' },
  pressed: { opacity: 0.72 },
});
