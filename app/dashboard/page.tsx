'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Phone, MapPin, CheckCircle, Loader2 } from 'lucide-react'

const ESTADO_COLORS = {
  'Nuevo': 'text-gray-500 bg-gray-50',
  'Contactado': 'text-blue-600 bg-blue-50',
  'Seguimiento': 'text-orange-500 bg-orange-50',
  'Cerrado': 'text-green-600 bg-green-100',
  'Perdido': 'text-red-600 bg-red-100',
  'Cita Agendada': 'text-purple-600 bg-purple-50',
  'Link Enviado': 'text-cyan-600 bg-cyan-50',
};

export default function Dashboard() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filtroEstado, setFiltroEstado] = useState('Todos los estados');
  const [filtroProvincia, setFiltroProvincia] = useState('Todas las provincias');
  const [busqueda, setBusqueda] = useState('');
 

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
    const rawId = localStorage.getItem('user_id')
    const comercialId = rawId?.replace(/['"]+/g, '')

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

  const leadsFiltrados = leads.filter(lead => {
    const coincideEstado = filtroEstado === 'Todos los estados' || lead.estado_pagos === filtroEstado;
    const coincideProvincia = filtroProvincia === 'Todas las provincias' || lead.provincia === filtroProvincia;
    const coincideBusqueda = lead.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) || 
                            lead.telefono?.includes(busqueda);

    return coincideEstado && coincideProvincia && coincideBusqueda;
  });

  return (
    <div className="p-5 bg-gray-50 min-h-screen absolute w-full ">
      <div className="max-w-500 mx-auto">
        <div className="flex justify-between items-left mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Leads Activos - LSO</h1>
          <button onClick={handleLogout}className="absolute bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-5 px-4 rounded-lg transition-all shadow-sm right-4 top-4">
          Cerrar Sesión
          </button>
        </div>
        {loading ? (
        <div className="flex justify-left mt-20">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Todos los estados</option>
              <option>Nuevo</option>
              <option>Contactado</option>
              <option>Seguimiento</option>
              <option>Cita Agendada</option>
              <option>Link enviado</option>
            </select>
            <select 
              value={filtroProvincia}
              onChange={(e) => setFiltroProvincia(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Todas las provincias</option>
              <option>Barcelona</option>
              <option>Sevilla</option>
              <option>Murcia</option>
              <option>Valencia</option>
            </select>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              </span>
              <input 
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-5 pr-4 py-2 border border-slate-300 rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 overflow-hidden">
          {leads.length === 0 ? (
            <p className="text-gray-500 text-left py-10">No hay leads activos en este momento.</p>
          ) : (
              
              <div className="overflow-x-auto">
                <div className="overflow-x-auto">
                <table className="min-w-full  divide-gray-200 text-[14px]">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Fecha</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Estado</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Llamar</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Hora</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Nombre Completo</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Teléfono</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Provincia</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Laboral</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">I. Deuda</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Pagos?</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Embargos</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Preocupación</th>
                    </tr>{leadsFiltrados.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50  text-gray-800">
                        {/* Fecha Entrada, con formato sin year.*/}
                        <td className="px-1 py-3 text-gray-600 whitespace-nowrap text-[14px]">
                          {lead.fecha_creacion ? new Date(lead.fecha_creacion).toLocaleDateString('es-ES', {day: '2-digit', month: 'short' } ).toUpperCase() : '-'}
                        </td>
                        {/* Estado Lead */}
                        <td className="px-1 py-1">
                          <select 
                            value={lead.estado_pagos || 'Nuevo'} 
                            onChange={(e) => updateField(lead.id, 'estado_pagos', e.target.value)}
                            className={`p-1 font-bold text-[14px] rounded border-none appearance-none cursor-pointer ${
                              ESTADO_COLORS[lead.estado_pagos as keyof typeof ESTADO_COLORS] || 'text-gray-500 bg-gray-50'
                            }`}
                          >
                            <option value="Nuevo" className="text-gray-500 bg-gray-50">Nuevo</option>
                            <option value="Contactado" className="text-blue-600 bg-blue-50">Contactado</option>
                            <option value="Seguimiento" className="text-orange-500 bg-orange-50">Seguimiento</option>
                            <option value="Cerrado" className="text-green-600 bg-green-100">Cerrado</option>
                            <option value="Perdido" className="text-red-600 bg-red-100">Perdido</option>
                            <option value="Cita Agendada" className="text-purple-600 bg-purple-50">Cita-Agendada</option>
                            <option value="Link Enviado" className="text-cyan-600 bg-cyan-50">Link-Enviado</option>
                          </select>
                        </td>
                        {/* Llamar (Momento) */}
                        <td className="px-1 py-5 text-gray-600 whitespace-nowrap text-[14px]">
                          {lead.llamar_momento || '-'}
                        </td>
                        {/* Hora */}
                        <td className="px-1 py-5 text-gray-600 whitespace-nowrap text-[14px]">
                          {lead.horario_llamada || '-'}
                        </td>
                        {/* Nombre Completo */}
                        <td className="px-1 py-5 text-[14px] font-bold text-slate-600 whitespace-nowrap">
                          {lead.nombre_completo || ''}
                        </td>

                        {/* Teléfono */}
                        <td className="px-1 py-5 text-gray-600 text-[14px]">
                          {lead.telefono || ''}
                        </td>

                        {/* Provincia */}
                        <td className="px-1 py-5 text-gray-600 italic text-[14px]">
                          {lead.provincia || ''}
                        </td>

                        {/* Situación */}
                        <td className="px-1 py-5 text-[14px]">
                          {lead.situacion || ''}
                        </td>

                        {/* Deuda */}
                        <td className="px-1 py-5 text-[14px]">
                          {lead.importe_deuda || ''}
                        </td>
                        
                        {/* Como vas con los pagos? */}
                        <td className="px-1 py-5">
                          {lead.situacion_pagos || ''}
                        </td>

                        {/* Embargos */}
                        <td className="px-1 py-5 text-center">
                          <select 
                            value={lead.embargos || ''} 
                            onChange={(e) => updateField(lead.id, 'embargos', e.target.value)}
                            className={`px-2 py-1 w-full font-bold ${lead.embargos === 'Si' ? 'text-red-500' : ''}`}
                          >
                            <option value="No">No</option>
                            <option value="Si">Si</option>
                          </select>
                        </td>

                        {/* Que te preocupa */}
                        <td className="px-1 py-5 text-[14px]">
                          {lead.preocupacion || ''}
                        </td>
                      </tr>
                    ))}
                  </thead>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Ingresos</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Vivienda</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Hipoteca</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">D.Púb.</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Entrada</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Fecha1ªC.</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Cuota</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">T.Cuotas</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">H.E.</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Motivo NC</th>
                      <th className="px-1 py-3 text-left font-bold text-slate-900">Recomendado?</th>
                      <th className="px-1 py-3 text-center font-bold text-slate-900"></th>
                  <tbody className="divide-y divide-gray-100">
                    {leadsFiltrados.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50 transition-colors border-b text-gray-800">
                        {/* Ingresos Mensuales */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.ingresos_mensuales || ''}
                            onChange={(e) => updateField(lead.id, 'ingresos_mensuales', e.target.value)}
                            className="w-20 p-1  text-center text-[14px] font-semibold"
                            placeholder="€"
                          />
                        </td>

                        {/* Vivienda Propiedad */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.vivienda_propiedad || ''} 
                            onChange={(e) => updateField(lead.id, 'vivienda_propiedad', e.target.value)}
                            className="w-20 p-1 text-[14px] font-semibold"
                          >
                            <option value="No">No</option>
                            <option value="Si">Si</option>
                          </select>
                        </td>

                        {/* Hipoteca */}
                        <td className="px-1 py-5">
                          <input
                            type="text"
                            value={lead.hipoteca || ''}
                            onChange={(e) => updateField(lead.id, 'hipoteca', e.target.value)}
                            className="w-20 p-1  text-[14px]"
                            placeholder="€"
                          />
                        </td>

                        {/* Deuda Pública */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.deuda_publica || ''}
                            onChange={(e) => updateField(lead.id, 'deuda_publica', e.target.value)}
                            className="w-20 p-1  text-[14px]"
                            placeholder="Importe"
                          />
                        </td>

                        {/* Entrada Importe */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.entrada_importe || ''} 
                            onChange={(e) => updateField(lead.id, 'entrada_importe', e.target.value)}
                            className="w-40 p-1 text-[14px] font-semibold"
                          >
                            <option value="">-</option>
                            <option>1000</option>
                            <option>500</option>
                            <option>250</option>
                          </select>
                        </td>
                        
                        {/* Fecha 1ra Cuota */}
                        <td className="px-1 py-5">
                          <input 
                            type="date" 
                            value={lead.fecha_primera_cuota || ''}
                            onChange={(e) => updateField(lead.id, 'fecha_primera_cuota', e.target.value)}
                            className="border rounded px-2 py-1.5 text-xs w-30 outline-none"                         
                          />
                        </td>

                        {/* Cuota */}
                        <td className="px-1 py-4">
                          <select 
                            value={lead.cuota_importe || ''}
                            onChange={(e) => updateField(lead.id, 'cuota_importe', e.target.value)}
                            className="w-full p-1 text-[14px] font-semibold"
                          >
                            <option value="">-</option>
                            <option>1000</option>
                            <option>500</option>
                            <option>400</option>
                            <option>300</option>
                            <option>200</option>
                          </select>
                        </td>

                        {/* Total Cuotas */}
                        <td className="px-1 py-5">
                          <input 
                            type="text" 
                            value={lead.total_cuotas || ''}
                            onChange={(e) => updateField(lead.id, 'total_cuotas', e.target.value)}
                            className="w-20 p-1 text-[14px] font-semibold"
                          />
                        </td>

                        {/* H.E. Firmada */}
                        <td className="px-1 py-5 text-center">
                          <select 
                            value={lead.he_firmada || 'No'} 
                            onChange={(e) => updateField(lead.id, 'he_firmada', e.target.value)}
                            className={`w-full p-1  font-bold ${lead.he_firmada === 'Si' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}
                          >
                            <option className="text-red-600 bg-red-50" value="No">No</option>
                            <option className="text-green-600 bg-green-100" value="Si">Si</option>
                          </select>
                        </td>

                        {/* Motivo No Cierre */}
                        <td className="px-1 py-5">
                          <select 
                            value={lead.motivo_no_cierre || ''} 
                            onChange={(e) => updateField(lead.id, 'motivo_no_cierre', e.target.value)}
                            className="w-full p-1  text-[14px] font-semibold"
                          >
                            <option value="">-</option>
                            <option>Precio</option>
                            <option>Miedo</option>
                            <option>No contacto</option>
                            <option>Deuda baja</option>
                          </select>
                        </td>

                        {/* Recomendado? */}
                        <td className="px-1 py-5 text-center">
                          <select
                            value={lead.recomendado || 'No'}
                            onChange={(e) => updateField(lead.id, 'recomendado', e.target.value)}
                            className={`w-full p-1  font-bold ${lead.recomendado === 'Si' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}
                          >
                            <option value="No">No</option>
                            <option value="Si">Si</option>
                          </select>
                        </td>

                        {/* Cerrar Venta */}
                        <td className="px-1 py-5 text-center">
                          <button onClick={() => cerrarVenta(lead.id)}
                          className=" bg-gray-50 text-black px-2 py-1 rounded text-[16px] font-bold hover:bg-gray-200 shadow-sm transition-all active:scale-95">
                            Cerrar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}