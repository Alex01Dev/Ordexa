import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { productRepository } from '../database/productRepository';
import { lookupBarcode } from '../services/barcodeLookup';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export const ScannerScreen = ({ navigation, route }: Props) => {
    const [permission, requestPermission] = useCameraPermissions();
    const [locked, setLocked] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!permission) {
        return <View style={styles.center}><ActivityIndicator /></View>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.permText}>Ordexa necesita acceso a la cámara para escanear códigos de barras.</Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                    <Text style={styles.permBtnText}>Dar permiso</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleScan = async ({ data: code }: { data: string }) => {
        if (locked) return;
        setLocked(true);
        setLoading(true);

        const { mode } = route.params;
        const existing = productRepository.getBySku(code);

        if (mode === 'SALE_ITEM') {
            setLoading(false);
            if (!existing) {
                Alert.alert(
                    'Producto no encontrado',
                    'Este código no está registrado en tu inventario. Regístralo primero desde "Nuevo producto".',
                    [{ 
                        text: 'Entendido', 
                        onPress: () => {
                            setLocked(false);
                            navigation.goBack();
                        }
                    }]
                );
                return;
            }
            navigation.navigate('Sale', { scannedProduct: existing });
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
                    onPress: () => {
                        setLocked(false);
                        navigation.goBack();
                    } 
                },
                {
                    text: 'Dar de alta',
                    onPress: () => {
                        navigation.replace('ProductForm', {
                            prefill: { sku: code, name: info?.name, category: info?.category, imageUrl: info?.imageUrl },
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
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
                }}
                onBarcodeScanned={locked ? undefined : handleScan}
            />
            <View style={styles.overlay}>
                <View style={styles.frame} />
                <Text style={styles.hint}>
                    {loading ? 'Buscando información del producto...' : 'Apunta al código de barras'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    permText: { textAlign: 'center', marginBottom: 16, color: '#374151' },
    permBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    permBtnText: { color: '#fff', fontWeight: '600' },
    overlay: { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
    frame: { width: 850, height: 420, borderWidth: 2, borderColor: '#fff', borderRadius: 12, marginBottom: 16 },
    hint: { color: '#fff', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
});