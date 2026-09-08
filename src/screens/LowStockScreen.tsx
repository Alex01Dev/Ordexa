import React, { useCallback, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { productRepository } from '../database/productRepository';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

type Props = NativeStackScreenProps<RootStackParamList, 'LowStock'>;

export const LowStockScreen = ({ navigation }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);

  useFocusEffect(
    useCallback(() => {
      setProducts(productRepository.getLowStock());
    }, [])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay productos con stock bajo</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});