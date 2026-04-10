'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Phone, MapPin, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .neq('estado', 'cerrado')
      .order('fecha_creacion', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function cerrarVenta(leadId: string) {
  const comercialId = localStorage.getItem('user_id')
  if (!comercialId) {
    alert("Error: No se ha identificado al usuario. Por favor, vuelve a iniciar sesión.")
    return
  }

  const confirmacion = confirm("¿Confirmas que se ha realizado el pago y quieres cerrar esta venta?")
  if (!confirmacion) return

  const { error: err1 } = await supabase
    .from('leads')
    .update({ estado: 'cerrado' })
    .eq('id', leadId)


  const { error: err2 } = await supabase
    .from('comisiones')
    .insert([{ 
      comercial_id: comercialId,
      lead_id: leadId, 
      monto: 40 // Comisión fija de 40€ por venta cerrada.
    }])

  if (err1 || err2) {
    console.error("Error al cerrar venta:", err1 || err2)
    alert("Hubo un error al procesar el cierre.")
    return
  }

  alert("¡Venta cerrada con éxito!")
  fetchLeads()
}

  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin" /></div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Leads Activos - LSO</h1>
          <Link href="/dashboard/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            + Nuevo Lead
          </Link>
        </div>

        <div className="grid gap-4">
          {leads.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No hay leads activos en este momento.</p>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-full text-blue-600">
                    <User size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{lead.nombre_completo}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-500 text-sm mt-1">
                      <span className="flex items-center gap-1 font-medium text-blue-600">
                        <Phone size={14}/> {lead.telefono}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14}/> {lead.provincia}
                      </span>
                      {/* Nuevos campos visuales */}
                      <span className="bg-green-50 text-green-700 px-2 rounded font-bold">
                        💰 {lead.ingresos}€
                      </span>
                      <span className="bg-red-50 text-red-700 px-2 rounded font-bold">
                        📉 Deuda: {lead.deuda_publica}€
                      </span>
                      <span className={`px-2 rounded font-bold ${lead.embargos === 'Sí' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                        🚫 Embargos: {lead.embargos}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => cerrarVenta(lead.id)}
                  className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold shadow-sm w-full md:w-auto justify-center"
                >
                  <CheckCircle size={18} /> Cerrar Venta
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}