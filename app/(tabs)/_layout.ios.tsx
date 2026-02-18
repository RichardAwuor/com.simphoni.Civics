
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const activeColor = '#FF0000';
  
  return (
    <NativeTabs>
      <NativeTabs.Screen
        name="(home)"
        options={{
          title: 'Dashboard',
        }}
      >
        <Icon 
          sf={{ default: 'house', selected: 'house.fill' }}
          style={{ 
            tintColor: activeColor 
          }}
        />
        <Label style={{ color: activeColor }}>Dashboard</Label>
      </NativeTabs.Screen>
      
      <NativeTabs.Screen
        name="on-location"
        options={{
          title: 'On-Location',
        }}
      >
        <Icon 
          sf={{ default: 'location', selected: 'location.fill' }}
          style={{ 
            tintColor: activeColor 
          }}
        />
        <Label style={{ color: activeColor }}>On-Location</Label>
      </NativeTabs.Screen>
      
      <NativeTabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      >
        <Icon 
          sf={{ default: 'person', selected: 'person.fill' }}
          style={{ 
            tintColor: activeColor 
          }}
        />
        <Label style={{ color: activeColor }}>Profile</Label>
      </NativeTabs.Screen>
      
      {/* Hidden register screen - accessible via navigation but not shown in tab bar */}
      <NativeTabs.Screen
        name="register"
        options={{
          href: null,
        }}
      />
    </NativeTabs>
  );
}
