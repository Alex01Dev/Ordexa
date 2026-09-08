import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Product } from '../types';
import { StockBadge } from './StockBadge';

interface Props {
  product: Product;
  onPress: () => void;
}

export const ProductCard = ({ product, onPress }: Props) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.sku}>SKU: {product.sku}</Text>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      </View>
      <StockBadge stock={product.stock} minStock={product.minStock} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sku: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  price: { fontSize: 14, fontWeight: '600', color: '#111827', marginTop: 4 },
});