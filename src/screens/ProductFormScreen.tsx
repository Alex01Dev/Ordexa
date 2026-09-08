import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ToastAndroid,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { STORE_CATEGORIES, StoreCategory } from '../constants/categories';
import { RootStackParamList } from '../navigation/AppNavigator';
import { productRepository } from '../database/productRepository';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

export const ProductFormScreen = ({ navigation, route }: Props) => {
    const editing = route.params?.product;
    const prefill = route.params?.prefill;

    const [name, setName] = useState(editing?.name ?? prefill?.name ?? '');
    const [sku, setSku] = useState(editing?.sku ?? prefill?.sku ?? '');
    const [category, setCategory] = useState<StoreCategory | ''>(
        (editing?.category as StoreCategory) ?? prefill?.category ?? ''
    );
    const [price, setPrice] = useState(editing?.price?.toString() ?? '');
    const [cost, setCost] = useState(editing?.cost?.toString() ?? '');
    const [stock, setStock] = useState(editing?.stock?.toString() ?? '0');
    const [minStock, setMinStock] = useState(
        editing?.minStock?.toString() ?? '0'
    );

    const handleSave = () => {
        // Solo nombre y precio son obligatorios
        if (!name.trim() || !price.trim()) {
            Alert.alert(
                'Faltan datos',
                'Nombre y precio son obligatorios'
            );
            return;
        }

        try {
            const input = {
                name: name.trim(),

                // Código de barras opcional
                sku: sku.trim() || undefined,

                category: category.trim() || undefined,
                price: parseFloat(price),
                cost: cost ? parseFloat(cost) : undefined,
                stock: parseInt(stock, 10) || 0,
                minStock: parseInt(minStock, 10) || 0,
                imageUrl: prefill?.imageUrl,
            };

            if (editing) {
                productRepository.update(editing.id, input);

                ToastAndroid.show(
                    'Producto actualizado correctamente',
                    ToastAndroid.SHORT
                );
            } else {
                productRepository.create(input);

                ToastAndroid.show(
                    'Producto registrado correctamente',
                    ToastAndroid.SHORT
                );
            }

            navigation.navigate('ProductList');

        } catch (error: any) {
            Alert.alert(
                'Error',
                error.message ?? 'No se pudo guardar el producto'
            );
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.label}>Nombre *</Text>

            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Coca-Cola 600ml"
            />

            <Text style={styles.label}>Código de barras (opcional)</Text>

            <View style={styles.skuContainer}>
                <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={sku}
                    onChangeText={setSku}
                    placeholder="Ej. 7501234567890"
                    editable={!editing}
                    keyboardType="number-pad"
                />

                {!editing && (
                    <TouchableOpacity
                        style={styles.scanIconBtn}
                        onPress={() =>
                            navigation.navigate('Scanner', { mode: 'IN' })
                        }
                    >
                        <Text style={{ fontSize: 20 }}>📷</Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text style={styles.label}>Categoría</Text>

            {prefill && (
                <Text style={styles.helperText}>
                    Categoría sugerida automáticamente, verifica que sea correcta.
                </Text>
            )}

            <View style={styles.chipsWrap}>
                {STORE_CATEGORIES.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[
                            styles.chip,
                            category === cat && styles.chipActive,
                        ]}
                        onPress={() => setCategory(cat)}
                    >
                        <Text
                            style={
                                category === cat
                                    ? styles.chipTextActive
                                    : styles.chipText
                            }
                        >
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>Precio de venta *</Text>

            <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="0.00"
            />

            <Text style={styles.label}>Costo</Text>

            <TextInput
                style={styles.input}
                value={cost}
                onChangeText={setCost}
                keyboardType="decimal-pad"
                placeholder="0.00"
            />

            <Text style={styles.label}>
                {editing ? 'Stock actual' : 'Stock inicial'}
            </Text>

            <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
            />

            <Text style={styles.label}>Stock mínimo (alerta)</Text>

            <Text style={styles.helperText}>
                Cuando el stock llegue a este número o menos, el producto
                aparecerá en "Stock bajo".
            </Text>

            <TextInput
                style={styles.input}
                value={minStock}
                onChangeText={setMinStock}
                keyboardType="number-pad"
            />

            <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
            >
                <Text style={styles.saveBtnText}>
                    {editing ? 'Guardar cambios' : 'Crear producto'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
    },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginTop: 12,
        marginBottom: 4,
    },

    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 10,
    },

    skuContainer: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },

    saveBtn: {
        backgroundColor: '#2563EB',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 40,
    },

    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    helperText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: -2,
        marginBottom: 6,
    },

    scanIconBtn: {
        padding: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
    },

    chipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },

    chip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#fff',
    },

    chipActive: {
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
    },

    chipText: {
        color: '#374151',
        fontSize: 13,
    },

    chipTextActive: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});
