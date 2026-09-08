export const STORE_CATEGORIES = [
  'Bebidas alcohólicas',
  'Agua',
  'Refrescos y jugos',
  'Lácteos',
  'Aceites y grasas',
  'Botanas y frituras',
  'Panadería',
  'Abarrotes y despensa',
  'Dulces y golosinas',
  'Congelados',
  'Limpieza del hogar',
  'Cuidado personal',
  'Otros',
] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/-/g, ' ');
}

const CATEGORY_RULES: { category: StoreCategory; keywords: string[] }[] = [
  {
    category: 'Bebidas alcohólicas',
    keywords: ['alcohol', 'cerveza', 'beer', 'vino', 'wine', 'licor', 'liquor', 'tequila', 'whisky', 'whiskey', 'vodka', 'ron', 'mezcal', 'destilado'],
  },
  {
    category: 'Agua',
    keywords: ['agua', 'water', 'agua mineral'],
  },
  {
    category: 'Refrescos y jugos',
    keywords: ['refresco', 'soda', 'gaseosa', 'cola', 'jugo', 'juice', 'bebida', 'beverage', 'carbonatada', 'carbonated', 'nectar'],
  },
  {
    category: 'Lácteos',
    keywords: ['lacteo', 'dairy', 'leche', 'milk', 'yogur', 'yogurt', 'queso', 'cheese', 'crema'],
  },
  {
    category: 'Aceites y grasas',
    keywords: ['aceite', 'oil', 'grasa', 'fat', 'mantequilla', 'butter', 'margarina'],
  },
  {
    category: 'Botanas y frituras',
    keywords: ['botana', 'snack', 'fritura', 'papas fritas', 'chips', 'cacahuate', 'cacahuates'],
  },
  {
    category: 'Panadería',
    keywords: ['pan', 'bread', 'panaderia', 'bakery', 'pastel', 'pastry', 'galleta', 'cookie', 'bollo'],
  },
  {
    category: 'Dulces y golosinas',
    keywords: ['dulce', 'candy', 'chocolate', 'golosina', 'caramelo', 'confiteria', 'chicle'],
  },
  {
    category: 'Congelados',
    keywords: ['congelado', 'frozen', 'helado', 'nieve'],
  },
  {
    category: 'Limpieza del hogar',
    keywords: ['limpieza', 'cleaning', 'detergente', 'detergent', 'cloro', 'bleach', 'desinfectante', 'disinfectant', 'lavatrastes', 'suavizante'],
  },
  {
    category: 'Cuidado personal',
    keywords: ['higiene', 'hygiene', 'shampoo', 'jabon', 'soap', 'desodorante', 'deodorant', 'cosmetico', 'cosmetic', 'pasta dental', 'toothpaste', 'papel higienico'],
  },
  {
    category: 'Abarrotes y despensa',
    keywords: ['abarrotes', 'grocery', 'arroz', 'rice', 'pasta', 'cereal', 'harina', 'flour', 'legumbre', 'grano', 'grain', 'frijol', 'sopa'],
  },
];

export function classifyCategory(categoryNames: string[] = []): StoreCategory {
  // Revisa de la categoría MÁS ESPECÍFICA a la más general
  const ordered = [...categoryNames].reverse();

  for (const raw of ordered) {
    const normalized = normalize(raw);
    for (const rule of CATEGORY_RULES) {
      if (rule.keywords.some((kw) => normalized.includes(normalize(kw)))) {
        return rule.category;
      }
    }
  }

  return 'Otros';
}