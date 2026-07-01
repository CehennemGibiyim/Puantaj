import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type PersonnelType = 'ISCI' | 'MEMUR';

export type Department = {
  id: string;
  name: string;
  manager_name: string | null;
  services: string | null;
  sorumlu_hemsire: string | null;
  hemsire_unvan: string | null;
  saglik_bakim_muduru: string | null;
  bashekim: string | null;
};

export type Personnel = {
  id: string;
  name: string;
  department_id: string;
  is_active: boolean;
  personnel_type: PersonnelType;
  phone: string | null;
  email: string | null;
};

export type TimesheetEntry = {
  id: string;
  personnel_id: string;
  entry_date: string;
  shift_type: string;
  hours_worked: number;
  notes: string | null;
};

export type Holiday = {
  id: string;
  holiday_date: string;
  name: string;
};
