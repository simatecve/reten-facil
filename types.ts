
export type UserRole = 'admin' | 'operator';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: UserRole;
  admin_id?: string; // ID del administrador propietario si es un subusuario
}

export interface Company {
  id: string;
  name: string;
  rif: string;
  address: string;
  retentionPercentage: 75 | 100;
  logoUrl?: string;
  lastCorrelationNumber?: number;
}

export interface Supplier {
  id?: string;
  name: string;
  rif: string;
}

export interface InvoiceItem {
  id: string;
  date: string;
  invoiceNumber: string;
  controlNumber: string;
  noteNumber?: string;
  transactionType: '01-reg' | '02-compl' | '03-anul';
  affectedInvoice?: string;
  totalAmount: number;
  exemptAmount: number;
  taxBase: number;
  taxRate: number;
  taxAmount: number;
  retentionRate: number;
  retentionAmount: number;
}

export interface RetentionVoucher {
  id: string;
  voucherNumber: string;
  date: string;
  fiscalPeriod: string;
  company: Company;
  supplier: Supplier;
  items: InvoiceItem[];
}

export enum AppRoute {
  LANDING = 'landing',
  DASHBOARD = 'dashboard',
  CREATE_COMPANY = 'create_company',
  CREATE_RETENTION = 'create_retention',
  VIEW_RETENTION = 'view_retention',
  HISTORY = 'history',
  USER_MANAGEMENT = 'user_management',
  PROFILE = 'profile'
}
