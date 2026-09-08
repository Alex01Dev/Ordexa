import * as Crypto from 'expo-crypto';
import { db } from './db';
import { InventoryMovement, MovementType } from '../types';
import { productRepository } from './productRepository';

export const inventoryRepository = {
  getByProduct(productId: string): InventoryMovement[] {
    return db.getAllSync<InventoryMovement>(
      `SELECT * FROM inventory_movements WHERE productId = ? ORDER BY createdAt DESC`,
      [productId]
    );
  },

  createMovement(productId: string, type: MovementType, quantity: number, reason?: string): InventoryMovement {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    const product = productRepository.getById(productId);
    if (!product) {
      throw new Error('Producto no encontrado');
    }

    let newStock = product.stock;
    if (type === 'IN') {
      newStock += quantity;
    } else if (type === 'OUT') {
      if (product.stock < quantity) {
        throw new Error('Stock insuficiente');
      }
      newStock -= quantity;
    } else if (type === 'ADJUSTMENT') {
      newStock = quantity;
    }

    const movement: InventoryMovement = {
      id: Crypto.randomUUID(),
      productId,
      type,
      quantity,
      reason: reason ?? null,
      createdAt: new Date().toISOString(),
    };

    // Nota: expo-sqlite (sync API) ejecuta estas dos operaciones
    // secuencialmente; para lotes grandes se puede envolver en withTransactionSync.
    db.runSync(
      `INSERT INTO inventory_movements (id, productId, type, quantity, reason, createdAt)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [movement.id, movement.productId, movement.type, movement.quantity, movement.reason, movement.createdAt]
    );

    productRepository.update(productId, { stock: newStock } as any);

    return movement;
  },
};