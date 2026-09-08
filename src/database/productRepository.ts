import * as Crypto from 'expo-crypto';
import { db } from './db';
import { Product, CreateProductInput, UpdateProductInput } from '../types';

export const productRepository = {
  getAll(search?: string): Product[] {
    if (search) {
      const term = `%${search}%`;
      return db.getAllSync<Product>(
        `SELECT * FROM products WHERE name LIKE ? OR sku LIKE ? ORDER BY name ASC`,
        [term, term]
      );
    }
    return db.getAllSync<Product>(`SELECT * FROM products ORDER BY name ASC`);
  },

  getById(id: string): Product | null {
    const result = db.getFirstSync<Product>(`SELECT * FROM products WHERE id = ?`, [id]);
    return result ?? null;
  },

  getBySku(sku: string): Product | null {
    const result = db.getFirstSync<Product>(`SELECT * FROM products WHERE sku = ?`, [sku]);
    return result ?? null;
  },

  create(input: CreateProductInput): Product {
    const existing = this.getBySku(input.sku);
    if (existing) {
      throw new Error('Ya existe un producto con ese SKU');
    }

    const now = new Date().toISOString();
    const product: Product = {
      id: Crypto.randomUUID(),
      name: input.name,
      sku: input.sku,
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
      `INSERT INTO products (id, name, sku, description, category, price, cost, stock, minStock, imageUrl, createdAt, updatedAt)
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

    const updated: Product = {
      ...current,
      ...input,
      updatedAt: new Date().toISOString(),
    } as Product;

    db.runSync(
      `UPDATE products SET name = ?, sku = ?, description = ?, category = ?, price = ?, cost = ?, stock = ?, minStock = ?, imageUrl = ?, updatedAt = ?
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
    db.runSync(`DELETE FROM inventory_movements WHERE productId = ?`, [id]);
    db.runSync(`DELETE FROM products WHERE id = ?`, [id]);
  },

  getLowStock(): Product[] {
    return db.getAllSync<Product>(`SELECT * FROM products WHERE stock <= minStock ORDER BY name ASC`);
  },
};