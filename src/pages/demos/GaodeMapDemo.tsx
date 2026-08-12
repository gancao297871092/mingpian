import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  Cluster,
  ExpoGaodeMapModule,
  MapType,
  MapUI,
  MapView,
  Marker,
  type CameraPosition,
  type ClusterPoint,
  type LatLng,
  type MapViewRef,
} from 'expo-gaode-map';

const MAP_TYPE_OPTIONS = [
  { label: '标准', value: MapType.Standard },
  { label: '卫星', value: MapType.Satellite },
  { label: '夜间', value: MapType.Night },
  { label: '导航', value: MapType.Navi },
  { label: '公交', value: MapType.Bus },
];

const BEIJING_CENTER = { latitude: 39.90923, longitude: 116.397428 };

const CLUSTER_POINTS: ClusterPoint[] = (() => {
  const centers = [
    { latitude: 39.90923, longitude: 116.397428 },
    { latitude: 39.9844, longitude: 116.3152 },
    { latitude: 39.8622, longitude: 116.4533 },
    { latitude: 40.0422, longitude: 116.4433 },
  ];
  const points: ClusterPoint[] = [];
  centers.forEach((center, ci) => {
    const count = [18, 12, 7, 4][ci] ?? 4;
    for (let i = 0; i < count; i++) {
      points.push({
        latitude: center.latitude + (Math.random() - 0.5) * 0.06,
        longitude: center.longitude + (Math.random() - 0.5) * 0.06,
        properties: { id: `poi-${ci}-${i}`, title: `模拟POI ${ci}-${i}` },
      });
    }
  });
  return points;
})();

