import * as ImagePicker from 'expo-image-picker';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  ReceiptApiError,
  scanReceiptImage,
  type ReceiptScanData,
} from '../../api/receiptScan';
import { useLanguage } from '../../i18n/LanguageContext';

type AddReceiptScreenProps = {
  accessToken: string;
  onScanComplete: (data: ReceiptScanData) => void;
};

type SelectedReceiptImage = {
  fileName: string;
  mimeType: string;
  uri: string;
};

const getImageMimeType = (fileName: string | null | undefined) => {
  const normalizedName = fileName?.toLowerCase() ?? '';
  if (normalizedName.endsWith('.png')) return 'image/png';
  if (normalizedName.endsWith('.heic') || normalizedName.endsWith('.heif')) return 'image/heic';
  if (normalizedName.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

const getUploadFileName = (fileName: string | null | undefined, mimeType: string) => {
  const baseName = fileName?.replace(/\.[^.]+$/, '') || `receipt-${Date.now()}`;
  if (mimeType === 'image/png') return `${baseName}.png`;
  if (mimeType === 'image/jpeg') return `${baseName}.jpg`;
  return fileName ?? `${baseName}.jpg`;
};

export function AddReceiptScreen({ accessToken, onScanComplete }: AddReceiptScreenProps) {
  const { text } = useLanguage();
  const scanControllerRef = useRef<AbortController | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedReceiptImage | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => () => scanControllerRef.current?.abort(), []);

  const pickReceiptFromLibrary = async () => {
    if (isPicking || isScanning) return;

    setIsPicking(true);
    setScanError(null);

    try {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        Alert.alert(
          text('需要相册权限', 'Photo access required'),
          libraryPermission.canAskAgain
            ? text('请允许 Receiptly 访问相册，以便选择小票图片。', 'Allow Receiptly to access your photos so you can choose a receipt.')
            : text('相册权限已关闭，请前往系统设置为 Receiptly 开启相册权限。', 'Photo access is disabled. Enable it for Receiptly in Settings.'),
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ['images'],
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
        quality: 0.95,
      });
      const asset = result.canceled ? null : result.assets[0];

      if (asset?.uri) {
        const mimeType = asset.mimeType ?? getImageMimeType(asset.fileName);
        setSelectedImage({
          fileName: getUploadFileName(asset.fileName, mimeType),
          mimeType,
          uri: asset.uri,
        });
      }
    } catch {
      Alert.alert(
        text('无法打开相册', 'Unable to open photos'),
        text('请稍后重试。', 'Please try again later.'),
      );
    } finally {
      setIsPicking(false);
    }
  };

  const scanCapturedReceipt = async () => {
    if (!selectedImage || isScanning) return;

    const controller = new AbortController();
    scanControllerRef.current = controller;
    setIsScanning(true);
    setScanError(null);

    try {
      const data = await scanReceiptImage(selectedImage.uri, {
        accessToken,
        fileName: selectedImage.fileName,
        mimeType: selectedImage.mimeType,
        signal: controller.signal,
      });
      onScanComplete(data);
    } catch (error) {
      if (controller.signal.aborted) return;
      setScanError(error instanceof ReceiptApiError
        ? error.message
        : text('识别失败，请重新选择图片或稍后重试。', 'Recognition failed. Choose another image or try again later.'));
    } finally {
      if (scanControllerRef.current === controller) scanControllerRef.current = null;
      setIsScanning(false);
    }
  };

  const cancelScan = () => {
    scanControllerRef.current?.abort();
    scanControllerRef.current = null;
    setIsScanning(false);
  };

  if (selectedImage) {
    return (
      <View style={styles.scannerScreen}>
        <Image
          accessibilityLabel={text('从相册选择的小票预览', 'Selected receipt preview')}
          source={{ uri: selectedImage.uri }}
          style={styles.previewImage}
        />
        {isScanning && (
          <View accessibilityRole="alert" style={styles.scanProgress}>
            <ActivityIndicator color="#315D49" size="small" />
            <View style={styles.scanProgressCopy}>
              <Text style={styles.scanProgressTitle}>{text('正在识别小票', 'Recognising receipt')}</Text>
              <Text style={styles.scanProgressText}>{text('图片只用于本次识别，请稍候。', 'The image is used only for this scan. Please wait.')}</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={cancelScan} style={styles.cancelScanButton}>
              <Text style={styles.cancelScanText}>{text('取消', 'Cancel')}</Text>
            </Pressable>
          </View>
        )}
        {scanError && (
          <View accessibilityRole="alert" style={styles.scanError}>
            <Text style={styles.scanErrorTitle}>{text('未能完成识别', 'Could not recognise receipt')}</Text>
            <Text style={styles.scanErrorText}>{scanError}</Text>
          </View>
        )}
        <View style={styles.previewActions}>
          <Pressable
            accessibilityRole="button"
            disabled={isScanning}
            onPress={() => {
              setSelectedImage(null);
              setScanError(null);
            }}
            style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}
          >
            <Text style={styles.outlineButtonText}>
              {text('重新选择', 'Choose again')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={isScanning}
            onPress={scanCapturedReceipt}
            style={({ pressed }) => [
              styles.saveButton,
              isScanning && styles.disabledButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.saveButtonText}>{scanError ? text('重新识别', 'Try again') : text('识别并检查', 'Scan and review')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.eyebrow}>{text('新建记录', 'New entry')}</Text>
        <Text style={styles.title}>{text('添加小票', 'Add receipt')}</Text>
        <Text style={styles.pageDescription}>{text('扫描结果只是候选内容，保存后仍需逐项检查和确认。', 'Scan results are suggestions. Review and confirm every item before saving.')}</Text>
      </View>

      <View style={styles.scanCard}>
        <View style={styles.scanIconCircle}>
          <Text style={styles.scanIcon}>⌗</Text>
        </View>
        <Text style={styles.scanTitle}>{text('扫描小票', 'Scan receipt')}</Text>
        <Text style={styles.scanDescription}>
          {text('从相册选择小票图片。选择前请先遮挡会员号和支付识别信息。', 'Choose a receipt image from Photos. Cover membership and payment details first.')}
        </Text>
        <Pressable
          accessibilityHint={text('打开系统相册并选择一张小票图片', 'Open Photos and choose a receipt image')}
          accessibilityRole="button"
          disabled={isPicking}
          onPress={pickReceiptFromLibrary}
          style={({ pressed }) => [
            styles.primaryButton,
            isPicking && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          {isPicking
            ? <ActivityIndicator color="#315D49" size="small" />
            : <Text style={styles.primaryButtonText}>{text('从相册选择小票', 'Choose from Photos')}</Text>}
        </Pressable>
      </View>

      {/* Manual entry is hidden for the initial App Store release until the flow is complete.
      <Pressable
        accessibilityRole="button"
        onPress={() => Alert.alert(text('手动录入', 'Manual entry'), text('手动录入表单将在下一步实现。', 'Manual entry will be available in a future update.'))}
        style={({ pressed }) => [styles.manualCard, pressed && styles.pressed]}
      >
        <View>
          <Text style={styles.manualTitle}>{text('手动录入', 'Manual entry')}</Text>
          <Text style={styles.manualText}>{text('相册或识别不可用时，仍可手动创建小票。', 'Create a receipt manually when Photos or recognition is unavailable.')}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
      */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 18 },
  eyebrow: { color: '#577066', fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#1E302B', fontSize: 28, fontWeight: '700', letterSpacing: -0.7, marginTop: 4 },
  pageDescription: { color: '#5E726A', fontSize: 15, lineHeight: 22, marginTop: 10 },
  scanCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E6EAE4', borderRadius: 24, borderWidth: 1, padding: 24 },
  scanIconCircle: { alignItems: 'center', backgroundColor: '#EDF2E7', borderRadius: 36, height: 72, justifyContent: 'center', width: 72 },
  scanIcon: { color: '#315D49', fontSize: 34 },
  scanTitle: { color: '#1E302B', fontSize: 21, fontWeight: '700', marginTop: 16 },
  scanDescription: { color: '#65786F', fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  primaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#D9E965', borderRadius: 16, justifyContent: 'center', marginTop: 20, minHeight: 54 },
  primaryButtonText: { color: '#1A3328', fontSize: 16, fontWeight: '700' },
  disabledButton: { opacity: 0.45 },
  manualCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E6EAE4', borderRadius: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 88, padding: 18 },
  manualTitle: { color: '#263C33', fontSize: 16, fontWeight: '700' },
  manualText: { color: '#65786F', fontSize: 13, marginTop: 5, maxWidth: 270 },
  chevron: { color: '#71847B', fontSize: 28 },
  scannerScreen: { backgroundColor: '#101613', flex: 1 },
  previewImage: { flex: 1, resizeMode: 'contain', width: '100%' },
  scanProgress: {
    alignItems: 'center',
    backgroundColor: '#EEF4E9',
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 14,
    padding: 14,
  },
  scanProgressCopy: { flex: 1, marginLeft: 10 },
  scanProgressTitle: { color: '#284B3D', fontSize: 13, fontWeight: '800' },
  scanProgressText: { color: '#65776E', fontSize: 10, marginTop: 2 },
  cancelScanButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  cancelScanText: { color: '#8C4B42', fontSize: 12, fontWeight: '700' },
  scanError: { backgroundColor: '#FFEAE7', marginHorizontal: 20, marginTop: 14, padding: 14 },
  scanErrorTitle: { color: '#8E3E36', fontSize: 13, fontWeight: '800' },
  scanErrorText: { color: '#9A5B54', fontSize: 11, lineHeight: 17, marginTop: 3 },
  previewActions: { flexDirection: 'row', gap: 12, padding: 20 },
  outlineButton: { alignItems: 'center', borderColor: '#D9E965', borderRadius: 14, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 52 },
  outlineButtonText: { color: '#D9E965', fontSize: 15, fontWeight: '700' },
  saveButton: { alignItems: 'center', backgroundColor: '#D9E965', borderRadius: 14, flex: 1.25, justifyContent: 'center', minHeight: 52 },
  saveButtonText: { color: '#1A3328', fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
