export interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

export interface Company {
  id: string;
  name: string; // Nombre o Razón Social
  rif: string; // Registro de Información Fiscal
  address: string; // Dirección Fiscal
  retentionPercentage: 75 | 100; // Porcentaje de retención por defecto
  logoUrl?: string; // URL del logo de la empresa
  lastCorrelationNumber?: number; // Último número de comprobante generado
}

export interface Supplier {
  id?: string;
  name: string;
  rif: string;
}

export interface InvoiceItem {
  id: string;
  date: string; // Fecha factura
  invoiceNumber: string; // Numero de factura
  controlNumber: string; // Numero de control
  noteNumber?: string; // Nota debito/credito
  transactionType: '01-reg' | '02-compl' | '03-anul'; // Tipo transaccion
  affectedInvoice?: string; // Factura afectada
  totalAmount: number; // Total compras incluyendo IVA
  exemptAmount: number; // Compras sin derecho a credito
  taxBase: number; // Base imponible
  taxRate: number; // % Alicuota (usually 16, 8, or 31)
  taxAmount: number; // Impuesto IVA
  retentionRate: number; // 75 or 100 usually
  retentionAmount: number; // IVA Retenido
}

export interface RetentionVoucher {
  id: string;
  voucherNumber: string; // YYYYMM + sequence
  date: string;
  fiscalPeriod: string; // e.g., 2025 / noviembre
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
  HISTORY = 'history'
}