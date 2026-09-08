import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { productRepository } from '../database/productRepository';
import { inventoryRepository } from '../database/inventoryRepository';
import { Product } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Restock'>;

export const RestockScreen = ({ navigation }: Props) => {

    // ==================================================
    // PRODUCTO SELECCIONADO
    // ==================================================

    const [selectedProduct, setSelectedProduct] =
        useState<Product | null>(null);

    const [quantity, setQuantity] = useState('');

    // ==================================================
    // BÚSQUEDA
    // ==================================================

    const [searchVisible, setSearchVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);

    // ==================================================
    // ABRIR BÚSQUEDA
    // ==================================================

    const openProductSearch = () => {
        setSearch('');
        setProducts(productRepository.getAll());
        setSearchVisible(true);
    };

    // ==================================================
    // BUSCAR PRODUCTO
    // ==================================================

    const handleSearch = (text: string) => {
        setSearch(text);

        const results = productRepository.getAll(text);
        setProducts(results);
    };

    // ==================================================
    // SELECCIONAR PRODUCTO
    // ==================================================

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setQuantity('');

        setSearchVisible(false);
        setSearch('');
        setProducts([]);
    };

    // ==================================================
    // REABASTECER
    // ==================================================

    const handleRestock = () => {
        if (!selectedProduct) {
            Alert.alert(
                'Producto no seleccionado',
                'Selecciona un producto antes de continuar.'
            );
            return;
        }

        const amount = Number(quantity);

        if (!quantity.trim() || isNaN(amount) || amount <= 0) {
            Alert.alert(
                'Cantidad inválida',
                'Ingresa una cantidad mayor a cero.'
            );
            return;
        }

        if (!Number.isInteger(amount)) {
            Alert.alert(
                'Cantidad inválida',
                'La cantidad debe ser un número entero.'
            );
            return;
        }

        try {
            inventoryRepository.createMovement(
                selectedProduct.id,
                'IN',
                amount,
                'Reabastecimiento'
            );

            const newStock = selectedProduct.stock + amount;

            Alert.alert(
                'Reabastecimiento exitoso',
                `${selectedProduct.name}\n\n` +
                `Stock anterior: ${selectedProduct.stock}\n` +
                `Cantidad agregada: ${amount}\n` +
                `Nuevo stock: ${newStock}`,
                [
                    {
                        text: 'Listo',
                        onPress: () => {
                            setSelectedProduct(null);
                            setQuantity('');
                        },
                    },
                ]
            );

        } catch (error: any) {
            Alert.alert(
                'Error al reabastecer',
                error.message || 'No se pudo realizar el reabastecimiento.'
            );
        }
    };

    // ==================================================
    // ESCANEAR
    // ==================================================

    const handleScan = () => {
        navigation.navigate('Scanner', {
            mode: 'RESTOCK',
        });
    };

    // ==================================================
    // RENDER
    // ==================================================

    return (
        <View style={styles.container}>

            {/* ==================================================
                ENCABEZADO
            ================================================== */}

            <View style={styles.header}>
                <Text style={styles.title}>
                    Reabastecimiento
                </Text>

                <Text style={styles.subtitle}>
                    Agrega existencias a un producto del inventario.
                </Text>
            </View>

            {/* ==================================================
                BOTONES DE BÚSQUEDA
            ================================================== */}

            <View style={styles.actionButtons}>

                <TouchableOpacity
                    style={styles.scanButton}
                    onPress={handleScan}
                >
                    <Text style={styles.scanButtonText}>
                        📷 Escanear producto
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={openProductSearch}
                >
                    <Text style={styles.searchButtonText}>
                        🔎 Buscar producto
                    </Text>
                </TouchableOpacity>

            </View>

            {/* ==================================================
                PRODUCTO SELECCIONADO
            ================================================== */}

            {selectedProduct ? (

                <View style={styles.selectedContainer}>

                    <View style={styles.selectedHeader}>

                        <View style={styles.selectedInfo}>

                            <Text style={styles.selectedLabel}>
                                Producto seleccionado
                            </Text>

                            <Text style={styles.selectedName}>
                                {selectedProduct.name}
                            </Text>

                            <Text style={styles.selectedCategory}>
                                {selectedProduct.category ?? 'Sin categoría'}
                            </Text>

                            <Text style={styles.selectedSku}>
                                {selectedProduct.sku ?? 'Sin código'}
                            </Text>

                        </View>

                        <TouchableOpacity
                            style={styles.changeProductButton}
                            onPress={() => {
                                setSelectedProduct(null);
                                setQuantity('');
                            }}
                        >
                            <Text style={styles.changeProductText}>
                                Cambiar
                            </Text>
                        </TouchableOpacity>

                    </View>

                    {/* STOCK ACTUAL */}

                    <View style={styles.stockContainer}>

                        <Text style={styles.stockLabel}>
                            Stock actual
                        </Text>

                        <Text style={styles.stockValue}>
                            {selectedProduct.stock}
                        </Text>

                    </View>

                    {/* CANTIDAD */}

                    <Text style={styles.quantityLabel}>
                        Cantidad a agregar
                    </Text>

                    <TextInput
                        style={styles.quantityInput}
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType="number-pad"
                        placeholder="Ej. 10"
                        placeholderTextColor="#9CA3AF"
                    />

                    {/* NUEVO STOCK */}

                    {quantity.trim() !== '' &&
                        Number(quantity) > 0 &&
                        Number.isInteger(Number(quantity)) && (
                            <View style={styles.newStockContainer}>

                                <Text style={styles.newStockLabel}>
                                    Nuevo stock
                                </Text>

                                <Text style={styles.newStockValue}>
                                    {selectedProduct.stock +
                                        Number(quantity)}
                                </Text>

                            </View>
                        )}

                    {/* BOTÓN REABASTECER */}

                    <TouchableOpacity
                        style={styles.restockButton}
                        onPress={handleRestock}
                    >
                        <Text style={styles.restockButtonText}>
                            📦 Reabastecer producto
                        </Text>
                    </TouchableOpacity>

                </View>

            ) : (

                /* ==================================================
                   ESTADO SIN PRODUCTO
                ================================================== */

                <View style={styles.emptyContainer}>

                    <Text style={styles.emptyIcon}>
                        📦
                    </Text>

                    <Text style={styles.emptyTitle}>
                        Selecciona un producto
                    </Text>

                    <Text style={styles.emptyText}>
                        Escanea un código de barras o busca un producto
                        por nombre o categoría para comenzar.
                    </Text>

                </View>
            )}

            {/* ==================================================
                MODAL BUSCAR PRODUCTO
            ================================================== */}

            <Modal
                visible={searchVisible}
                animationType="slide"
                transparent
                onRequestClose={() => {
                    setSearchVisible(false);
                }}
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContainer}>

                        {/* HEADER */}

                        <View style={styles.modalHeader}>

                            <View>
                                <Text style={styles.modalTitle}>
                                    Buscar producto
                                </Text>

                                <Text style={styles.modalSubtitle}>
                                    Nombre, categoría o código
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    setSearchVisible(false);
                                    setSearch('');
                                    setProducts([]);
                                }}
                            >
                                <Text style={styles.closeButton}>
                                    ✕
                                </Text>
                            </TouchableOpacity>

                        </View>

                        {/* BUSCADOR */}

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Nombre o categoría..."
                            placeholderTextColor="#9CA3AF"
                            value={search}
                            onChangeText={handleSearch}
                            autoFocus
                        />

                        {/* LISTA */}

                        <FlatList
                            data={products}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={{
                                paddingBottom: 20,
                            }}
                            ListEmptyComponent={
                                <Text style={styles.noResults}>
                                    No se encontraron productos.
                                </Text>
                            }
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.productResult}
                                    onPress={() =>
                                        handleSelectProduct(item)
                                    }
                                    activeOpacity={0.7}
                                >

                                    <View
                                        style={
                                            styles.productResultInfo
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.productResultName
                                            }
                                        >
                                            {item.name}
                                        </Text>

                                        <Text
                                            style={
                                                styles.productResultCategory
                                            }
                                        >
                                            {item.category ??
                                                'Sin categoría'}
                                        </Text>

                                        <Text
                                            style={
                                                styles.productResultSku
                                            }
                                        >
                                            {item.sku ??
                                                'Sin código'}
                                        </Text>

                                    </View>

                                    <View
                                        style={
                                            styles.productResultRight
                                        }
                                    >

                                        <Text
                                            style={
                                                styles.productResultStock
                                            }
                                        >
                                            Stock: {item.stock}
                                        </Text>

                                        <Text
                                            style={
                                                styles.productResultPrice
                                            }
                                        >
                                            ${item.price.toFixed(2)}
                                        </Text>

                                    </View>

                                </TouchableOpacity>
                            )}
                        />

                    </View>

                </View>

            </Modal>

        </View>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        padding: 16,
    },

    header: {
        marginBottom: 20,
    },

    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },

    subtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 5,
    },

    actionButtons: {
        gap: 10,
    },

    scanButton: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },

    scanButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },

    searchButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },

    searchButtonText: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '700',
    },

    selectedContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 18,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    selectedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    selectedInfo: {
        flex: 1,
    },

    selectedLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 5,
    },

    selectedName: {
        fontSize: 19,
        fontWeight: '800',
        color: '#111827',
    },

    selectedCategory: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
    },

    selectedSku: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 3,
    },

    changeProductButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },

    changeProductText: {
        color: '#2563EB',
        fontWeight: '700',
    },

    stockContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 20,
    },

    stockLabel: {
        fontSize: 13,
        color: '#6B7280',
    },

    stockValue: {
        fontSize: 30,
        fontWeight: '800',
        color: '#111827',
        marginTop: 3,
    },

    quantityLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '700',
        marginBottom: 7,
    },

    quantityInput: {
        height: 54,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 20,
        color: '#111827',
        backgroundColor: '#fff',
    },

    newStockContainer: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 14,
    },

    newStockLabel: {
        fontSize: 13,
        color: '#047857',
        fontWeight: '600',
    },

    newStockValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#059669',
        marginTop: 2,
    },

    restockButton: {
        backgroundColor: '#059669',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },

    restockButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '800',
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 30,
    },

    emptyIcon: {
        fontSize: 48,
        marginBottom: 14,
    },

    emptyTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 7,
    },

    emptyText: {
        textAlign: 'center',
        color: '#6B7280',
        lineHeight: 21,
    },

    // ==================================================
    // MODAL
    // ==================================================

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
    },

    modalContainer: {
        backgroundColor: '#F9FAFB',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        padding: 16,
    },

    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },

    modalSubtitle: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 3,
    },

    closeButton: {
        fontSize: 22,
        color: '#6B7280',
        padding: 4,
    },

    searchInput: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 15,
        color: '#111827',
        marginBottom: 12,
    },

    noResults: {
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 30,
    },

    productResult: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    productResultInfo: {
        flex: 1,
    },

    productResultName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#111827',
    },

    productResultCategory: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 3,
    },

    productResultSku: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },

    productResultRight: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },

    productResultStock: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '600',
    },

    productResultPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
        marginTop: 4,
    },
});