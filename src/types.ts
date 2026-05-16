
export type UserRole = 'Manager' | 'Technician' | 'Senior Technician' | 'Admin';
export type EmploymentType = 'Full-time' | 'Part-time';
export type PaymentMethod = 'Tunai' | 'Transfer' | 'Debit'; // Adjusted to match schema usage
export type PaymentType = 'Debit' | 'Credit';

export interface DocItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  inventoryId?: string;
}

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  dateAdded: string;
  category?: string;
}

export interface DocumentBase {
  id: string;
  refNo: string;
  date: string;
  customerName: string;
  address: string;
  phone: string;
  items: DocItem[];
  subtotal: number;
  tax: number;
  total: number;
  terms: string;
  notes?: string;
  bankDetails?: string;
}

export interface Invoice extends DocumentBase {
  deposit: number;
  balance: number;
  warranty: string;
  status: 'Paid' | 'Pending';
}

export interface Quotation extends DocumentBase {
  validity: string;
  paymentTerms: string;
}

export interface UnknownQuestion {
  id: string;
  phone: string;
  customerName: string;
  question: string;
  date: string;
  status: 'New' | 'Answered';
}

export interface ServicePrice {
  id: string;
  name: string;
  price: number;
  price_end?: number;
  description: string;
  category: string;
  is_active: boolean; // Added from v24.0
}

export interface TimeSlotConfig {
  id: string;
  label: string;
  is_active: boolean; // Renamed from active to match schema
  display_order?: number;
}

export interface TeamConfig {
  id: string;
  name: string;
  is_active: boolean; // Renamed from active to match schema
  max_jobs_per_day: number;
  max_service_jobs: number; // Renamed from maxServiceCapacity to match schema
  max_install_jobs: number; // Renamed from maxInstallCapacity to match schema
  allowed_slots?: string[]; // JSONB in schema, array in TS
}

export interface Employee {
  id: string;
  name: string;
  ic_number: string; // Renamed from icNumber to match schema
  address: string;
  position: string; // Dynamic text in schema
  basic_salary: number;
  type: string; // Dynamic text in schema
  created_at?: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  month: string;
  year: string;
  basic_salary: number;
  epf_employee: number;
  epf_employer: number;
  socso_employee: number;
  socso_employer: number;
  advance: number;
  gross: number;
  net: number;
  payment_method: string;
  status: 'Paid' | 'Pending';
  created_at?: string;
}

export interface InventoryItem {
  id: string;
  shop_name: string;
  item_name: string;
  unit: string;
  stock: number;
  buy_price: number;
  sell_price: number;
  status: string;
  payment_type: string;
  payment_method: string;
  updated_at?: string;
}

export interface SaleRecord {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  service_description: string;
  shop_name?: string;
  amount: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string;
  payment_type: string;
  date: string;
  items_used?: any; // JSONB
  admin_name: string;
  customer_id?: string;
  employee_id?: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  payment_type: string;
  payment_method: string;
  created_at?: string;
}

export interface Booking {
  id: string;
  booking_date: string; // Renamed from date to match schema
  customer_name: string;
  address: string;
  phone: string;
  service_type: string;
  unit_type: string;
  quantity: string;
  time_slot: string;
  team: string;
  status: string;
  lat?: number;
  lng?: number;
  location_lat?: number;
  location_lng?: number;
  customer_id?: string;
  team_id?: string;
  time_slot_id?: string;
  created_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  last_service?: string;
  total_spent: number;
  ad_message?: string;
  interests?: string[]; // JSONB array
}

export interface Promotion {
  id: string;
  title?: string;
  message?: string;
  media_data?: string; // Base64
  media_type?: string;
  post_date?: string;
  post_time?: string;
  ai_active?: boolean;
  target_phone?: string;
  target_name?: string;
  status: string;
  discount?: string;
  platform?: string;
  target_customer_id?: string;
  created_at?: string;
}

export interface Template {
  id: string;
  code: string;
  name: string;
  content: string;
  variables: string;
}

export interface AiQuestion {
  id: string;
  category: string;
  question: string;
  source: string;
  status: string;
}

export interface AiAnswer {
  id: string;
  style: string;
  answer: string;
  language: string;
  status: string;
}

export interface AiMapping {
  id: string;
  question_id: string;
  answer_id: string;
  triggers: string;
  status: string;
}

export interface AiTraining {
  id: string;
  type: string;
  input: string;
  verified_by: string;
  date: string;
  status: string;
}

export interface AiLock {
  id: string;
  key_name: string;
  function: string;
  level: string;
  active: boolean;
}

export interface AiLearningLog {
  id: string;
  time: string;
  activity: string;
  change: string;
  status: string;
}

export interface BlockedSlot {
  id: string;
  date: string;
  time_slot: string;
  reason?: string;
}
