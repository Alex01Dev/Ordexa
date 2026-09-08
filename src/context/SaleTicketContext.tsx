import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Product } from '../types';

export interface TicketItem {
  productId: string;
  name: string;
  sku: string | null;
  price: number;
  quantity: number;
  stock: number;
}

type AddResult = 'added' | 'incremented' | 'no-stock';

interface SaleTicketContextValue {
  ticket: TicketItem[];
  addProduct: (product: Product) => AddResult;
  changeQuantity: (productId: string, delta: number) => void;
  removeItem: (productId: string) => void;
  clearTicket: () => void;
}

const SaleTicketContext = createContext<SaleTicketContextValue | undefined>(undefined);

export const SaleTicketProvider = ({ children }: { children: React.ReactNode }) => {
  const [ticket, setTicket] = useState<TicketItem[]>([]);
  const ticketRef = useRef<TicketItem[]>([]);

  const applyUpdate = (updater: (prev: TicketItem[]) => TicketItem[]) => {
    setTicket((prev) => {
      const next = updater(prev);
      ticketRef.current = next;
      return next;
    });
  };

  const addProduct = useCallback((product: Product): AddResult => {
    const current = ticketRef.current.find((i) => i.productId === product.id);
    const currentQty = current?.quantity ?? 0;

    if (currentQty + 1 > product.stock) {
      return 'no-stock';
    }

    applyUpdate((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [
        ...prev,
        { productId: product.id, name: product.name, sku: product.sku, price: product.price, quantity: 1, stock: product.stock },
      ];
    });

    return current ? 'incremented' : 'added';
  }, []);

  const changeQuantity = useCallback((productId: string, delta: number) => {
    applyUpdate((prev) =>
      prev
        .map((item) => {
          if (item.productId !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty > item.stock) return item;
          return { ...item, quantity: newQty };
        })
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    applyUpdate((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearTicket = useCallback(() => applyUpdate(() => []), []);

  return (
    <SaleTicketContext.Provider value={{ ticket, addProduct, changeQuantity, removeItem, clearTicket }}>
      {children}
    </SaleTicketContext.Provider>
  );
};

export const useSaleTicket = () => {
  const ctx = useContext(SaleTicketContext);
  if (!ctx) throw new Error('useSaleTicket debe usarse dentro de SaleTicketProvider');
  return ctx;
};