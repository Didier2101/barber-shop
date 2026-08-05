export type UserRole = 'owner' | 'barber' | 'client';

export interface Profile {
  id: string;
  name: string;
  nickname?: string;
  bio?: string;
  phone: string;
  email?: string;
  document_id?: string;
  address?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  is_online?: boolean;
  services_completed?: number;
  data_policy_accepted?: boolean;
  data_policy_accepted_at?: string;
  specialty?: string;
  commission_percentage?: number;
  barber_services?: { service_id: string }[];
  created_at: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  is_active: boolean;
  created_at: string;
}

export interface AppointmentService extends Partial<Service> {
  id: string;
  name: string;
  price: number;
  rating?: number;
}

export interface Appointment {
  id: string;
  client_id?: string;
  client_name?: string;
  client_phone?: string;
  barber_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'walk-in' | 'occupied';
  price: number;
  services_data: AppointmentService[];
  rating?: number;
  client?: Profile;
  barber?: Profile;
  created_at: string;
  /** null = pendiente de liquidar al barbero | con valor = ya liquidada */
  settlement_id?: string | null;
  is_loyalty_reward?: boolean;
  applied_promo_id?: string | null;
  notes?: string | null;
}

export interface BusinessHour {
  id: string;
  day_of_week: number;
  opening_time: string;
  closing_time: string;
  is_closed: boolean;
}

export interface BarberSocial {
  id: number;
  barber_id: string;
  platform: string;
  url: string;
  created_at: string;
}

export interface ShopSettings {
  id: number;
  name?: string;
  address?: string;
  phone?: string;
  logo_url?: string;
  monthly_fixed_costs?: number;
  opening_time?: string;
  closing_time?: string;
  accounting_period?: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  service_ids?: string[];
  created_at: string;
}

export interface LoyaltySettings {
  id: number;
  appointments_threshold: number;
  is_enabled: boolean;
  start_date?: string;
  end_date?: string;
  target_audience?: string;
  description?: string;
  service_ids?: string[];
  updated_at?: string;
}

export interface Settlement {
  id: string;
  barber_id: string;
  start_date: string;
  end_date: string;
  total_revenue: number;
  barber_earnings: number;
  owner_earnings: number;
  commission_applied: number;
  created_at: string;
  barber?: { name: string };
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  expense_date: string;
  /** Formato 'YYYY-MM', ej: '2026-05' */
  period: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  created_at: string;
}
