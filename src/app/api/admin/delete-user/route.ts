import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { userId, requesterToken } = await req.json();

    if (!userId || !requesterToken) {
      return NextResponse.json({ error: 'User ID and Requester Token are required' }, { status: 400 });
    }

    // 1. Verificar la identidad del solicitante usando su token
    const { data: { user: requesterUser }, error: authError } = await supabaseAdmin.auth.getUser(requesterToken);

    if (authError || !requesterUser) {
      return NextResponse.json({ error: 'Invalid token or session expired' }, { status: 401 });
    }

    const requesterId = requesterUser.id;

    // 2. Obtener datos para autorización y limpieza
    const [
      { data: requesterProfile },
      { data: profileToDelete }
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('role').eq('id', requesterId).single(),
      supabaseAdmin.from('profiles').select('avatar_url').eq('id', userId).single()
    ]);

    const isOwner = requesterProfile?.role === 'owner';
    const isSelf = requesterId === userId;

    if (!isOwner && !isSelf) {
      return NextResponse.json({ error: 'Forbidden: No tienes permiso para esta acción' }, { status: 403 });
    }

    // --- PROCESO DE ELIMINACIÓN ESTRICTA (Admin Mode) ---

    // A. Limpiar Storage (Imágenes)
    if (profileToDelete?.avatar_url) {
      try {
        // Extraer el nombre del archivo de la URL pública
        // Ejemplo URL: .../storage/v1/object/public/avatars/nombre-archivo.png
        const urlParts = profileToDelete.avatar_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        if (fileName) {
          await supabaseAdmin.storage.from('avatars').remove([fileName]);
        }
      } catch (storageErr) {
        console.error('Error removing avatar from storage:', storageErr);
        // No bloqueamos la eliminación si falla el borrado de la imagen
      }
    }

    // B. Anonimizar citas (Preservar contabilidad)
    // Desvinculamos el ID pero la cita permanece con su precio y fecha
    await supabaseAdmin
      .from('appointments')
      .update({ 
        client_id: null,
        client_name: 'Usuario Eliminado (Privacidad)'
      })
      .eq('client_id', userId);

    await supabaseAdmin
      .from('appointments')
      .update({ barber_id: null })
      .eq('barber_id', userId);

    // B. Borrar perfil de la tabla pública
    await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    // C. Borrar el usuario del sistema de Autenticación de Supabase (Hard Delete)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error in auth.admin.deleteUser:', deleteError);
      return NextResponse.json({ error: 'Profile deleted but failed to remove from Auth system' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Account strictly deleted. Accounting data preserved.' 
    });

  } catch (error: unknown) {
    console.error('Strict Deletion Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
