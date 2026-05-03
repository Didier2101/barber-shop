'use server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rateLimit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const createBarberSchema = z.object({
  name: z.string().trim().min(3),
  email: z.string().trim().email(),
  document_id: z.string().trim().min(4),
  phone: z.string().trim().regex(/^\d{7,15}$/),
  commission_percentage: z.coerce.number().min(0).max(100).default(50),
  address: z.string().trim().min(5),
});

export async function createBarberAction(formData: FormData) {
  const parsed = createBarberSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    document_id: formData.get('document_id'),
    phone: formData.get('phone'),
    commission_percentage: formData.get('commission_percentage') || '50',
    address: formData.get('address'),
  });

  if (!parsed.success) {
    return { error: 'Datos invalidos para crear barbero.' };
  }

  const { name, email, document_id, phone, commission_percentage, address } = parsed.data;
  const rate = checkRateLimit(`create-barber:${email}`, 5, 60_000);
  if (!rate.allowed) {
    return { error: 'Demasiadas solicitudes. Intenta nuevamente en un minuto.' };
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: document_id,
    email_confirm: true,
  });

  if (authError) return { error: authError.message };

  if (authData.user) {
    // 2. Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      role: 'barber',
      name,
      document_id,
      phone,
      address,
      commission_percentage,
      is_active: true
    });

    if (profileError) {
      // rollback user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return { error: profileError.message };
    }
    
    return { success: true };
  }
  return { error: 'Unknown error' };
}
