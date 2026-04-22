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
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-left mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Leads Activos - LSO</h1>
          <button onClick={handleLogout}className="absolute bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-5 px-4 rounded-lg transition-all shadow-sm right-4 top-4">
          Cerrar Sesión
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
          {leads.length === 0 ? (
            <p className="text-gray-500 text-left py-10">No hay leads activos en este momento.</p>
          ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-[11px]">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Estado Lead</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Fecha Entrada</th> 
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Nombre Completo</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Teléfono</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Provincia</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Situación</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Deuda</th>                      
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Como vas con los pagos?</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Embargos</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Que te preocupa</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Ingresos Mensuales</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Vivienda Propiedad</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Hipoteca</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Deuda Pública</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Llamar</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Hora</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Próxima Acción</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Fecha Próxima Acción</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Entrada</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Fecha 1ra Cuota</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Cuota</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Total Cuotas</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">H.E. Firmada</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Motivo No Cierre</th>
                      <th className="px-1 py-3 text-center font-bold text-slate-900">-</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors border-b">
                        {/* 1. Estado Lead */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.estado_lead || ''} 
                            onChange={(e) => updateField(lead.id, 'estado_lead', e.target.value)}
                            className="w-full p-1  font-bold text-green-600 bg-transparent"
                          >
                            <option value="">Nuevo</option>
                            <option>Contactado</option>
                            <option>Seguimiento</option>
                            <option>Cita Agendado</option>
                            <option>Link enviado</option>
                            <option>Cerrado</option>
                            <option>Perdido</option>
                          </select>
                        </td>

                        {/* 2. Fecha Entrada */}
                        <td className="px-1 py-5 text-gray-400 whitespace-nowrap">
                          {lead.fecha_creacion ? new Date(lead.fecha_creacion).toLocaleDateString() : '-'}
                        </td>

                        {/* 3. Nombre Completo */}
                        <td className="px-1 py-5 font-bold text-slate-600 min-w-[120px]">
                          {lead.nombre_completo || 'Sin nombre'}
                        </td>

                        {/* 4. Teléfono */}
                        <td className="px-1 py-5 text-gray-600">
                          {lead.telefono}
                        </td>

                        {/* 5. Provincia */}
                        <td className="px-1 py-5 text-gray-600 italic">
                          {lead.provincia}
                        </td>

                        {/* 6. Situación */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.situacion || ''} 
                            onChange={(e) => updateField(lead.id, 'situacion', e.target.value)}
                            className="w-full p-1 "
                          >
                            <option value="">-</option>
                            <option>Cuenta ajena</option>
                            <option>Autónomo</option>
                            <option>Desempleado</option>
                            <option>Pensionista</option>
                          </select>
                        </td>

                        {/* 7. Deuda */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.importe_deuda || ''} 
                            onChange={(e) => updateField(lead.id, 'importe_deuda', e.target.value)}
                            className="w-full p-1  font-semibold"
                          >
                            <option value="">-</option>
                            <option>10k - 20k</option>
                            <option>20k - 30k</option>
                            <option>30k - 50k</option>
                            <option>+ 50k</option>
                          </select>
                        </td>

                        {/* 8. Como vas con los pagos? */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.estado_pagos || ''} 
                            onChange={(e) => updateField(lead.id, 'estado_pagos', e.target.value)}
                            className="w-full p-1 "
                          >
                            <option value="">-</option>
                            <option>Al día, justo</option>
                            <option>Atrasos</option>
                            <option>No puede pagar</option>
                          </select>
                        </td>

                        {/* 9. Embargos */}
                        <td className="px-1 py-5 text-center">
                          <select 
                            value={lead.embargos || ''} 
                            onChange={(e) => updateField(lead.id, 'embargos', e.target.value)}
                            className={`w-full p-1  font-bold ${lead.embargos === 'Si' ? 'text-red-500' : ''}`}
                          >
                            <option value="No">No</option>
                            <option value="Si">Si</option>
                          </select>
                        </td>

                        {/* 10. Que te preocupa */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.que_te_preocupa || ''} 
                            onChange={(e) => updateField(lead.id, 'que_te_preocupa', e.target.value)}
                            className="w-full p-1 "
                          >
                            <option value="">-</option>
                            <option>No llego a pagar</option>
                            <option>Llamadas</option>
                            <option>Embargo</option>
                            <option>Empezar de cero</option>
                            <option>Otra</option>
                          </select>
                        </td>

                        {/* 11. Ingresos Mensuales */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.ingresos_mensuales || ''}
                            onChange={(e) => updateField(lead.id, 'ingresos_mensuales', e.target.value)}
                            className="w-12 p-1  text-center"
                            placeholder="€"
                          />
                        </td>

                        {/* 12. Vivienda Propiedad */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.vivienda_propiedad || ''} 
                            onChange={(e) => updateField(lead.id, 'vivienda_propiedad', e.target.value)}
                            className="w-full p-1 "
                          >
                            <option value="No">No</option>
                            <option value="Si">Si</option>
                          </select>
                        </td>

                        {/* 13. Hipoteca */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.hipoteca || ''}
                            onChange={(e) => updateField(lead.id, 'hipoteca', e.target.value)}
                            className="w-14 p-1  text-[10px]"
                            placeholder="Importe"
                          />
                        </td>

                        {/* 14. Deuda Pública */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.deuda_publica || ''}
                            onChange={(e) => updateField(lead.id, 'deuda_publica', e.target.value)}
                            className="w-14 p-1  text-[10px]"
                            placeholder="Importe"
                          />
                        </td>

                        {/* 15. Llamar (Momento) */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.llamar_momento || ''} 
                            onChange={(e) => updateField(lead.id, 'llamar_momento', e.target.value)}
                            className="w-full p-1 "
                          >
                            <option value="">-</option>
                            <option>Mañana</option>
                            <option>Mediodía</option>
                            <option>Tarde</option>
                          </select>
                        </td>

                        {/* 16. Hora */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.llamar_hora || ''}
                            onChange={(e) => updateField(lead.id, 'llamar_hora', e.target.value)}
                            className="w-10 p-1  text-center"
                            placeholder="00:00"
                          />
                        </td>

                        {/* 17. Próxima Acción */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.proxima_accion || ''}
                            onChange={(e) => updateField(lead.id, 'proxima_accion', e.target.value)}
                            className="w-20 p-1 "
                            placeholder="Acción..."
                          />
                        </td>

                        {/* 18. Fecha Próxima Acción */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.fecha_proxima_accion || ''}
                            onChange={(e) => updateField(lead.id, 'fecha_proxima_accion', e.target.value)}
                            className="w-16 p-1  text-[10px]"
                            placeholder="DD/MM"
                          />
                        </td>

                        {/* 19. Entrada */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.entrada_importe || ''} 
                            onChange={(e) => updateField(lead.id, 'entrada_importe', e.target.value)}
                            className="w-full p-1  font-bold"
                          >
                            <option value="">-</option>
                            <option>1000</option>
                            <option>500</option>
                            <option>300</option>
                          </select>
                        </td>

                        {/* 20. Fecha 1ra Cuota */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.fecha_primera_cuota || ''}
                            onChange={(e) => updateField(lead.id, 'fecha_primera_cuota', e.target.value)}
                            className="w-16 p-1  text-[10px]"
                          />
                        </td>

                        {/* 21. Cuota */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.cuota_importe || ''} 
                            onChange={(e) => updateField(lead.id, 'cuota_importe', e.target.value)}
                            className="w-full p-1 "
                          >
                            <option value="">-</option>
                            <option>1000</option><option>500</option><option>400</option>
                            <option>300</option><option>200</option>
                          </select>
                        </td>

                        {/* 22. Total Cuotas */}
                        <td className="px-1 py-5 text-center">
                          <input 
                            type="text" 
                            value={lead.total_cuotas || ''}
                            onChange={(e) => updateField(lead.id, 'total_cuotas', e.target.value)}
                            className="w-8 p-1  text-center"
                          />
                        </td>

                        {/* 23. H.E. Firmada */}
                        <td className="px-1 py-5 text-center">
                          <select 
                            value={lead.he_firmada || 'No'} 
                            onChange={(e) => updateField(lead.id, 'he_firmada', e.target.value)}
                            className={`w-full p-1  font-bold ${lead.he_firmada === 'Si' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}
                          >
                            <option value="No">No</option>
                            <option value="Si">Si</option>
                          </select>
                        </td>

                        {/* 24. Motivo No Cierre */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.motivo_no_cierre || ''} 
                            onChange={(e) => updateField(lead.id, 'motivo_no_cierre', e.target.value)}
                            className="w-full p-1  text-[10px]"
                          >
                            <option value="">-</option>
                            <option>Precio</option>
                            <option>Miedo</option>
                            <option>No contacto</option>
                            <option>Deuda baja</option>
                          </select>
                        </td>

                        {/* 25. Botón Acción */}
                        <td className="px-1 py-5 text-center">
                          <button className="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-bold hover:bg-green-700 shadow-sm transition-all active:scale-95">
                            CERRAR
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