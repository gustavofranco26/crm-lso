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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold text-gray-800">Luis Ramos Valcárcel</h1>
        <button onClick={handleLogout} className="absolute bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-5 px-4 rounded-lg transition-all shadow-sm right-4 top-4">
          Cerrar Sesión
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center mt-20">
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
          <p className="text-gray-500 text-center py-10">No hay leads activos en este momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-gray-200 text-[14px] border-separate border-spacing-y-0">
              {leadsFiltrados.map((lead) => (
                <tbody key={lead.id} className="border-b-2 border-gray-200">
                  {/* ENCABEZADO 1: DATOS PERSONALES */}
                  <tr className="bg-blue-400">
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Fecha</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Estado</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Llamar</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Hora</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Nombre Completo</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Teléfono</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Provincia</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Laboral</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">I. Deuda</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Pagos?</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Embargos</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Preocupación</th>
                  </tr>
                  
                  {/* FILA 1: VALORES PERSONALES */}
                  <tr className="hover:bg-slate-50 text-gray-800 border-b border-gray-100 text-center">
                    <td className="px-1 py-3 text-gray-600 uppercase">
                      {lead.fecha_creacion ? new Date(lead.fecha_creacion).toLocaleDateString('es-ES', {day: '2-digit', month: 'short' }).toUpperCase() : '-'}
                    </td>
                    <td className="px-1 py-1">
                      <select 
                        value={lead.estado_pagos || 'Nuevo'} 
                        onChange={(e) => updateField(lead.id, 'estado_pagos', e.target.value)}
                        className={`p-1 font-bold rounded border-none cursor-pointer ${ESTADO_COLORS[lead.estado_pagos as keyof typeof ESTADO_COLORS] || 'text-gray-500 bg-gray-50'}`}
                      >
                        <option value="Nuevo">Nuevo</option>
                        <option value="Contactado">Contactado</option>
                        <option value="Seguimiento">Seguimiento</option>
                        <option value="Cerrado">Cerrado</option>
                        <option value="Perdido">Perdido</option>
                        <option value="Cita Agendada">Cita-Agendada</option>
                        <option value="Link Enviado">Link-Enviado</option>
                      </select>
                    </td>
                    <td className="px-1 py-3">{lead.llamar_momento || '-'}</td>
                    <td className="px-1 py-3">{lead.horario_llamada || '-'}</td>
                    <td className="px-1 py-3 font-bold text-slate-600">{lead.nombre_completo || ''}</td>
                    <td className="px-1 py-3">{lead.telefono || ''}</td>
                    <td className="px-1 py-3 italic">{lead.provincia || ''}</td>
                    <td className="px-1 py-3">{lead.situacion || ''}</td>
                    <td className="px-1 py-3">{lead.importe_deuda || ''}</td>
                    <td className="px-1 py-3">{lead.situacion_pagos || ''}</td>
                    <td className="px-1 py-3 text-center">
                      <select 
                        value={lead.embargos || 'No'} 
                        onChange={(e) => updateField(lead.id, 'embargos', e.target.value)}
                        className={`px-2 py-1 w-full font-bold ${lead.embargos === 'Si' ? 'text-red-500' : ''}`}
                      >
                        <option value="No">No</option>
                        <option value="Si">Si</option>
                      </select>
                    </td>
                    <td className="px-1 py-3">{lead.preocupacion || ''}</td>
                  </tr>

                  {/* ENCABEZADO 2: DATOS ECONÓMICOS */}
                  <tr className="bg-green-700">
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Ingresos</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Vivienda</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Hipoteca</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">D.Púb.</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Entrada</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Fecha1ªC.</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Cuota</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">T.Cuotas</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">H.E.</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Motivo NC</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100">Recomendado?</th>
                    <th className="px-1 py-3 text-center font-bold text-slate-100"></th>
                  </tr>

                  {/* FILA 2: VALORES ECONÓMICOS */}
                  <tr className="hover:bg-slate-50 transition-colors text-gray-800 text-center">
                    <td className="px-1 py-5">
                      <input 
                        type="text" 
                        value={lead.ingresos_mensuales || ''}
                        onChange={(e) => updateField(lead.id, 'ingresos_mensuales', e.target.value)}
                        className="w-20 p-1 text-center font-semibold" placeholder="€"
                      />
                    </td>
                    <td className="px-1 py-5">
                      <select 
                        value={lead.vivienda_propiedad || 'No'} 
                        onChange={(e) => updateField(lead.id, 'vivienda_propiedad', e.target.value)}
                        className="w-20 p-1 font-semibold"
                      >
                        <option value="No">No</option>
                        <option value="Si">Si</option>
                      </select>
                    </td>
                    <td className="px-1 py-5">
                      <input 
                        type="text" 
                        value={lead.hipoteca || ''}
                        onChange={(e) => updateField(lead.id, 'hipoteca', e.target.value)}
                        className="w-20 p-1" placeholder="€"
                      />
                    </td>
                    <td className="px-1 py-5">
                      <input 
                        type="text" 
                        value={lead.deuda_publica || ''}
                        onChange={(e) => updateField(lead.id, 'deuda_publica', e.target.value)}
                        className="w-20 p-1" placeholder="Importe"
                      />
                    </td>
                    <td className="px-1 py-5">
                      <select 
                        value={lead.entrada_importe || ''} 
                        onChange={(e) => updateField(lead.id, 'entrada_importe', e.target.value)}
                        className="w-40 p-1 font-semibold"
                      >
                        <option value="">-</option>
                        <option value="1000">1000</option>
                        <option value="500">500</option>
                        <option value="250">250</option>
                      </select>
                    </td>
                    <td className="px-1 py-5">
                      <input 
                        type="date" 
                        value={lead.fecha_primera_cuota || ''}
                        onChange={(e) => updateField(lead.id, 'fecha_primera_cuota', e.target.value)}
                        className="border rounded px-2 py-1.5 text-xs w-30 outline-none"
                      />
                    </td>
                    <td className="px-1 py-4">
                      <select 
                        value={lead.cuota_importe || ''} 
                        onChange={(e) => updateField(lead.id, 'cuota_importe', e.target.value)}
                        className="w-full p-1 font-semibold"
                      >
                        <option value="">-</option>
                        <option value="1000">1000</option>
                        <option value="500">500</option>
                        <option value="400">400</option>
                        <option value="300">300</option>
                        <option value="200">200</option>
                      </select>
                    </td>
                    <td className="px-1 py-5">
                      <input 
                        type="text" 
                        value={lead.total_cuotas || ''}
                        onChange={(e) => updateField(lead.id, 'total_cuotas', e.target.value)}
                        className="w-20 p-1 font-semibold"
                      />
                    </td>
                    <td className="px-1 py-5 text-center">
                      <select 
                        value={lead.he_firmada || 'No'} 
                        onChange={(e) => updateField(lead.id, 'he_firmada', e.target.value)}
                        className={`w-full p-1 font-bold ${lead.he_firmada === 'Si' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}
                      >
                        <option value="No">No</option>
                        <option value="Si">Si</option>
                      </select>
                    </td>
                    <td className="px-1 py-5">
                      <select 
                        value={lead.motivo_no_cierre || ''} 
                        onChange={(e) => updateField(lead.id, 'motivo_no_cierre', e.target.value)}
                        className="w-full p-1 font-semibold"
                      >
                        <option value="">-</option>
                        <option>Precio</option>
                        <option>Miedo</option>
                        <option>No contacto</option>
                        <option>Deuda baja</option>
                      </select>
                    </td>
                    <td className="px-1 py-5 text-center">
                      <select 
                        value={lead.recomendado || 'No'} 
                        onChange={(e) => updateField(lead.id, 'recomendado', e.target.value)}
                        className={`w-full p-1 font-bold ${lead.recomendado === 'Si' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}
                      >
                        <option value="No">No</option>
                        <option value="Si">Si</option>
                      </select>
                    </td>
                    <td className="px-1 py-5 text-center">
                      <button 
                        onClick={() => cerrarVenta(lead.id)}
                        className="bg-blue-700 text-white px-2 py-1 rounded text-[16px] font-bold hover:bg-blue-800 shadow-sm transition-all active:scale-95"
                      >
                        Cerrar
                      </button>
                    </td>
                  </tr>
                  
                  {/* ESPACIO ENTRE LEADS */}
                  <tr className="h-15"><td colSpan={12} className="bg-gray-50"></td></tr>
                </tbody>
              ))}
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
)
}