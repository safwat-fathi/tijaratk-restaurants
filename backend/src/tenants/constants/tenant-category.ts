export const TENANT_CATEGORY_VALUES = [
  'fast_food',
  'fine_dining',
  'other',
] as const;

export type TenantCategory = (typeof TENANT_CATEGORY_VALUES)[number];

export const TENANT_CATEGORIES = {
  FAST_FOOD: {
    value: 'fast_food',
    labels: {
      en: 'Fast Food',
      ar: 'وجبات سريعة',
    },
  },
  FINE_DINING: {
    value: 'fine_dining',
    labels: {
      en: 'Fine Dining',
      ar: 'مطعم فاخر',
    },
  },
  OTHER: {
    value: 'other',
    labels: {
      en: 'Other',
      ar: 'أخرى',
    },
  },
} as const;
