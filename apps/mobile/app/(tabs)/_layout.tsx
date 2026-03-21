import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

interface TabIconProps {
  focused: boolean;
  label: string;
  emoji: string;
}

function TabIcon({ focused, label, emoji }: TabIconProps) {
  return (
    <View className="items-center justify-center pt-1">
      <Text className={`text-xl ${focused ? 'opacity-100' : 'opacity-50'}`}>{emoji}</Text>
      <Text
        className={`text-[10px] mt-0.5 ${focused ? 'text-primary font-semibold' : 'text-slate-400'}`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="" emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="expenses"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="" emoji="💸" />,
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="" emoji="🤝" />,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="" emoji="🐷" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} label="" emoji="👤" />,
        }}
      />
    </Tabs>
  );
}
