
export type UserRole = 'admin' | 'operator' | 'super_admin';

export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role: UserRole;
  admin_id?: string;
  is_active?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  features: any;
  limits: any;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  current_period_end?: string;
  pricing_plan?: Plan; // Joined data
  start_date?: string;
  end_date?: string;
  payment_status?: 'paid' | 'pending' | 'overdue';
  payment_method?: string;
  payment_reference?: string;
  payment_proof_url?: string;
  notes?: string;
}

export interface Company {
  id: string;
  name: string;
  rif: string;
  address: string;
  logoUrl?: string;
  signatureUrl?: string;
  stampUrl?: string;
  lastCorrelationNumber?: number;
}

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  rif: string;
  address?: string;
  defaultRetentionRate?: 75 | 100;
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

export interface CommunityTopic {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: 'Problema' | 'Sugerencia' | 'Fiscal' | 'General';
  created_at: string;
  profiles?: {
    first_name: string;
    role: string;
  };
  comment_count?: number;
}

export interface CommunityComment {
  id: string;
  topic_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    first_name: string;
    role: string;
  };
}

export interface VoucherAuditLog {
  id: string;
  retention_id: string;
  user_id: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export interface RetentionVoucher {
  id: string;
  voucherNumber: string;
  controlNumber?: string;
  invoiceUrl?: string;
  date: string;
  fiscalPeriod: string;
  retentionPercentage: number;
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
  PROFILE = 'profile',
  SUPPLIERS = 'suppliers',
  COMMUNITY = 'community',
  REPORTS = 'reports',
  SUPER_ADMIN = 'super_admin'
}
