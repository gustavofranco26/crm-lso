'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PanelGerencia() {
  const router = useRouter()
  const [comisiones, setComisiones] = useState<any[]>([])

  useEffect(() => {
    async function fetchComisiones() {
      const { data } = await supabase
        .from('comisiones')
        .select('*, usuarios(nombre), leads(nombre_completo, provincia)')
      setComisiones(data || [])
    }
    fetchComisiones()
  }, [])

  useEffect(() => {
    const rol = localStorage.getItem('user_role')
    // Si no es jefe o TI, no se muestra esta página y se redirige al dashboard.
    if (rol !== 'gerencia' && rol !== 'ti' && rol !== 'contabilidad') {
      router.push('/dashboard')
    }
  }, [])

  return (
    <div className="bg-white min-h-screen">
      {/* Cabecera Estilo Excel */}
      <div className="bg-[#4a86e8] p-4 text-white text-center font-bold text-2xl tracking-[0.2em]">
        VISTA - RESUMEN GERENCIA
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-[#93c47d] text-center uppercase font-bold text-[10px]">
              <th className="border border-gray-400 p-2">Comercial</th>
              <th className="border border-gray-400 p-2 text-blue-800 italic">Cliente(Lead)</th>
              <th className="border border-gray-400 p-2">Provincia</th>
              <th className="border border-gray-400 p-1 bg-red-600 text-white">D. Pública</th>
              <th className="border border-gray-400 p-2 bg-[#f6b26b]">Comisión</th>
              <th className="border border-gray-400 p-2 bg-[#ea9999]">Estado Pago</th>
            </tr>
          </thead>
          <tbody>
            {comisiones.map((c) => (
              <tr key={c.id} className="text-center hover:bg-slate-50">
                <td className="border border-gray-400 p-2 font-medium uppercase">{c.usuarios?.nombre}</td>
                <td className="border border-gray-400 p-2 uppercase italic">{c.leads?.nombre_completo}</td>
                <td className="border border-gray-400 p-2 bg-[#fff2cc]">{c.leads?.provincia}</td>
                <td className="border border-gray-400 p-2 text-red-600 font-bold">{c.leads?.deuda || '0'}€</td>
                <td className="border border-gray-400 p-2 font-bold">{c.monto}€</td>
                <td className="border border-gray-400 p-2 text-red-600 font-bold italic">PENDIENTE</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}