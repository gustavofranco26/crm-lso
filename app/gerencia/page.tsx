'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function PanelGerencia() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])

  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        // Corregido: usamos fecha_creacion que es el nombre real
        .order('fecha_creacion', { ascending: false })
      
      if (error) {
        console.error("Error:", error.message)
      } else {
        setLeads(data || [])
      }
    }
    fetchLeads()
  }, [])

  useEffect(() => {
    const rol = localStorage.getItem('user_role')
    if (rol !== 'gerencia' && rol !== 'ti' && rol !== 'contabilidad') {
      router.push('/dashboard')
    }
  }, [router])

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-[#4a86e8] p-4 text-white text-center font-bold text-2xl tracking-[0.2em]">
        VISTA - RESUMEN GERENCIA
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-[#93c47d] text-center uppercase font-bold text-[10px]">
              <th className="border border-gray-400 p-2 text-blue-800 italic">Cliente(Lead)</th>
              <th className="border border-gray-400 p-2">Provincia</th>
              <th className="border border-gray-400 p-1 bg-red-600 text-white">D. Pública</th>
              <th className="border border-gray-400 p-2 bg-[#f6b26b]">Ingresos</th>
              <th className="border border-gray-400 p-2 bg-[#ea9999]">Estado</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-10 text-gray-400">No hay leads registrados todavía.</td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="text-center hover:bg-slate-50">
                  <td className="border border-gray-400 p-2 uppercase italic">{l.nombre_completo}</td>
                  <td className="border border-gray-400 p-2 bg-[#fff2cc]">{l.provincia}</td>
                  <td className="border border-gray-400 p-2 text-red-600 font-bold">{l.deuda_publica || '0'}€</td>
                  <td className="border border-gray-400 p-2 font-bold">{l.ingresos || '0'}€</td>
                  <td className="border border-gray-400 p-2 uppercase font-bold italic">{l.estado}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}