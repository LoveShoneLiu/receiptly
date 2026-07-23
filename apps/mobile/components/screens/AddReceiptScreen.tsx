import { CameraView, useCameraPermissions } from 'expo-camera';
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

type AddReceiptScreenProps = {
  onScanComplete: (data: ReceiptScanData) => void;
};

type SelectedReceiptImage = {
  fileName: string;
  mimeType: string;
  source: 'camera' | 'library';
  uri: string;
};

const getImageMimeType = (fileName: string | null | undefined) => {
  const normalizedName = fileName?.toLowerCase() ?? '';
  if (normalizedName.endsWith('.png')) return 'image/png';
  if (normalizedName.endsWith('.heic') || normalizedName.endsWith('.heif')) return 'image/heic';
  if (normalizedName.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
};

export function AddReceiptScreen({ onScanComplete }: AddReceiptScreenProps) {
  const cameraRef = useRef<CameraView>(null);
  const scanControllerRef = useRef<AbortController | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedReceiptImage | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => () => scanControllerRef.current?.abort(), []);

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }

    setCameraOpen(true);
  };

  const captureReceipt = async () => {
    if (!cameraRef.current || isCapturing) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) {
        setSelectedImage({
          fileName: `receipt-${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          source: 'camera',
          uri: photo.uri,
        });
        setScanError(null);
      }
    } catch {
      Alert.alert('拍摄失败', '无法保存照片，请重试或选择手动录入。');
    } finally {
      setIsCapturing(false);
    }
  };

  const pickReceiptFromLibrary = async () => {
    if (isPicking || isScanning) return;

    setIsPicking(true);
    setScanError(null);

    try {
      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        Alert.alert(
          '需要相册权限',
          libraryPermission.canAskAgain
            ? '请允许 receiptly 访问相册，以便选择小票图片。'
            : '相册权限已关闭，请前往系统设置为 receiptly 开启相册权限。',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        mediaTypes: ['images'],
        quality: 1,
      });
      const asset = result.canceled ? null : result.assets[0];

      if (asset?.uri) {
        const fallbackFileName = `receipt-${Date.now()}.jpg`;
        const fileName = asset.fileName ?? fallbackFileName;
        setCameraOpen(false);
        setSelectedImage({
          fileName,
          mimeType: asset.mimeType ?? getImageMimeType(fileName),
          source: 'library',
          uri: asset.uri,
        });
      }
    } catch {
      Alert.alert('无法打开相册', '请选择其他方式添加小票，或稍后重试。');
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
        fileName: selectedImage.fileName,
        mimeType: selectedImage.mimeType,
        signal: controller.signal,
      });
      onScanComplete(data);
    } catch (error) {
      if (controller.signal.aborted) return;
      setScanError(error instanceof ReceiptApiError
        ? error.message
        : '识别失败，请重试或使用手动录入。');
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
          accessibilityLabel={selectedImage.source === 'camera' ? '刚拍摄的小票预览' : '从相册选择的小票预览'}
          source={{ uri: selectedImage.uri }}
          style={styles.previewImage}
        />
        {isScanning && (
          <View accessibilityRole="alert" style={styles.scanProgress}>
            <ActivityIndicator color="#315D49" size="small" />
            <View style={styles.scanProgressCopy}>
              <Text style={styles.scanProgressTitle}>正在识别小票</Text>
              <Text style={styles.scanProgressText}>图片只用于本次识别，请稍候。</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={cancelScan} style={styles.cancelScanButton}>
              <Text style={styles.cancelScanText}>取消</Text>
            </Pressable>
          </View>
        )}
        {scanError && (
          <View accessibilityRole="alert" style={styles.scanError}>
            <Text style={styles.scanErrorTitle}>未能完成识别</Text>
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
              {selectedImage.source === 'camera' ? '重新拍摄' : '重新选择'}
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
            <Text style={styles.saveButtonText}>{scanError ? '重新识别' : '识别并检查'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (cameraOpen && permission?.granted) {
    return (
      <View style={styles.scannerScreen}>
        <CameraView ref={cameraRef} facing="back" style={styles.camera}>
          <View style={styles.cameraOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.cameraHint}>将小票完整放入框内，避免反光和阴影</Text>
          </View>
        </CameraView>
        <View style={styles.cameraControls}>
          <Pressable accessibilityRole="button" onPress={() => setCameraOpen(false)} style={styles.cameraTextButton}>
            <Text style={styles.cameraTextButtonLabel}>取消</Text>
          </Pressable>
          <Pressable
            accessibilityLabel="拍摄小票"
            accessibilityRole="button"
            disabled={isCapturing}
            onPress={captureReceipt}
            style={({ pressed }) => [styles.shutterOuter, pressed && styles.pressed]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.cameraControlSpacer} />
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>
        <Text style={styles.eyebrow}>新建记录</Text>
        <Text style={styles.title}>添加小票</Text>
        <Text style={styles.pageDescription}>扫描结果只是候选内容，保存后仍需逐项检查和确认。</Text>
      </View>

      <View style={styles.scanCard}>
        <View style={styles.scanIconCircle}>
          <Text style={styles.scanIcon}>⌗</Text>
        </View>
        <Text style={styles.scanTitle}>扫描小票</Text>
        <Text style={styles.scanDescription}>
          使用相机拍摄或从相册选择小票。请先遮挡会员号和支付识别信息。
        </Text>
        {!permission?.granted && permission?.canAskAgain === false && (
          <Text accessibilityRole="alert" style={styles.permissionError}>
            相机权限已关闭，请前往系统设置为 receiptly 开启相机权限。
          </Text>
        )}
        <Pressable
          accessibilityHint="请求相机权限并打开扫描界面"
          accessibilityRole="button"
          disabled={permission?.canAskAgain === false}
          onPress={openScanner}
          style={({ pressed }) => [
            styles.primaryButton,
            permission?.canAskAgain === false && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>打开相机扫描</Text>
        </Pressable>
        <Pressable
          accessibilityHint="打开系统相册并选择一张小票图片"
          accessibilityRole="button"
          disabled={isPicking}
          onPress={pickReceiptFromLibrary}
          style={({ pressed }) => [
            styles.libraryButton,
            isPicking && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          {isPicking
            ? <ActivityIndicator color="#315D49" size="small" />
            : <Text style={styles.libraryButtonText}>从相册选择小票</Text>}
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => Alert.alert('手动录入', '手动录入表单将在下一步实现。')}
        style={({ pressed }) => [styles.manualCard, pressed && styles.pressed]}
      >
        <View>
          <Text style={styles.manualTitle}>手动录入</Text>
          <Text style={styles.manualText}>相机或识别不可用时，仍可手动创建小票。</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
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
  permissionError: { color: '#A13D35', fontSize: 13, lineHeight: 19, marginTop: 14, textAlign: 'center' },
  primaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: '#D9E965', borderRadius: 16, justifyContent: 'center', marginTop: 20, minHeight: 54 },
  primaryButtonText: { color: '#1A3328', fontSize: 16, fontWeight: '700' },
  libraryButton: { alignItems: 'center', alignSelf: 'stretch', borderColor: '#B8C5BE', borderRadius: 16, borderWidth: 1, justifyContent: 'center', marginTop: 12, minHeight: 54 },
  libraryButtonText: { color: '#315D49', fontSize: 16, fontWeight: '700' },
  disabledButton: { opacity: 0.45 },
  manualCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E6EAE4', borderRadius: 18, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 88, padding: 18 },
  manualTitle: { color: '#263C33', fontSize: 16, fontWeight: '700' },
  manualText: { color: '#65786F', fontSize: 13, marginTop: 5, maxWidth: 270 },
  chevron: { color: '#71847B', fontSize: 28 },
  scannerScreen: { backgroundColor: '#101613', flex: 1 },
  camera: { flex: 1 },
  cameraOverlay: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  scanFrame: { aspectRatio: 0.62, borderColor: '#D9E965', borderRadius: 16, borderWidth: 3, maxHeight: '78%', width: '82%' },
  cameraHint: { backgroundColor: 'rgba(16, 22, 19, 0.78)', borderRadius: 12, color: '#FFFFFF', fontSize: 14, marginTop: 20, overflow: 'hidden', paddingHorizontal: 14, paddingVertical: 10, textAlign: 'center' },
  cameraControls: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 112, paddingHorizontal: 30 },
  cameraTextButton: { justifyContent: 'center', minHeight: 48, minWidth: 56 },
  cameraTextButtonLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  cameraControlSpacer: { width: 56 },
  shutterOuter: { alignItems: 'center', borderColor: '#FFFFFF', borderRadius: 38, borderWidth: 4, height: 76, justifyContent: 'center', width: 76 },
  shutterInner: { backgroundColor: '#FFFFFF', borderRadius: 29, height: 58, width: 58 },
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
