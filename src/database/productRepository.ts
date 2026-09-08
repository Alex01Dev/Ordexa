import * as Crypto from 'expo-crypto';
import { db } from './db';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '../types';

export const productRepository = {

  getAll(search?: string): Product[] {
    if (search?.trim()) {
      const term = `%${search.trim()}%`;

      return db.getAllSync<Product>(
        `SELECT * FROM products
         WHERE name LIKE ?
            OR sku LIKE ?
            OR category LIKE ?
         ORDER BY name ASC`,
        [term, term, term]
      );
    }

    return db.getAllSync<Product>(
      `SELECT * FROM products ORDER BY name ASC`
    );
  },

  getById(id: string): Product | null {
    const result = db.getFirstSync<Product>(
      `SELECT * FROM products WHERE id = ?`,
      [id]
    );

    return result ?? null;
  },

  // =========================
  // OBTENER POR SKU
  // =========================

  getBySku(sku: string): Product | null {
    const result = db.getFirstSync<Product>(
      `SELECT * FROM products WHERE sku = ?`,
      [sku]
    );

    return result ?? null;
  },

  create(input: CreateProductInput): Product {
    const sku = input.sku?.trim() || null;

    if (sku) {
      const existing = this.getBySku(sku);

      if (existing) {
        throw new Error(
          'Ya existe un producto con ese código de barras'
        );
      }
    }

    const now = new Date().toISOString();

    const product: Product = {
      id: Crypto.randomUUID(),
      name: input.name.trim(),
      sku,
      description: input.description ?? null,
      category: input.category ?? null,
      price: input.price,
      cost: input.cost ?? null,
      stock: input.stock ?? 0,
      minStock: input.minStock ?? 0,
      imageUrl: input.imageUrl ?? null,
      createdAt: now,
      updatedAt: now,
    };

    db.runSync(
      `INSERT INTO products (
        id,
        name,
        sku,
        description,
        category,
        price,
        cost,
        stock,
        minStock,
        imageUrl,
        createdAt,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.id,
        product.name,
        product.sku,
        product.description,
        product.category,
        product.price,
        product.cost,
        product.stock,
        product.minStock,
        product.imageUrl,
        product.createdAt,
        product.updatedAt,
      ]
    );

    return product;
  },


  update(id: string, input: UpdateProductInput): Product {
    const current = this.getById(id);

    if (!current) {
      throw new Error('Producto no encontrado');
    }

    const newSku =
      input.sku !== undefined && input.sku !== null
        ? input.sku.trim() || null
        : current.sku;

    if (newSku) {
      const existing = this.getBySku(newSku);

      if (existing && existing.id !== id) {
        throw new Error(
          'Ya existe otro producto con ese código de barras'
        );
      }
    }

    const updated: Product = {
      id: current.id,
      name: input.name ?? current.name,
      sku: newSku,
      description: input.description ?? current.description,
      category: input.category ?? current.category,
      price: input.price ?? current.price,
      cost: input.cost ?? current.cost,
      stock: input.stock ?? current.stock,
      minStock: input.minStock ?? current.minStock,
      imageUrl: input.imageUrl ?? current.imageUrl,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    };

    db.runSync(
      `UPDATE products SET
        name = ?,
        sku = ?,
        description = ?,
        category = ?,
        price = ?,
        cost = ?,
        stock = ?,
        minStock = ?,
        imageUrl = ?,
        updatedAt = ?
       WHERE id = ?`,
      [
        updated.name,
        updated.sku,
        updated.description,
        updated.category,
        updated.price,
        updated.cost,
        updated.stock,
        updated.minStock,
        updated.imageUrl,
        updated.updatedAt,
        id,
      ]
    );

    return updated;
  },

  delete(id: string): void {
    db.runSync(
      `DELETE FROM inventory_movements WHERE productId = ?`,
      [id]
    );

    db.runSync(
      `DELETE FROM products WHERE id = ?`,
      [id]
    );
  },

  getLowStock(): Product[] {
    return db.getAllSync<Product>(
      `SELECT * FROM products
       WHERE stock <= minStock
       ORDER BY name ASC`
    );
  },
};