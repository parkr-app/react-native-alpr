import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { AlprSettingsProvider } from '../contexts/AlprSettingsContext';

export default function RootLayout() {
  return (
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
  );
}
