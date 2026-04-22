'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Phone, MapPin, CheckCircle, Loader2 } from 'lucide-react'


export default function Dashboard() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/')
}

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    setLoading(true)

    const rawId = localStorage.getItem('user_id')
    const comercialId = rawId?.replace(/['"]+/g, '')

    if (!comercialId) {
      console.error("Error: No se ha identificado al usuario. Por favor, vuelve a iniciar sesión.")
      setLoading(false)
      return
    }

    const { data, error } = await supabase
    .from('leads')
    .select('*')
    .neq('estado', 'cerrado')
    .eq('asignado_a', comercialId)
    .order('fecha_creacion', { ascending: false })

  if (error) {
    console.error("Error al obtener leads:", error.message)
  } else {
    setLeads(data || [])
  }
  
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
      id_usuario: comercialId,
      id_lead: leadId, 
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


  const updateField = async(id: string, field: string, value: any) => {
    // Refresh veloz, aunque el cambio real se confirmará con la respuesta del servidor.
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))

    const { error } = await supabase
      .from('leads')
      .update({ [field]: value })
      .eq('id', id)

    if (error) {
      console.error("Error actualizando campo:", error.message)
      // Revertir cambio en UI si hay error, para revertir cambio local.
      fetchLeads()
    }
  };


  if (loading) return <div className="flex justify-left mt-20"><Loader2 className="animate-spin" /></div>

  return (
    <div className="p-25 bg-gray-50 min-h-screen relative">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-left mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Leads Activos - LSO</h1>
          <button onClick={handleLogout}className="absolute bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all uppercase shadow-sm right-4 top-4">
          Cerrar Sesión
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
          {leads.length === 0 ? (
            <p className="text-gray-500 text-left py-10">No hay leads activos en este momento.</p>
          ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Lead</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Situación</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Deuda</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Pagos</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Ingresos</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Estado Lead</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Acción</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Cierre</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Próxima Acción</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Llamar Hora</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Cerrar Venta</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">ID Lead</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Fecha Creación</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Última Actualización</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Asignado a</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Provincia</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Teléfono</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Email</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Nombre Cliente</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Situación Laboral</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Importe Deuda</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Estado Pagos</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Ingresos Mensuales</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Estado Lead</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Próxima Acción</th>
                      <th className="px-2 py-3 text-left font-bold text-slate-600 uppercase">Hora Llamada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                        {/* INFORMACIÓN BÁSICA */}
                        <td className="px-2 py-4">
                          <div className="font-bold text-slate-900 uppercase">{lead.nombre_completo || 'Sin nombre'}</div>
                          <div className="text-slate-500">{lead.telefono}</div>
                          <div className="text-[10px] text-blue-600 italic">{lead.provincia}</div>
                        </td>
                        {/* SITUACIÓN LABORAL */}
                        <td className="px-2 py-4">
                          <select 
                            value={lead.situacion || ''} 
                            onChange={(e) => updateField(lead.id, 'situacion', e.target.value)}
                            className="w-full p-1 border rounded bg-white"
                          >
                            <option value="">Seleccionar...</option>
                            <option>Cuenta ajena</option>
                            <option>Autónomo</option>
                            <option>Desempleado</option>
                            <option>Pensionista</option>
                          </select>
                        </td>

                        {/* DEUDA */}
                        <td className="px-2 py-4">
                          <select 
                            value={lead.importe_deuda || ''} 
                            onChange={(e) => updateField(lead.id, 'importe_deuda', e.target.value)}
                            className="w-full p-1 border rounded font-medium"
                          >
                            <option>10k - 20k</option>
                            <option>20k - 30k</option>
                            <option>30k - 50k</option>
                            <option>+ 50k</option>
                          </select>
                        </td>

                        {/* ESTADO PAGOS */}
                        <td className="px-2 py-4">
                          <select 
                            value={lead.estado_pagos || ''} 
                            onChange={(e) => updateField(lead.id, 'estado_pagos', e.target.value)}
                            className="w-full p-1 border rounded"
                          >
                            <option>Al día</option>
                            <option>Atrasos</option>
                            <option>No puede</option>
                          </select>
                        </td>

                        {/* INGRESOS */}
                        <td className="px-2 py-4">
                          <input 
                            type="text" 
                            placeholder="€/mes"
                            value={lead.ingresos_mensuales || ''}
                            onChange={(e) => updateField(lead.id, 'ingresos_mensuales', e.target.value)}
                            className="w-16 p-1 border rounded text-left"
                          />
                        </td>

                        {/* ESTADO LEAD */}
                        <td className="px-2 py-4">
                          <select 
                            value={lead.estado || 'Nuevo'} 
                            onChange={(e) => updateField(lead.id, 'estado', e.target.value)}
                            className="w-full p-1 border rounded font-bold text-blue-700 uppercase"
                          >
                            <option>Nuevo</option>
                            <option>Contactado</option>
                            <option>Seguimiento</option>
                            <option>Cerrado</option>
                            <option>Perdido</option>
                          </select>
                        </td>

                        {/* PRÓXIMA ACCIÓN */}
                        <td className="px-2 py-4">
                          <div className="flex flex-col gap-1">
                            <input 
                              type="text" 
                              placeholder="¿Qué hacer?"
                              className="p-1 border rounded w-24"
                              onChange={(e) => updateField(lead.id, 'proxima_accion', e.target.value)}
                            />
                            <input 
                              type="text" 
                              placeholder="Hora"
                              className="p-1 border rounded w-24"
                              onChange={(e) => updateField(lead.id, 'llamar_hora', e.target.value)}
                            />
                          </div>
                        </td>

                        {/* BOTÓN CIERRE */}
                        <td className="px-2 py-4 text-left">
                          <button className="bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-700 shadow-sm active:scale-95 transition-all uppercase tracking-tighter">
                            Cerrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          )}
        </div>
      </div>
    </div>
  )
}