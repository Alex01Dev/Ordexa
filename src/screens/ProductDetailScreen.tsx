import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, TextInput, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { productRepository } from '../database/productRepository';
import { inventoryRepository } from '../database/inventoryRepository';
import { Product, InventoryMovement, MovementType } from '../types';
import { MOVEMENT_LABELS, MOVEMENT_DESCRIPTIONS } from '../constants/movements';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const MOVEMENT_STYLE: Record<MovementType, { icon: string; color: string; bg: string; sign: string }> = {
  IN: { icon: '⬆️', color: '#16A34A', bg: '#DCFCE7', sign: '+' },
  OUT: { icon: '⬇️', color: '#DC2626', bg: '#FEE2E2', sign: '−' },
  ADJUSTMENT: { icon: '🔄', color: '#4B5563', bg: '#F3F4F6', sign: '=' },
};

export const ProductDetailScreen = ({ navigation, route }: Props) => {
  const { productId, openMovementModal, presetMovementType } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');

  const load = useCallback(() => {
    const p = productRepository.getById(productId);
    setProduct(p);
    setMovements(inventoryRepository.getByProduct(productId));
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      load();
      if (openMovementModal) {
        setMovementType(presetMovementType ?? 'IN');
        setQuantity('1');
        setModalVisible(true);
        navigation.setParams({ openMovementModal: undefined, presetMovementType: undefined });
      }
    }, [load, openMovementModal, presetMovementType])
  );

  if (!product) return null;

  const isLowStock = product.stock <= product.minStock;
  const margin = product.cost != null ? product.price - product.cost : null;

  const handleDelete = () => {
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que quieres eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            productRepository.delete(productId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleMovement = () => {
    const qty = parseInt(quantity, 10);
    if (!qty || qty <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresa un número mayor a 0');
      return;
    }
    try {
      inventoryRepository.createMovement(productId, movementType, qty, reason || undefined);
      setModalVisible(false);
      setQuantity('');
      setReason('');
      load();
    } catch (error: any) {
      Alert.alert('No se pudo registrar', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.name}>{product.name}</Text>
          {product.category ? (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{product.category}</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.sku}>Código: {product.sku}</Text>

        <View style={styles.divider} />

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Precio de venta</Text>
            <Text style={styles.statValue}>${product.price.toFixed(2)}</Text>
          </View>
          {margin != null && (
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Ganancia por unidad</Text>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>${margin.toFixed(2)}</Text>
            </View>
          )}
        </View>

        <View style={[styles.stockBanner, { backgroundColor: isLowStock ? '#FEE2E2' : '#DCFCE7' }]}>
          <Text style={styles.stockNumber}>{product.stock}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.stockLabel}>unidades disponibles ahora</Text>
            {isLowStock && (
              <Text style={styles.stockWarning}>⚠️ Stock bajo, considera reabastecer pronto</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ProductForm', { product })}>
          <Text style={styles.editBtnText}>✏️  Editar producto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Historial de movimientos</Text>
      <FlatList
        data={movements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const style = MOVEMENT_STYLE[item.type];
          return (
            <View style={styles.movementRow}>
              <View style={[styles.movementIconWrap, { backgroundColor: style.bg }]}>
                <Text style={{ fontSize: 16 }}>{style.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.movementType}>{MOVEMENT_LABELS[item.type]}</Text>
                {item.reason ? <Text style={styles.movementReason}>{item.reason}</Text> : null}
                <Text style={styles.movementDate}>
                  {new Date(item.createdAt).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Text style={[styles.movementQty, { color: style.color }]}>
                {style.sign} {item.quantity}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Todavía no hay movimientos registrados. Usa "Vender producto" o "Entrada" para empezar a mover el inventario de este producto.
          </Text>
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{MOVEMENT_LABELS[movementType]} de {product.name}</Text>
            <Text style={styles.helperText}>{MOVEMENT_DESCRIPTIONS[movementType]}</Text>

            <Text style={styles.label}>Cantidad</Text>
            <TextInput
              style={styles.input}
              placeholder={movementType === 'ADJUSTMENT' ? 'Nuevo stock total' : 'Cantidad'}
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
              autoFocus
            />
            <Text style={styles.label}>Motivo (opcional)</Text>
            <TextInput style={styles.input} placeholder="Ej. venta en mostrador" value={reason} onChangeText={setReason} />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleMovement}>
                <Text style={styles.confirmBtnText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#F9FAFB' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 20, fontWeight: '800', color: '#111827', flex: 1, marginRight: 8 },
  categoryBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  categoryText: { fontSize: 11, color: '#2563EB', fontWeight: '600' },
  sku: { color: '#6B7280', marginTop: 4, fontSize: 13 },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 14 },
  statsRow: { flexDirection: 'row', gap: 24, marginBottom: 14 },
  statBox: {},
  statLabel: { fontSize: 12, color: '#6B7280' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 2 },
  stockBanner: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, gap: 12 },
  stockNumber: { fontSize: 28, fontWeight: '800', color: '#111827' },
  stockLabel: { fontSize: 13, color: '#374151' },
  stockWarning: { fontSize: 12, color: '#B91C1C', marginTop: 2, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  editBtn: { flex: 1, backgroundColor: '#2563EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  editBtnText: { color: '#fff', fontWeight: '700' },
  deleteBtn: { width: 52, backgroundColor: '#FEE2E2', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { fontSize: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10 },
  movementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  movementIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  movementType: { fontWeight: '700', color: '#111827' },
  movementReason: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  movementDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  movementQty: { fontWeight: '800', fontSize: 16 },
  empty: { color: '#6B7280', textAlign: 'center', marginTop: 20, lineHeight: 20, paddingHorizontal: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  helperText: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 4 },
  cancelText: { color: '#6B7280', fontWeight: '600', paddingVertical: 10 },
  confirmBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});