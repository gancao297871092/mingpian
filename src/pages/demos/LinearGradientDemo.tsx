import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

export default function LinearGradientDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>线性渐变</Text>
        <Text style={styles.desc}>react-native-linear-gradient · 多种渐变效果</Text>

        <Text style={styles.sectionTitle}>垂直渐变</Text>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.cardText}>#4facfe → #00f2fe</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>对角渐变</Text>
        <LinearGradient
          colors={['#f093fb', '#f5576c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <Text style={styles.cardText}>#f093fb → #f5576c</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>多色渐变 + locations</Text>
        <LinearGradient
          colors={['#f6d365', '#fda085', '#f5576c']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          locations={[0, 0.5, 1]}
          style={styles.card}
        >
          <Text style={styles.cardText}>三色横向渐变</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>半透明叠加</Text>
        <View style={styles.overlayBox}>
          <View style={styles.overlayBackground} />
          <LinearGradient
            colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0)']}
            style={styles.overlay}
          >
            <Text style={styles.overlayText}>底部渐隐遮罩</Text>
          </LinearGradient>
        </View>

        <Text style={styles.sectionTitle}>圆角渐变按钮</Text>
        <LinearGradient
          colors={['#11998e', '#38ef7d']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>渐变按钮</Text>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 8, marginBottom: 8 },
  card: { height: 120, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  cardText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  overlayBox: { height: 160, borderRadius: 16, overflow: 'hidden' },
  overlayBackground: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#e11d48',
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'flex-end', padding: 16,
  },
  overlayText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  button: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
