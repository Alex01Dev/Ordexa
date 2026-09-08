import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ProductListScreen } from '../screens/ProductListScreen';
import { ProductFormScreen } from '../screens/ProductFormScreen';
import { ProductDetailScreen } from '../screens/ProductDetailScreen';
import { SaleScreen } from '../screens/SaleScreen';
import { LowStockScreen } from '../screens/LowStockScreen';
import { ScannerScreen } from '../screens/ScannerScreen';
import { RestockScreen } from '../screens/RestockScreen';

import { Product, MovementType } from '../types';

export type RootStackParamList = {
  ProductList: undefined;

  ProductForm: {
    product?: Product;
    prefill?: {
      sku: string;
      name?: string;
      category?: string;
      imageUrl?: string;
    };
  } | undefined;

  ProductDetail: {
    productId: string;
    openMovementModal?: boolean;
    presetMovementType?: MovementType;
  };

  LowStock: undefined;

  Scanner: {
    mode: 'IN' | 'SALE_ITEM' | 'RESTOCK';
  };

  Sale: undefined;

  Restock: {
    productId?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="ProductList">

      <Stack.Screen
        name="ProductList"
        component={ProductListScreen}
        options={{ title: 'Ordexa · Productos' }}
      />

      <Stack.Screen
        name="ProductForm"
        component={ProductFormScreen}
        options={({ route }) => ({
          title: route.params?.product
            ? 'Editar producto'
            : 'Nuevo producto',
        })}
      />

      <Stack.Screen
        name="Scanner"
        component={ScannerScreen}
        options={({ route }) => ({
          title:
            route.params.mode === 'SALE_ITEM'
              ? 'Escanear producto'
              : route.params.mode === 'RESTOCK'
                ? 'Escanear reabastecimiento'
                : 'Escanear entrada',
          presentation: 'fullScreenModal',
        })}
      />

      <Stack.Screen
        name="Sale"
        component={SaleScreen}
        options={{ title: 'Venta en curso' }}
      />

      <Stack.Screen
        name="Restock"
        component={RestockScreen}
        options={{ title: 'Reabastecimiento' }}
      />

      <Stack.Screen
        name="ProductDetail"
        component={ProductDetailScreen}
        options={{ title: 'Detalle del producto' }}
      />

      <Stack.Screen
        name="LowStock"
        component={LowStockScreen}
        options={{ title: 'Stock bajo' }}
      />

    </Stack.Navigator>
  );
};