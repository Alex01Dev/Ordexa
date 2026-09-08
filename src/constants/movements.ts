import { MovementType } from '../types';

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  IN: 'Entrada',
  OUT: 'Salida',
  ADJUSTMENT: 'Ajuste',
};

export const MOVEMENT_DESCRIPTIONS: Record<MovementType, string> = {
  IN: 'Sumar mercancía que acaba de llegar (compra, reposición).',
  OUT: 'Restar producto que se vendió o salió del inventario.',
  ADJUSTMENT: 'Corregir el stock a un número exacto (ej. tras un conteo físico).',
};

export const MOVEMENT_ICON_SIGN: Record<MovementType, string> = {
  IN: '+',
  OUT: '−',
  ADJUSTMENT: '=',
};