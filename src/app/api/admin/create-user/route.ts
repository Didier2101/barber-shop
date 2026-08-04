import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { name, email, password, commission_percentage } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // 1. Crear el usuario en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar el correo para que puedan entrar de inmediato
    });

    if (authError) {
      console.error('Error creando usuario en Auth:', authError);
      let errorMessage = authError.message;
      if (authError.code === 'email_exists' || errorMessage.includes('already been registered')) {
        errorMessage = 'Este correo electrónico ya está registrado en el sistema.';
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insertar su perfil en la base de datos
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: userId,
          name,
          role: 'barber',
          commission_percentage: commission_percentage || 50,
          is_active: true,
        }
      ]);

    if (profileError) {
      console.error('Error insertando perfil:', profileError);
      // Opcional: si falla el perfil, podríamos borrar el usuario de Auth para mantener consistencia
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Barbero creado exitosamente', userId });
  } catch (error) {
    console.error('Error interno:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
