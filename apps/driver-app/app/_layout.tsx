import "../global.css";
import { Stack } from 'expo-router';
import { View, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Device from 'expo-device';

LogBox.ignoreLogs([
  /SafeAreaView/,
]);

export default function Layout() {
  useEffect(() => {
    async function lockOrientation() {
      const deviceType = await Device.getDeviceTypeAsync();
      // Lock to LANDSCAPE for Tablets and Desktops
      if (deviceType === Device.DeviceType.TABLET || deviceType === Device.DeviceType.DESKTOP) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } else {
        // Lock to PORTRAIT for Phones
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    }

    lockOrientation();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="dark" />
    </View>
  );
}
