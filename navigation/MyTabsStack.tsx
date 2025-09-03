import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MyTabsScreen } from '../screens/MyTabsScreen';
import { NewTabScreen } from '../screens/NewTabScreen';

const Stack = createStackNavigator();

export function MyTabsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="MyTabsMain" 
        component={MyTabsScreen}
        options={{
          title: 'My Tabs',
        }}
      />
      <Stack.Screen 
        name="NewTab" 
        component={NewTabScreen}
        options={{
          title: 'New Tab',
        }}
      />
    </Stack.Navigator>
  );
}