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
import { inventoryRepository } from '../database/inventoryRepository';
import { productRepository } from '../database/productRepository';
import { Product } from '../types';
import { useSaleTicket } from '../context/SaleTicketContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Sale'>;

export const SaleScreen = ({ navigation }: Props) => {
    const {
        ticket,
        addProduct,
        changeQuantity,
        removeItem,
        clearTicket,
    } = useSaleTicket();

    const [searchVisible, setSearchVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<Product[]>([]);

    const [changeVisible, setChangeVisible] = useState(false);
    const [payment, setPayment] = useState('');

    const total = ticket.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const paymentAmount = Number(payment) || 0;
    const change = paymentAmount - total;

    const openProductSearch = () => {
        setSearch('');
        setProducts(productRepository.getAll());
        setSearchVisible(true);
    };

    const handleSearch = (text: string) => {
        setSearch(text);

        const results = productRepository.getAll(text);
        setProducts(results);
    };

    const handleAddProduct = (product: Product) => {
        if (product.stock <= 0) {
            Alert.alert(
                'Sin stock',
                'Este producto no tiene existencias disponibles.'
            );
            return;
        }

        const result = addProduct(product);

        if (result === 'no-stock') {
            Alert.alert(
                'Stock insuficiente',
                `No puedes agregar más unidades de "${product.name}".`
            );
            return;
        }

        setSearchVisible(false);
        setSearch('');
        setProducts([]);
    };

    const openChangeCalculator = () => {
        if (ticket.length === 0) {
            Alert.alert(
                'Ticket vacío',
                'Agrega al menos un producto antes de calcular el cambio.'
            );
            return;
        }

        setPayment('');
        setChangeVisible(true);
    };

    const closeChangeCalculator = () => {
        setPayment('');
        setChangeVisible(false);
    };

    const handleCancelSale = () => {
        if (ticket.length === 0) {
            navigation.goBack();
            return;
        }

        Alert.alert(
            'Cancelar venta',
            'Se perderán los productos agregados al ticket. ¿Continuar?',
            [
                {
                    text: 'No',
                    style: 'cancel',
                },
                {
                    text: 'Sí, cancelar',
                    style: 'destructive',
                    onPress: () => {
                        clearTicket();
                        navigation.goBack();
                    },
                },
            ]
        );
    };

    const handleConfirmSale = () => {
        if (ticket.length === 0) {
            Alert.alert(
                'Ticket vacío',
                'Agrega al menos un producto antes de cobrar.'
            );
            return;
        }

        try {
            ticket.forEach((item) => {
                inventoryRepository.createMovement(
                    item.productId,
                    'OUT',
                    item.quantity,
                    'Venta'
                );
            });

            const totalCobrado = total;

            clearTicket();

            Alert.alert(
                'Venta registrada',
                `Total cobrado: $${totalCobrado.toFixed(2)}`,
                [
                    {
                        text: 'Listo',
                        onPress: () => navigation.navigate('ProductList'),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert(
                'Error al registrar la venta',
                error.message
            );
        }
    };

    return (
        <View style={styles.container}>


            <View style={styles.actionButtons}>

                <TouchableOpacity
                    style={styles.scanBtn}
                    onPress={() =>
                        navigation.navigate('Scanner', {
                            mode: 'SALE_ITEM',
                        })
                    }
                >
                    <Text style={styles.scanBtnText}>
                        📷 Escanear producto
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.searchBtn}
                    onPress={openProductSearch}
                >
                    <Text style={styles.searchBtnText}>
                        🔎 Buscar producto
                    </Text>
                </TouchableOpacity>

            </View>


            <FlatList
                data={ticket}
                keyExtractor={(item) => item.productId}
                contentContainerStyle={{
                    paddingVertical: 10,
                    flexGrow: ticket.length === 0 ? 1 : 0,
                }}
                renderItem={({ item }) => (
                    <View style={styles.itemRow}>

                        <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>
                                {item.name}
                            </Text>

                            <Text style={styles.itemSku}>
                                {item.sku ?? 'Sin código'}
                            </Text>

                            <Text style={styles.itemPrice}>
                                ${item.price.toFixed(2)} c/u
                            </Text>
                        </View>

                        <View style={styles.qtyControls}>

                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() =>
                                    changeQuantity(item.productId, -1)
                                }
                            >
                                <Text style={styles.qtyBtnText}>
                                    −
                                </Text>
                            </TouchableOpacity>

                            <Text style={styles.qtyValue}>
                                {item.quantity}
                            </Text>

                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() =>
                                    changeQuantity(item.productId, 1)
                                }
                            >
                                <Text style={styles.qtyBtnText}>
                                    +
                                </Text>
                            </TouchableOpacity>

                        </View>

                        <Text style={styles.itemSubtotal}>
                            ${(item.price * item.quantity).toFixed(2)}
                        </Text>

                        <TouchableOpacity
                            onPress={() =>
                                removeItem(item.productId)
                            }
                            style={styles.deleteBtn}
                        >
                            <Text style={styles.deleteText}>
                                🗑️
                            </Text>
                        </TouchableOpacity>

                    </View>
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>

                        <Text style={styles.emptyIcon}>
                            🛒
                        </Text>

                        <Text style={styles.emptyTitle}>
                            Ticket vacío
                        </Text>

                        <Text style={styles.empty}>
                            Escanea un código o busca un producto por nombre
                            o categoría para comenzar la venta.
                        </Text>

                    </View>
                }
            />

            <View style={styles.footer}>

                <View style={styles.totalRow}>

                    <Text style={styles.totalLabel}>
                        Total
                    </Text>

                    <Text style={styles.totalValue}>
                        ${total.toFixed(2)}
                    </Text>

                </View>

                <TouchableOpacity
                    style={styles.changeButton}
                    onPress={openChangeCalculator}
                >
                    <Text style={styles.changeButtonText}>
                        💵 Calcular cambio
                    </Text>
                </TouchableOpacity>

                <View style={styles.footerActions}>

                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancelSale}
                    >
                        <Text style={styles.cancelBtnText}>
                            Cancelar
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={handleConfirmSale}
                    >
                        <Text style={styles.confirmBtnText}>
                            💰 Cobrar venta
                        </Text>
                    </TouchableOpacity>

                </View>

            </View>

            <Modal
                visible={searchVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setSearchVisible(false);
                }}
            >
                <View style={styles.modalOverlay}>

                    <View style={styles.modalContainer}>

                        <View style={styles.modalHeader}>

                            <Text style={styles.modalTitle}>
                                Buscar producto
                            </Text>

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

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Nombre o categoría..."
                            placeholderTextColor="#9CA3AF"
                            value={search}
                            onChangeText={handleSearch}
                            autoFocus
                        />

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
                                        handleAddProduct(item)
                                    }
                                    activeOpacity={0.7}
                                >

                                    <View style={styles.productResultInfo}>

                                        <Text style={styles.productResultName}>
                                            {item.name}
                                        </Text>

                                        <Text style={styles.productResultCategory}>
                                            {item.category ?? 'Sin categoría'}
                                        </Text>

                                        <Text style={styles.productResultSku}>
                                            {item.sku ?? 'Sin código'}
                                        </Text>

                                        <Text
                                            style={[
                                                styles.productResultStock,
                                                item.stock <= item.minStock &&
                                                styles.lowStock,
                                            ]}
                                        >
                                            Stock: {item.stock}
                                        </Text>

                                    </View>

                                    <View style={styles.productResultRight}>

                                        <Text style={styles.productResultPrice}>
                                            ${item.price.toFixed(2)}
                                        </Text>

                                        <Text style={styles.addText}>
                                            Agregar
                                        </Text>

                                    </View>

                                </TouchableOpacity>
                            )}
                        />

                    </View>

                </View>
            </Modal>

            <Modal
                visible={changeVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={closeChangeCalculator}
            >
                <View style={styles.changeModalOverlay}>

                    <View style={styles.changeModalContainer}>

                        <View style={styles.changeModalHeader}>

                            <Text style={styles.changeModalTitle}>
                                Calcular cambio
                            </Text>

                            <TouchableOpacity
                                onPress={closeChangeCalculator}
                            >
                                <Text style={styles.changeCloseButton}>
                                    ✕
                                </Text>
                            </TouchableOpacity>

                        </View>


                        <View style={styles.changeTotalContainer}>

                            <Text style={styles.changeTotalLabel}>
                                Total a pagar
                            </Text>

                            <Text style={styles.changeTotalValue}>
                                ${total.toFixed(2)}
                            </Text>

                        </View>


                        <Text style={styles.paymentLabel}>
                            Cliente paga
                        </Text>

                        <TextInput
                            style={styles.paymentInput}
                            value={payment}
                            onChangeText={setPayment}
                            keyboardType="decimal-pad"
                            placeholder="$0.00"
                            placeholderTextColor="#9CA3AF"
                            autoFocus
                        />


                        {payment !== '' && (
                            <>
                                {change >= 0 ? (

                                    <View style={styles.changeResult}>

                                        <Text style={styles.changeResultLabel}>
                                            Cambio
                                        </Text>

                                        <Text style={styles.changeResultAmount}>
                                            ${change.toFixed(2)}
                                        </Text>

                                    </View>

                                ) : (

                                    <View style={styles.insufficientResult}>

                                        <Text style={styles.insufficientLabel}>
                                            Falta
                                        </Text>

                                        <Text style={styles.insufficientAmount}>
                                            ${Math.abs(change).toFixed(2)}
                                        </Text>

                                    </View>

                                )}
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.closeChangeButton}
                            onPress={closeChangeCalculator}
                        >
                            <Text style={styles.closeChangeButtonText}>
                                Cerrar
                            </Text>
                        </TouchableOpacity>

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

    actionButtons: {
        gap: 8,
    },

    scanBtn: {
        backgroundColor: '#2563EB',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },

    scanBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },

    searchBtn: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },

    searchBtnText: {
        color: '#111827',
        fontWeight: '700',
        fontSize: 16,
    },

    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },

    itemInfo: {
        flex: 1,
    },

    itemName: {
        fontWeight: '700',
        color: '#111827',
    },

    itemSku: {
        fontSize: 11,
        color: '#9CA3AF',
        marginTop: 2,
    },

    itemPrice: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 2,
    },

    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },

    qtyBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },

    qtyBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },

    qtyValue: {
        width: 30,
        textAlign: 'center',
        fontWeight: '700',
    },

    itemSubtotal: {
        fontWeight: '700',
        width: 70,
        textAlign: 'right',
        color: '#111827',
    },

    deleteBtn: {
        marginLeft: 10,
    },

    deleteText: {
        fontSize: 16,
    },

    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginTop: 50,
    },

    emptyIcon: {
        fontSize: 40,
        marginBottom: 10,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 6,
    },

    empty: {
        textAlign: 'center',
        color: '#6B7280',
        lineHeight: 20,
    },

    footer: {
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
        paddingTop: 14,
    },

    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },

    totalLabel: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '600',
    },

    totalValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
    },

    changeButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingVertical: 13,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10,
    },

    changeButtonText: {
        color: '#111827',
        fontWeight: '700',
        fontSize: 15,
    },

    footerActions: {
        flexDirection: 'row',
        gap: 10,
    },

    cancelBtn: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    cancelBtnText: {
        color: '#374151',
        fontWeight: '700',
    },

    confirmBtn: {
        flex: 2,
        backgroundColor: '#DC2626',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },

    confirmBtnText: {
        color: '#fff',
        fontWeight: '800',
        fontSize: 15,
    },

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

    productResultStock: {
        fontSize: 12,
        color: '#059669',
        fontWeight: '600',
        marginTop: 4,
    },

    lowStock: {
        color: '#DC2626',
    },

    productResultRight: {
        alignItems: 'flex-end',
        marginLeft: 10,
    },

    productResultPrice: {
        fontSize: 16,
        fontWeight: '800',
        color: '#111827',
    },

    addText: {
        fontSize: 12,
        color: '#2563EB',
        fontWeight: '700',
        marginTop: 5,
    },

    changeModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        justifyContent: 'flex-end',
    },

    changeModalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 32,
    },

    changeModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },

    changeModalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#111827',
    },

    changeCloseButton: {
        fontSize: 22,
        color: '#6B7280',
        padding: 4,
    },

    changeTotalContainer: {
        backgroundColor: '#F3F4F6',
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginBottom: 20,
    },

    changeTotalLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 5,
    },

    changeTotalValue: {
        fontSize: 30,
        fontWeight: '800',
        color: '#111827',
    },

    paymentLabel: {
        fontSize: 14,
        color: '#374151',
        fontWeight: '600',
        marginBottom: 7,
    },

    paymentInput: {
        height: 56,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 22,
        color: '#111827',
        marginBottom: 18,
    },

    changeResult: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginBottom: 20,
    },

    changeResultLabel: {
        fontSize: 14,
        color: '#047857',
        fontWeight: '600',
        marginBottom: 4,
    },

    changeResultAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#059669',
    },

    insufficientResult: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        borderRadius: 14,
        padding: 18,
        alignItems: 'center',
        marginBottom: 20,
    },

    insufficientLabel: {
        fontSize: 14,
        color: '#B91C1C',
        fontWeight: '600',
        marginBottom: 4,
    },

    insufficientAmount: {
        fontSize: 32,
        fontWeight: '800',
        color: '#DC2626',
    },

    closeChangeButton: {
        backgroundColor: '#111827',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
    },

    closeChangeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});