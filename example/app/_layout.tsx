import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AlprSettingsProvider } from '../contexts/AlprSettingsContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AlprSettingsProvider>
        <NativeTabs tintColor="#FFD60A">
          <NativeTabs.Trigger name="index">
            <NativeTabs.Trigger.Icon sf="camera.viewfinder" md="photo_camera" />
            <NativeTabs.Trigger.Label>Scan</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="upload">
            <NativeTabs.Trigger.Icon sf="square.and.arrow.up" md="upload" />
            <NativeTabs.Trigger.Label>Upload</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="examples">
            <NativeTabs.Trigger.Icon sf="photo.on.rectangle" md="collections" />
            <NativeTabs.Trigger.Label>Examples</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>
      </AlprSettingsProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