export default function GaodeMapDemo() {
  const mapRef = React.useRef<MapViewRef>(null);
  const currentZoomRef = React.useRef(12);
  const [privacyReady, setPrivacyReady] = React.useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);
  const [initializing, setInitializing] = React.useState(false);
  const [initialCamera, setInitialCamera] = React.useState<CameraPosition | null>(null);
  const [location, setLocation] = React.useState<LatLng | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [mapType, setMapType] = React.useState<MapType>(MapType.Standard);
  const [cameraInfo, setCameraInfo] = React.useState('等待地图事件...');
  const [cameraMoveCount, setCameraMoveCount] = React.useState(0);
  const [cameraIdleCount, setCameraIdleCount] = React.useState(0);
  const [showCluster, setShowCluster] = React.useState(true);

  const agreePrivacy = React.useCallback(async () => {
    try {
      setInitializing(true);
      ExpoGaodeMapModule.setPrivacyConfig({
        hasShow: true,
        hasContainsPrivacy: true,
        hasAgree: true,
        privacyVersion: '2026-03-13',
      });
      ExpoGaodeMapModule.initSDK({});
      const permission = await ExpoGaodeMapModule.requestLocationPermission();
      if (!permission.granted) {
        Alert.alert('提示', '未授予定位权限，地图仍可浏览但无法定位到当前');
      }
      setShowPrivacyModal(false);
      setPrivacyReady(true);
    } catch (error) {
      console.error('初始化失败:', error);
      const message = error instanceof Error ? error.message : '初始化失败';
      Alert.alert('初始化失败', message);
    } finally {
      setInitializing(false);
    }
  }, []);

  React.useEffect(() => {
    if (!privacyReady) {
      return;
    }
    let mounted = true;

    const bootstrap = async () => {
      try {
        ExpoGaodeMapModule.setLocatingWithReGeocode(false);

        const current = await ExpoGaodeMapModule.getCurrentLocation().catch(() => null);
        const target = current
          ? { latitude: current.latitude, longitude: current.longitude }
          : BEIJING_CENTER;

        if (!mounted) {
          return;
        }

        const zoom = current ? 16 : 12;
        currentZoomRef.current = zoom;

        setLocation(target);
        setInitialCamera({ target, zoom });
      } catch (error) {
        console.error('加载地图示例失败:', error);
        if (mounted) {
          currentZoomRef.current = 12;
          setLocation(BEIJING_CENTER);
          setInitialCamera({ target: BEIJING_CENTER, zoom: 12 });
        }
      }
    };

    const subscription = ExpoGaodeMapModule.addLocationListener((nextLocation) => {
      if (!mounted) {
        return;
      }
      setLocation({ latitude: nextLocation.latitude, longitude: nextLocation.longitude });
    });

    void bootstrap();

    return () => {
      mounted = false;
      subscription.remove();
      ExpoGaodeMapModule.stop();
      ExpoGaodeMapModule.stopUpdatingHeading();
    };
  }, [privacyReady]);

  function moveToLocation(target: LatLng, zoom: number) {
    currentZoomRef.current = zoom;
    setLocation(target);
    void mapRef.current?.moveCamera({ target, zoom }, 220);
  }

  function handleLocateMe() {
    try {
      moveToLocation(location ?? BEIJING_CENTER, location ? 16.5 : 12);
    } catch (error) {
      console.error('定位失败:', error);
    }
  }

  function handleStartLocation() {
    ExpoGaodeMapModule.start();
    ExpoGaodeMapModule.startUpdatingHeading();
    setIsLocating(true);
  }

  function handleStopLocation() {
    ExpoGaodeMapModule.stop();
    ExpoGaodeMapModule.stopUpdatingHeading();
    setIsLocating(false);
  }

  function handleZoom(delta: number) {
    const nextZoom = currentZoomRef.current + delta;
    currentZoomRef.current = nextZoom;
    void mapRef.current?.setZoom(nextZoom, true);
  }

  if (!privacyReady) {
    return (
      <View style={styles.loadingContainer}>
        <Pressable style={styles.primaryButton} onPress={() => setShowPrivacyModal(true)}>
          <Text style={styles.primaryButtonText}>同意隐私并初始化地图</Text>
        </Pressable>
        <Modal
          visible={showPrivacyModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPrivacyModal(false)}
        >
          <View style={styles.privacyModalBackdrop}>
            <View style={styles.privacyCard}>
              <Text style={styles.privacyTitle}>隐私保护提示</Text>
              <Text style={styles.privacyDesc}>
                为了使用地图展示与定位服务，我们会在你同意后调用高德地图 SDK。
              </Text>
              <View style={styles.privacyBtnRow}>
                <Pressable
                  style={[styles.privacyBtn, styles.privacyGhostBtn]}
                  onPress={() => setShowPrivacyModal(false)}
                  disabled={initializing}
                >
                  <Text style={styles.privacyGhostBtnText}>暂不同意</Text>
                </Pressable>
                <Pressable
                  style={[styles.privacyBtn, { backgroundColor: '#007AFF' }]}
                  onPress={agreePrivacy}
                  disabled={initializing}
                >
                  <Text style={styles.privacyBtnText}>
                    {initializing ? '正在初始化…' : '同意并进入地图'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (!initialCamera) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#2563eb" size="large" />
        <Text style={styles.loadingText}>正在准备地图...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialCameraPosition={initialCamera}
        myLocationEnabled
        myLocationButtonEnabled
        indoorViewEnabled
        buildingsEnabled
        labelsEnabled
        mapType={mapType}
        onLocation={({ nativeEvent }) => {
          setLocation({ latitude: nativeEvent.latitude, longitude: nativeEvent.longitude });
        }}
        onCameraMove={({ nativeEvent }) => {
          const zoom = nativeEvent.cameraPosition.zoom ?? 0;
          const target = nativeEvent.cameraPosition.target;
          if (Number.isFinite(zoom) && zoom > 0) {
            currentZoomRef.current = zoom;
          }
          setCameraMoveCount((previous) => previous + 1);
          setCameraInfo(
            `移动中 · 中心 ${target?.latitude?.toFixed(4) ?? '--'}, ${target?.longitude?.toFixed(4) ?? '--'} · 缩放 ${zoom.toFixed(2)}`
          );
        }}
        onCameraIdle={({ nativeEvent }) => {
          const zoom = nativeEvent.cameraPosition.zoom ?? 0;
          const target = nativeEvent.cameraPosition.target;
          if (Number.isFinite(zoom) && zoom > 0) {
            currentZoomRef.current = zoom;
          }
          setCameraIdleCount((previous) => previous + 1);
          setCameraInfo(
            `已停止 · 中心 ${target?.latitude?.toFixed(4) ?? '--'}, ${target?.longitude?.toFixed(4) ?? '--'} · 缩放 ${zoom.toFixed(2)}`
          );
        }}
        userLocationRepresentation={{ showsHeadingIndicator: true }}
      >
        {location ? (
          <Marker position={location} title="当前位置" pinColor="blue" cacheKey="gaode_map_current_location" />
        ) : null}

        {showCluster && (
          <Cluster
            points={CLUSTER_POINTS}
            radius={30}
            minClusterSize={1}
            clusterBuckets={[
              { minPoints: 1, backgroundColor: '#00BFFF', width: 36, height: 36, borderRadius: 18 },
              { minPoints: 5, backgroundColor: '#FFA500', width: 44, height: 44, borderRadius: 22 },
              { minPoints: 10, backgroundColor: '#FF4500', width: 52, height: 52, borderRadius: 26 },
            ]}
            clusterTextStyle={{ color: '#fff', fontSize: 14 }}
            onClusterPress={(e) => {
              const { count, pois } = e.nativeEvent;
              Alert.alert(
                '聚合点',
                `包含 ${count} 个点\n${
                  pois?.slice(0, 3).map((p) => (p.properties?.title as string) ?? p.properties?.id).join(', ') ?? ''
                }`
              );
            }}
          />
        )}

        <MapUI>
          <View pointerEvents="box-none" style={styles.overlayRoot}>
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>高德地图</Text>
              <Text style={styles.cardText}>{cameraInfo}</Text>
              <Text style={styles.cardMeta}>
                事件统计 · move {cameraMoveCount} / idle {cameraIdleCount}
              </Text>
              <Text style={styles.cardMeta}>
                当前模式 · {MAP_TYPE_OPTIONS.find((option) => option.value === mapType)?.label ?? '未知'}
              </Text>
            </View>

            <View style={styles.toolbar}>
              <Pressable style={styles.primaryButton} onPress={handleLocateMe}>
                <Text style={styles.primaryButtonText}>定位到当前</Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryButton, isLocating && styles.secondaryButtonActive]}
                onPress={isLocating ? handleStopLocation : handleStartLocation}
              >
                <Text style={styles.secondaryButtonText}>
                  {isLocating ? '停止连续定位' : '开始连续定位'}
                </Text>
              </Pressable>
              <View style={styles.zoomRow}>
                <Pressable style={styles.zoomButton} onPress={() => handleZoom(1)}>
                  <Text style={styles.zoomButtonText}>放大</Text>
                </Pressable>
                <Pressable style={styles.zoomButton} onPress={() => handleZoom(-1)}>
                  <Text style={styles.zoomButtonText}>缩小</Text>
                </Pressable>
              </View>
              <View style={styles.mapTypeRow}>
                {MAP_TYPE_OPTIONS.map((option) => {
                  const active = option.value === mapType;
                  return (
                    <Pressable
                      key={option.label}
                      style={[styles.mapTypeButton, active && styles.mapTypeButtonActive]}
                      onPress={() => setMapType(option.value)}
                    >
                      <Text style={[styles.mapTypeButtonText, active && styles.mapTypeButtonTextActive]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                style={[styles.secondaryButton, showCluster && styles.secondaryButtonActive]}
                onPress={() => setShowCluster((prev) => !prev)}
              >
                <Text style={styles.secondaryButtonText}>
                  {showCluster ? '隐藏三级聚合' : '显示三级聚合'}
                </Text>
              </Pressable>
            </View>
          </View>
        </MapUI>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  loadingContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#eff6ff', padding: 24,
  },
  loadingText: { marginTop: 12, color: '#1e3a8a', fontSize: 14, fontWeight: '600' },
  privacyModalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  privacyCard: {
    width: '100%', maxWidth: 420, backgroundColor: '#1F2937', borderRadius: 20, padding: 20, gap: 12,
  },
  privacyTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  privacyDesc: { fontSize: 15, lineHeight: 22, color: '#D1D5DB' },
  privacyBtn: {
    marginTop: 8, paddingVertical: 14, borderRadius: 14, paddingHorizontal: 16,
    alignItems: 'center', justifyContent: 'center', flex: 1,
  },
  privacyBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  privacyBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  privacyGhostBtn: { backgroundColor: '#374151' },
  privacyGhostBtnText: { color: '#E5E7EB', fontSize: 15, fontWeight: '700' },
  map: { flex: 1 },
  overlayRoot: {
    flex: 1, justifyContent: 'space-between', paddingTop: 10, paddingHorizontal: 16, paddingBottom: 28,
  },
  infoCard: {
    alignSelf: 'stretch', borderRadius: 20, padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.78)',
  },
  cardTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '800' },
  cardText: { marginTop: 8, color: '#e2e8f0', fontSize: 13, lineHeight: 20 },
  cardMeta: { marginTop: 8, color: '#93c5fd', fontSize: 12, lineHeight: 18 },
  toolbar: {
    borderRadius: 22, padding: 14, backgroundColor: 'rgba(255,255,255,0.92)', gap: 10,
  },
  primaryButton: {
    alignItems: 'center', borderRadius: 14, paddingVertical: 14, backgroundColor: '#2563eb',
  },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center', borderRadius: 14, paddingVertical: 14, backgroundColor: '#e2e8f0',
  },
  secondaryButtonActive: { backgroundColor: '#fee2e2' },
  secondaryButtonText: { color: '#0f172a', fontSize: 14, fontWeight: '700' },
  zoomRow: { flexDirection: 'row', gap: 10 },
  zoomButton: {
    flex: 1, alignItems: 'center', borderRadius: 14, paddingVertical: 12, backgroundColor: '#0f172a',
  },
  zoomButtonText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  mapTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mapTypeButton: {
    minWidth: 52, alignItems: 'center', borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1',
    paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#f8fafc',
  },
  mapTypeButtonActive: { borderColor: '#1d4ed8', backgroundColor: '#dbeafe' },
  mapTypeButtonText: { color: '#334155', fontSize: 12, fontWeight: '700' },
  mapTypeButtonTextActive: { color: '#1d4ed8' },
});
