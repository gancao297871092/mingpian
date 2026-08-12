import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { LinearGradientText } from 'react-native-linear-gradient-text';

export default function GradientTextDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>渐变文字</Text>
        <Text style={styles.desc}>react-native-linear-gradient-text · 基于 masked-view</Text>

        <View style={styles.card}>
          <LinearGradientText
            text="渐变文字标题"
            colors={['#f5576c', '#f093fb']}
            textStyle={styles.bigText}
          />
        </View>

        <View style={styles.card}>
          <LinearGradientText
            text="横向渐变 · 多色"
            colors={['#f6d365', '#fda085', '#f5576c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            textStyle={styles.mediumText}
          />
        </View>

        <View style={styles.card}>
          <LinearGradientText
            text="金色金属质感"
            colors={['#f5d020', '#f53803']}
            textStyle={styles.mediumText}
          />
        </View>

        <View style={styles.card}>
          <LinearGradientText
            text="small"
            colors={['#11998e', '#38ef7d']}
            textStyle={styles.smallText}
          />
          <LinearGradientText
            text="渐变同样适用于多行文字与数字 123456"
            colors={['#4facfe', '#00f2fe']}
            textStyle={styles.bodyText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  desc: { fontSize: 13, color: '#999', marginBottom: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 12,
    alignItems: 'center', gap: 8,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }, shadowRadius: 4,
  },
  bigText: { fontSize: 36, fontWeight: '900' },
  mediumText: { fontSize: 24, fontWeight: '800' },
  smallText: { fontSize: 16, fontWeight: '700' },
  bodyText: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
