
import React from 'react';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

export default function TabLayout() {
  const activeColor = '#FF0000';
  
  return (
    <NativeTabs>
      <NativeTabs.Trigger key="home" name="(home)">
        <Icon 
          sf={{ default: 'house', selected: 'house.fill' }}
          style={{ 
            tintColor: activeColor 
          }}
        />
        <Label style={{ color: activeColor }}>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="on-location" name="on-location">
        <Icon 
          sf={{ default: 'location', selected: 'location.fill' }}
          style={{ 
            tintColor: activeColor 
          }}
        />
        <Label style={{ color: activeColor }}>On-Location</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger key="profile" name="profile">
        <Icon 
          sf={{ default: 'person', selected: 'person.fill' }}
          style={{ 
            tintColor: activeColor 
          }}
        />
        <Label style={{ color: activeColor }}>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
