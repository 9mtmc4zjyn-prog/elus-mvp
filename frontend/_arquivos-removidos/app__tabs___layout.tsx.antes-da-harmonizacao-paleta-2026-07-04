import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#05070D',
  active: '#26D9FF',
  inactive: '#8D98AA',
  border: 'rgba(255,255,255,0.08)',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 12,
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        },
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '800',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Campo',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'radio' : 'radio-outline'}
              size={27}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: 'Explorar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'search' : 'search-outline'}
              size={27}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="connections"
        options={{
          title: 'Conexões',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'people' : 'people-outline'}
              size={27}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person-circle' : 'person-circle-outline'}
              size={29}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="map"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}