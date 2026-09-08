import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { inventoryRepository } from '../database/inventoryRepository';
import { useSaleTicket } from '../context/SaleTicketContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Sale'>;

export const SaleScreen = ({ navigation }: Props) => {
  const { ticket, changeQuantity, removeItem, clearTicket } = useSaleTicket();

  const total = ticket.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCancelSale = () => {
    if (ticket.length === 0) {
      navigation.goBack();
      return;
    }
    Alert.alert('Cancelar venta', 'Se perderán los productos agregados al ticket. ¿Continuar?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: () => {
          clearTicket();
          navigation.goBack();
        },
      },
    ]);
  };

  const handleConfirmSale = () => {
    if (ticket.length === 0) {
      Alert.alert('Ticket vacío', 'Escanea al menos un producto antes de cobrar.');
      return;
    }

    try {
      ticket.forEach((item) => {
        inventoryRepository.createMovement(item.productId, 'OUT', item.quantity, 'Venta');
      });

      const totalCobrado = total;
      clearTicket();

      Alert.alert('Venta registrada', `Total cobrado: $${totalCobrado.toFixed(2)}`, [
        { text: 'Listo', onPress: () => navigation.navigate('ProductList') },
      ]);
    } catch (error: any) {
      Alert.alert('Error al registrar la venta', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.scanBtn} onPress={() => navigation.navigate('Scanner', { mode: 'SALE_ITEM' })}>
        <Text style={styles.scanBtnText}>📷 Escanear producto</Text>
      </TouchableOpacity>

      <FlatList
        data={ticket}
        keyExtractor={(item) => item.productId}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>${item.price.toFixed(2)} c/u</Text>
            </View>

            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQuantity(item.productId, -1)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQuantity(item.productId, 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.itemSubtotal}>${(item.price * item.quantity).toFixed(2)}</Text>

            <TouchableOpacity onPress={() => removeItem(item.productId)} style={{ marginLeft: 10 }}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Todavía no has agregado productos. Toca "Escanear producto" para empezar a armar la venta.
          </Text>
        }
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelSale}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmSale}>
            <Text style={styles.confirmBtnText}>💰 Cobrar venta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16 },
  scanBtn: { backgroundColor: '#2563EB', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  itemName: { fontWeight: '700', color: '#111827' },
  itemPrice: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  qtyValue: { width: 30, textAlign: 'center', fontWeight: '700' },
  itemSubtotal: { fontWeight: '700', width: 70, textAlign: 'right', color: '#111827' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40, lineHeight: 20, paddingHorizontal: 20 },
  footer: { borderTopWidth: 1, borderColor: '#E5E7EB', paddingTop: 14 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  totalLabel: { fontSize: 16, color: '#374151', fontWeight: '600' },
  totalValue: { fontSize: 24, fontWeight: '800', color: '#111827' },
  footerActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#374151', fontWeight: '700' },
  confirmBtn: { flex: 2, backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});