import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { productRepository } from '../database/productRepository';
import { lookupBarcode } from '../services/barcodeLookup';
import { useSaleTicket } from '../context/SaleTicketContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export const ScannerScreen = ({ navigation, route }: Props) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);

  const lockedRef = useRef(false);

  const { addProduct } = useSaleTicket();

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permText}>
          Ordexa necesita acceso a la cámara para escanear códigos de barras.
        </Text>

        <TouchableOpacity
          style={styles.permBtn}
          onPress={requestPermission}
        >
          <Text style={styles.permBtnText}>Dar permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleScan = async ({ data: code }: { data: string }) => {
    if (lockedRef.current) return;

    lockedRef.current = true;
    setLoading(true);

    const { mode } = route.params;

    const existing = productRepository.getBySku(code);

    if (mode === 'SALE_ITEM') {
      setLoading(false);

      if (!existing) {
        Alert.alert(
          'Producto no encontrado',
          'Este código no está registrado en tu inventario. Regístralo primero desde "Nuevo producto".',
          [
            {
              text: 'Entendido',
              onPress: () => navigation.goBack(),
            },
          ]
        );

        return;
      }

      const result = addProduct(existing);

      if (result === 'no-stock') {
        Alert.alert(
          'Sin stock suficiente',
          `Ya no hay más unidades disponibles de "${existing.name}".`,
          [
            {
              text: 'Entendido',
              onPress: () => navigation.goBack(),
            },
          ]
        );

        return;
      }

      navigation.goBack();
      return;
    }

    if (mode === 'RESTOCK') {
      setLoading(false);

      if (!existing) {
        Alert.alert(
          'Producto no encontrado',
          'Este código no está registrado en tu inventario. Registra primero el producto antes de reabastecerlo.',
          [
            {
              text: 'Entendido',
              onPress: () => navigation.goBack(),
            },
          ]
        );

        return;
      }

      navigation.replace('Restock', {
        productId: existing.id,
      });

      return;
    }

    if (existing) {
      setLoading(false);

      navigation.replace('ProductDetail', {
        productId: existing.id,
        openMovementModal: true,
        presetMovementType: mode,
      });

      return;
    }

    const info = await lookupBarcode(code);

    setLoading(false);

    Alert.alert(
      'Producto no encontrado',
      'Este código no está registrado todavía. ¿Quieres darlo de alta como producto nuevo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => navigation.goBack(),
        },
        {
          text: 'Dar de alta',
          onPress: () => {
            navigation.replace('ProductForm', {
              prefill: {
                sku: code,
                name: info?.name,
                category: info?.category,
                imageUrl: info?.imageUrl,
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
          ],
        }}
        onBarcodeScanned={handleScan}
      />

      <View style={styles.overlay}>
        <View style={styles.frame} />

        <Text style={styles.hint}>
          {loading
            ? 'Procesando...'
            : route.params.mode === 'RESTOCK'
              ? 'Escanea el producto para reabastecerlo'
              : 'Apunta al código de barras'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  permText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#374151',
  },

  permBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  permBtnText: {
    color: '#fff',
    fontWeight: '600',
  },

  overlay: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  frame: {
    width: 250,
    height: 120,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
  },

  hint: {
    color: '#fff',
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
});