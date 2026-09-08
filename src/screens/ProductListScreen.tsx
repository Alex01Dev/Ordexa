import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { productRepository } from '../database/productRepository';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductList'>;

export const ProductListScreen = ({ navigation }: Props) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');

  const loadProducts = useCallback((query?: string) => {
    setProducts(productRepository.getAll(query));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts(search);
    }, [loadProducts, search])
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar por nombre, categoría o QR..."
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          loadProducts(text);
        }}
      />

      <TouchableOpacity
        style={[styles.actionBtn, styles.saleBtn]}
        onPress={() => navigation.navigate('Sale')}
      >
        <Text style={styles.actionIcon}>💰</Text>
        <Text style={styles.actionLabel}>Vender producto</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionBtn, styles.restockBtn]}
        onPress={() => navigation.navigate('Restock', {})}
      >
        <Text style={styles.actionIcon}>📦</Text>
        <Text style={styles.actionLabel}>Reabastecer producto</Text>
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.newBtn, styles.halfBtn]}
          onPress={() => navigation.navigate('ProductForm')}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={styles.actionLabel}>Nuevo producto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.lowStockBtn, styles.halfBtn]}
          onPress={() => navigation.navigate('LowStock')}
        >
          <Text style={styles.actionIcon}>⚠️</Text>
          <Text style={styles.actionLabel}>Stock bajo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onPress={() =>
              navigation.navigate('ProductDetail', {
                productId: item.id,
              })
            }
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No hay productos registrados todavía.
          </Text>
        }
        contentContainerStyle={{ paddingTop: 4 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F9FAFB',
  },

  search: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },

  row: {
    flexDirection: 'row',
    gap: 10,
  },

  halfBtn: {
    flex: 1,
  },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 2,
  },

  actionIcon: {
    fontSize: 22,
    marginRight: 8,
  },

  actionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  saleBtn: {
    backgroundColor: '#DC2626',
  },

  restockBtn: {
    backgroundColor: '#16A34A',
  },

  newBtn: {
    backgroundColor: '#2563EB',
  },

  lowStockBtn: {
    backgroundColor: '#D97706',
  },

  empty: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 40,
  },
});