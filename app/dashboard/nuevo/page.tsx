'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft, Clipboard, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NuevoLead() {
  const router = useRouter()
  const [rawData, setRawData] = useState('')
  const [loading, setLoading] = useState(false)

  const procesarYGuardar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rawData.trim()) return alert("Pega los datos del lead primero")
    
    setLoading(true)

    const extract = (regex: RegExp) => {
      const match = rawData.match(regex)
      return match ? match[1].trim() : null
    }

    // --- LÓGICA DE FORMATEO DE DEUDA ---
    const deudaRaw = extract(/Importe deuda:\s*(.*?)(?:\s*Situación pagos:|$)/i) || ""
    const deudaBonita = deudaRaw.replace(/_/g, " ").replace(/\s+/g, " ").trim()

    // --- SITUACIÓN PAGOS ---
    const situacionPagosRaw = extract(/Situación pagos:\s*(.*)/i) || ""
    const situacionPagosBonita = situacionPagosRaw.replace(/_/g, " ").replace(/\s+/g, " ").trim()

    // --- OBJETO FINAL PARA SUPABASE ---
    const nuevoLead = {
      nombre_completo: extract(/Nombre:\s*(.*)/i),
      telefono: extract(/Teléfono:\s*(.*)/i),
      provincia: extract(/Provincia:\s*(.*)/i),
      estado: 'nuevo',
      situacion: extract(/Situación:\s*(.*)/i), 
      importe_deuda: deudaBonita,
      situacion_pagos: situacionPagosBonita,
      preocupacion: extract(/Preocupación:\s*(.*)/i),
      ingresos: extract(/Ingresos:\s*(.*)/i),
      dni_nie: extract(/DNI:\s*(.*)/i),
      fecha_creacion: new Date().toISOString(),
      // Campos extra para evitar errores de validación en tu DB
      w1: false,
      w2: false,
      w3: false,
      he_firmada: 'No'
    }

    const { error } = await supabase
      .from('leads')
      .insert([nuevoLead])

    if (error) {
      console.error("Error al insertar:", error)
      alert("Error al guardar: " + error.message)
    } else {
      alert("¡Lead de " + nuevoLead.nombre_completo + " guardado con éxito!")
      setRawData('') // Limpiar el área de texto
      router.push('/gerencia') // Redirigir a la vista anterior.
    }
    setLoading(false)
}

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      <div className="max-w-2xl mx-auto">
        <Link href="/administrador" className="flex items-center gap-2 text-gray-600 mb-6 hover:text-black transition">
          <ArrowLeft size={20} /> Regresar al Panel
        </Link>

        <h1 className="text-3xl font-bold mb-2">Entrada Rápida de Leads</h1>
        <p className="text-gray-500 mb-8">Pega el bloque de texto del correo y el sistema identificará los campos automáticamente.</p>

        <form onSubmit={procesarYGuardar} className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-bold text-blue-600 mb-3 uppercase">
              <Clipboard size={18} /> Contenido del Formulario
            </label>
            
            <textarea 
              required
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Nombre: Miguel Angel...&#10;Teléfono: +34...&#10;Provincia: Zaragoza..."
              className="w-full h-80 p-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm resize-none"
            />

            <button 
              disabled={loading} 
              type="submit" 
              className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition mt-6 shadow-lg shadow-blue-100"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <><Save size={20} /> PROCESAR Y GUARDAR EN BASE DE DATOS</>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs text-amber-700 leading-relaxed">
            <strong>Nota:</strong> Asegúrate de que el texto incluya las etiquetas (Nombre:, Teléfono:, etc.) tal cual llegan en el correo para que el sistema pueda mapearlas correctamente a las columnas de Supabase.
          </p>
        </div>
      </div>
    </div>
  )
}