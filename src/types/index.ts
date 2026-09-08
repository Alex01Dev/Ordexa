export interface Product {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  price: number;
  cost: number | null;
  stock: number;
  minStock: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string | null;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  sku?: string | null;
  description?: string;
  category?: string;
  price: number;
  cost?: number;
  stock?: number;
  minStock?: number;
  imageUrl?: string;
}

export type UpdateProductInput = Partial<CreateProductInput>;