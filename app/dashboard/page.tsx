'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Phone, MapPin, CheckCircle, Loader2, Search, LogOut } from 'lucide-react'

const ESTADO_COLORS = {
  'Nuevo': 'border border-gray-400 text-gray-500 bg-gray-50',
  'Contactado': ' border border-blue-400 text-blue-600 bg-blue-50',
  'Seguimiento': 'border border-orange-400 text-orange-500 bg-orange-50',
  'Cerrado': 'border border-green-400 text-green-600 bg-green-100 leading-tight',
  'Perdido': 'border border-red-400 text-red-600 bg-red-100 leading-tight',
  'Cita Agendada': 'border border-purple-400 text-purple-600 bg-purple-50',
  'Link Enviado': 'border border-cyan-400 text-cyan-600 bg-cyan-50',
};

export default function Dashboard() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<any>(null)
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
    const rawId = localStorage.getItem('user_id');
    const comercialId = rawId?.replace(/['"]+/g, '');

    if (!comercialId) {
        alert("Error: Usuario no identificado.");
        return;
    }

    const confirmacion = confirm("¿Confirmas que se ha realizado el pago?");
    if (!confirmacion) return;

    // 1. Actualizamos el estado del lead
    const { error: err1 } = await supabase
        .from('leads')
        .update({ estado: 'cerrado' })
        .eq('id', leadId);

    // 2. Insertamos la comisión
    const { error: err2 } = await supabase
        .from('comisiones')
        .insert([{ 
            id_usuario: comercialId,
            id_lead: leadId, 
            monto: 40 
        }]);

    if (err1 || err2) {
        console.error("Error al cerrar venta:", err1 || err2);
        alert("Hubo un error al procesar el cierre.");
        return;
    }

    alert("¡Venta Contratada con éxito!");
    
    // 3. Importante: Limpiamos el lead seleccionado para que desaparezca el panel derecho
    setSelectedLead(null); 
    
    // 4. Refrescamos la lista general
    fetchLeads();
}

  const calcularPlanPagos = (entrada: string, cuotaPersonalizada?: string) => {
  const TOTAL_LSO = 5200;
  const valorEntrada = parseInt(entrada || '0');
  const saldoPendiente = TOTAL_LSO - valorEntrada;
  
  if (saldoPendiente <= 0) return { cuota: '', cantidad: '' };

  // Si no nos pasan una cuota, usamos 500 por defecto
  let cuotaSugerida = cuotaPersonalizada ? parseInt(cuotaPersonalizada) : 500;
  
  const cantidadCuotasNormales = Math.floor(saldoPendiente / cuotaSugerida);
  const cuotaFinal = saldoPendiente % cuotaSugerida;

  const totalCuotas = cuotaFinal > 0 ? cantidadCuotasNormales + 1 : cantidadCuotasNormales;

  return {
    cuota: cuotaSugerida.toString(),
    cantidad: totalCuotas.toString()
  };
};

  const updateField = async(id: string, field: string, value: any) => {
    // Refresh veloz, aunque el cambio real se confirmará con la respuesta del servidor.
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    if (selectedLead?.id === id) setSelectedLead((prev: any) => ({ ...prev, [field]: value }))
    const { error } = await supabase.from('leads').update({ [field]: value }).eq('id', id)
    if (error) fetchLeads()
  }

  const leadsFiltrados = leads.filter(lead => {
    const coincideEstado = filtroEstado === 'Todos los estados' || lead.estado_pagos === filtroEstado;
    const coincideProvincia = filtroProvincia === 'Todas las provincias' || lead.provincia === filtroProvincia;
    const coincideBusqueda = lead.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) || 
                            lead.telefono?.includes(busqueda);

    return coincideEstado && coincideProvincia && coincideBusqueda;
  });

  return (
  <div className="flex flex-col h-screen bg-slate-100 font-sans overflow-hidden">
    {/* 1. SECCIÓN SUPERIOR: FILTROS DE COLORES */}
      <header className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
          {Object.entries(ESTADO_COLORS).map(([name, colorClass]) => (
            <button
              key={name}
              onClick={() => setFiltroEstado(name)}
              className={`px-4 py-2 rounded-lg border-2 font-bold text-xs transition-all active:scale-95 whitespace-nowrap ${colorClass} ${filtroEstado === name ? 'ring-2 ring-offset-1 ring-blue-400' : 'opacity-70'}`}
            >
              {name.toUpperCase()}
            </button>
          ))}
          <button onClick={() => setFiltroEstado('Todos los estados')} className="px-4 py-2 rounded-lg border-2 border-slate-300 text-slate-500 font-bold text-xs">TODOS</button>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors">
          <LogOut size={16} /> SALIR
        </button>
      </header>

      {/* CUERPO PRINCIPAL */}
      <main className="flex flex-1 overflow-hidden">
        
        {/* 2. IZQUIERDA (SIDEBAR): LISTA DE CLIENTES */}
        <div className="w-80 bg-white border-r flex flex-col shadow-inner">
          <div className="p-4 border-b space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" placeholder="Buscar cliente..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div> : 
              leadsFiltrados.map(lead => (
                <div 
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`p-4 border-b cursor-pointer transition-colors hover:bg-slate-50 ${selectedLead?.id === lead.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-slate-800 text-sm truncate w-40">{lead.nombre_completo}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(lead.fecha_creacion).toLocaleDateString('es-ES', {day:'2-digit', month:'short'})}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ESTADO_COLORS[lead.estado_pagos as keyof typeof ESTADO_COLORS] || 'bg-slate-100 text-slate-500'}`}>
                      {lead.estado_pagos}
                    </span>
                    <span className="text-[11px] text-slate-500 italic">{lead.provincia}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* 3. DERECHA: PANEL DE DETALLE (SECCIÓN MEDIA Y DERECHA) */}
        {selectedLead ? (
          <div className="flex-1 flex overflow-hidden">
            
            {/* SECCIÓN MEDIA: DATOS PERSONALES (AZUL) */}
            <section className="w-1/3 p-6 overflow-y-auto bg-white border-r">
              <div className="flex items-center gap-2 mb-6 border-b-2 border-blue-500 pb-2">
                <div className="bg-blue-500 p-2 rounded-lg text-white"><User size={20}/></div>
                <h2 className="text-lg font-bold text-slate-800">Datos del Lead</h2>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Estado Llamada', field: 'estado_pagos', type: 'select', options: ['Nuevo', 'Contactado', 'Seguimiento', 'Cerrado', 'Perdido', 'Cita Agendada', 'Link Enviado'] },
                  { label: 'Servicio', field: 'servicio_interes', type: 'select', options: ['-', 'Servicio 1', 'Servicio 2', 'Servicio 3'] },
                  { label: 'Teléfono', value: selectedLead.telefono },
                  { label: 'Provincia', value: selectedLead.provincia },
                  { label: 'Momento para llamar', value: selectedLead.llamar_momento },
                  { label: 'Horario', value: selectedLead.horario_llamada },
                  { label: 'Situación Laboral', value: selectedLead.situacion },
                  { label: 'Importe Deuda', value: selectedLead.importe_deuda },
                  { label: 'Preocupación', value: selectedLead.preocupacion },
                  { label: 'Embargos', field: 'embargos', type: 'select', options: ['No', 'Si'] },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">{item.label}</span>
                    {item.type === 'select' ? (
                      <select 
                        value={selectedLead[item.field!] || ''} 
                        onChange={(e) => updateField(selectedLead.id, item.field!, e.target.value)}
                        className="text-sm font-semibold bg-transparent outline-none mt-1"
                      >
                        {item.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm font-semibold text-slate-700 mt-1">{item.value || '-'}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* SECCIÓN DERECHA: DATOS ECONÓMICOS (VERDE) */}
            <section className="flex-1 p-6 overflow-y-auto bg-slate-50">
              <div className="flex items-center gap-2 mb-6 border-b-2 border-green-500 pb-2">
                <div className="bg-green-600 p-2 rounded-lg text-white"><CheckCircle size={20}/></div>
                <h2 className="text-lg font-bold text-slate-800">Cálculo LSO & Pagos</h2>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-green-600 uppercase">Ingresos Mensuales</label>
                  <input type="text" value={selectedLead.ingresos_mensuales || ''} onChange={(e) => updateField(selectedLead.id, 'ingresos_mensuales', e.target.value)} className="border rounded p-2 text-sm font-bold w-full bg-slate-50" placeholder="€"/>
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-green-600 uppercase">Vivienda Propia</label>
                  <select value={selectedLead.vivienda_propiedad || 'No'} onChange={(e) => updateField(selectedLead.id, 'vivienda_propiedad', e.target.value)} className="border rounded p-2 text-sm font-bold bg-slate-50">
                    <option value="No">No</option>
                    <option value="Si">Si</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-green-600 uppercase">Entrada</label>
                  <select 
                    value={selectedLead.entrada_importe || ''} 
                    onChange={(e) => {
                      const v = e.target.value;
                      updateField(selectedLead.id, 'entrada_importe', v);
                      const plan = calcularPlanPagos(v);
                      updateField(selectedLead.id, 'cuota_importe', plan.cuota);
                      updateField(selectedLead.id, 'total_cuotas', plan.cantidad);
                    }}
                    className="border-2 border-green-200 rounded p-2 text-sm font-bold bg-green-50"
                  >
                    <option value="">-</option>
                    {['3000','2000','1500','1000','500','300'].map(v => <option key={v} value={v}>{v}€</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-green-600 uppercase">Cuota Mensual</label>
                  <select 
                    value={selectedLead.cuota_importe || ''}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateField(selectedLead.id, 'cuota_importe', v);
                      const plan = calcularPlanPagos(selectedLead.entrada_importe, v);
                      updateField(selectedLead.id, 'total_cuotas', plan.cantidad);
                    }}
                    className="border-2 border-green-200 rounded p-2 text-sm font-bold bg-green-50"
                  >
                    <option value="500">500</option>
                    <option value="300">300</option>
                    <option value="250">250</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-green-600 uppercase">Nº de Cuotas Totales</label>
                  <input type="text" readOnly value={selectedLead.total_cuotas || ''} className="border rounded p-2 text-sm font-black text-center bg-gray-100 text-slate-800"/>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-green-600 uppercase">Fecha 1ª Cuota</label>
                  <input type="date" value={selectedLead.fecha_primera_cuota || ''} onChange={(e) => updateField(selectedLead.id, 'fecha_primera_cuota', e.target.value)} className="border rounded p-2 text-sm font-bold bg-slate-50"/>
                </div>

                <div className="col-span-2 mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                       <label className="text-[10px] font-bold text-slate-400">HE FIRMADA</label>
                       <select value={selectedLead.he_firmada || 'No'} onChange={(e) => updateField(selectedLead.id, 'he_firmada', e.target.value)} className={`font-bold text-sm outline-none ${selectedLead.he_firmada === 'Si' ? 'text-green-600' : 'text-red-500'}`}><option value="No">No</option><option value="Si">Si</option></select>
                    </div>
                    <div className="flex flex-col">
                       <label className="text-[10px] font-bold text-slate-400">RECOMENDADO</label>
                       <select value={selectedLead.recomendado || 'No'} onChange={(e) => updateField(selectedLead.id, 'recomendado', e.target.value)} className={`font-bold text-sm outline-none ${selectedLead.recomendado === 'Si' ? 'text-green-600' : 'text-red-500'}`}><option value="No">No</option><option value="Si">Si</option></select>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => cerrarVenta(selectedLead.id)}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all active:scale-95"
                  >
                    MARCAR CONTRATADO
                  </button>
                </div>
              </div>
            </section>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
            <Loader2 size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Selecciona un cliente de la lista para ver los detalles</p>
          </div>
        )}
      </main>
    </div>
  )
}