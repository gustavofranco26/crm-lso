import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inicializamos Supabase con las variables de entorno que ya tienes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Usa la Service Role para saltar RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { error } = await supabase
      .from('leads')
      .insert([
        {
          nombre_completo: body.nombre_completo,
          telefono: body.telefono,
          provincia: body.provincia,
          estado: 'nuevo',
          // Limpiamos los guiones bajos de Meta automáticamente
          situacion: body.situacion?.replace(/_/g, " "),
          importe_deuda: body.importe_deuda?.replace(/_/g, " "),
          situacion_pagos: body.situacion_pagos?.replace(/_/g, " "),
          preocupacion: body.preocupacion,
          ingresos: parseInt(body.ingresos || "0"),
          dni_nie: body.dni_nie,
          fecha_creacion: new Date().toISOString(),
          he_firmada: 'No',
          w1: false,
          w2: false,
          w3: false
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ message: "Lead guardado correctamente" }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}