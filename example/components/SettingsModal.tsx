import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { DEFAULT_OVERLAY, useAlprSettings, type OverlaySettings } from '../contexts/AlprSettingsContext';

const COLORS = ['#FFD60A', '#22C55E', '#EF4444', '#3B82F6', '#FFFFFF', '#1C1C1E'];

type Props = {
  visible: boolean;
  onClose: () => void;
};

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, styles.rowLabel]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  digits = 0,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  digits?: number;
  onChange: (value: number) => void;
}) {
  return (
    <>
      <Text style={styles.label}>
        {label}: {value.toFixed(digits)}
      </Text>
      <Slider minimumValue={min} maximumValue={max} step={step} value={value} onValueChange={onChange} />
    </>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.swatches}>
        {COLORS.map((color) => (
          <Pressable
            key={color}
            accessibilityLabel={color}
            style={[styles.swatch, { backgroundColor: color }, value === color && styles.swatchSelected]}
            onPress={() => onChange(color)}
          />
        ))}
      </View>
    </>
  );
}

export function SettingsModal({ visible, onClose }: Props) {
  const {
    settings: config,
    setSettings: onChange,
    showFps,
    setShowFps,
    mockCamera,
    setMockCamera,
    restrictRegion,
    setRestrictRegion,
    overlay,
    setOverlay,
  } = useAlprSettings();
  const update = <K extends keyof OverlaySettings>(key: K) => (value: OverlaySettings[K]) =>
    setOverlay({ ...overlay, [key]: value });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Settings</Text>
            <Pressable accessibilityLabel="Close" hitSlop={12} style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color="#374151" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.content}>

            <SliderRow
              label="Detection threshold"
              value={config.detectionThreshold}
              min={0}
              max={1}
              digits={2}
              onChange={(v) => onChange({ ...config, detectionThreshold: v })}
            />
            <SliderRow
              label="OCR threshold"
              value={config.ocrThreshold}
              min={0}
              max={1}
              digits={2}
              onChange={(v) => onChange({ ...config, ocrThreshold: v })}
            />
            <SwitchRow
              label="CPU only (no GPU / Neural Engine)"
              value={config.accelerator === 'cpu'}
              onChange={(cpu) => onChange({ ...config, accelerator: cpu ? 'cpu' : 'gpu' })}
            />
            <SwitchRow
              label="Scan one plate and stop"
              value={config.singleScan}
              onChange={(singleScan) => onChange({ ...config, singleScan })}
            />
            <SwitchRow label="Show FPS" value={showFps} onChange={setShowFps} />
            <SwitchRow label="Restrict scan area" value={restrictRegion} onChange={setRestrictRegion} />
            <SwitchRow label="Dim outside scan area" value={overlay.showRegion} onChange={update('showRegion')} />
            <SwitchRow label="Use test image instead of camera" value={mockCamera} onChange={setMockCamera} />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Overlay</Text>
              <Pressable onPress={() => setOverlay(DEFAULT_OVERLAY)}>
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            </View>

            <SwitchRow label="Show overlay" value={overlay.showOverlay} onChange={update('showOverlay')} />
            <ColorRow label="Box color" value={overlay.boxColor} onChange={update('boxColor')} />
            <SliderRow
              label="Border width"
              value={overlay.boxBorderWidth}
              min={0}
              max={10}
              step={1}
              onChange={update('boxBorderWidth')}
            />
            <SliderRow
              label="Corner radius"
              value={overlay.boxCornerRadius}
              min={0}
              max={24}
              step={1}
              onChange={update('boxCornerRadius')}
            />
            <SwitchRow label="Show label" value={overlay.showLabel} onChange={update('showLabel')} />
            <SwitchRow label="Plate text" value={overlay.showPlate} onChange={update('showPlate')} />
            <SwitchRow label="Country" value={overlay.showCountry} onChange={update('showCountry')} />
            <SwitchRow label="Confidence" value={overlay.showConfidence} onChange={update('showConfidence')} />
            <ColorRow
              label="Label background"
              value={overlay.labelBackgroundColor}
              onChange={update('labelBackgroundColor')}
            />
            <ColorRow
              label="Label text"
              value={overlay.labelTextColor}
              onChange={update('labelTextColor')}
            />
            <SliderRow
              label="Label font size"
              value={overlay.labelFontSize}
              min={8}
              max={28}
              step={1}
              onChange={update('labelFontSize')}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  sheet: {
    maxHeight: '60%',
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  content: { paddingBottom: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700' },
  label: { fontSize: 14, color: '#374151', marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  rowLabel: { marginTop: 0, flex: 1, marginRight: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#D1D5DB',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  resetText: { color: '#2563EB', fontWeight: '600' },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  swatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  swatchSelected: { borderWidth: 3, borderColor: '#2563EB' },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
