import { db } from './db';

export const initDatabase = () => {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      sku TEXT NOT NULL UNIQUE,
      description TEXT,
      category TEXT,
      price REAL NOT NULL,
      cost REAL,
      stock INTEGER NOT NULL DEFAULT 0,
      minStock INTEGER NOT NULL DEFAULT 0,
      imageUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY NOT NULL,
      productId TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      reason TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (productId) REFERENCES products (id)
    );
  `);
};