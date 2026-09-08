import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  stock: number;
  minStock: number;
}

export const StockBadge = ({ stock, minStock }: Props) => {
  const isLow = stock <= minStock;
  return (
    <View style={[styles.badge, isLow ? styles.low : styles.ok]}>
      <Text style={styles.text}>{stock} en stock</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ok: { backgroundColor: '#DCFCE7' },
  low: { backgroundColor: '#FEE2E2' },
  text: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
});