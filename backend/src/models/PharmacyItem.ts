import { SupabaseRepository } from '../config/supabase';

export interface IPharmacyItem {
  _id?: string;
  id?: string;
  clinicId: string | any;
  name: string;
  brand: string;
  category: string;
  unit: string;
  batchNumber: string;
  mfgDate?: string;
  expiryDate: string;
  stockQuantity: number;
  reorderLevel: number;
  purchasePrice: number;
  unitPrice: number;
  mrp?: number;
  supplier?: string;
  supplierContact?: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  save?: () => Promise<IPharmacyItem>;
  toObject?: () => any;
}

export const PharmacyItem = new SupabaseRepository<IPharmacyItem>('pharmacy_items');
