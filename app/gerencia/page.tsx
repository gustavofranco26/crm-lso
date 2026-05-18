'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/dist/client/link'

export default function PanelGerencia() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [comerciales, setComerciales] = useState<any[]>([])
  const [mostrarModal, setMostrarModal] = useState(false)
  const [leadSeleccionado, setLeadSeleccionado] = useState<string | null>(null)
  const [selectedComercialFilter, setSelectedComercialFilter] = useState('Todos')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/')
}

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('fecha_creacion', { ascending: false })
    
    if (error) console.error("Error:", error.message)
    else setLeads(data || [])
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    const rol = localStorage.getItem('user_role')
    if (rol !== 'gerencia' && rol !== 'ti' && rol !== 'contabilidad') {
      router.push('/dashboard')
    }
  }, [router])

  useEffect(() => {
    async function cargarComerciales() {
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('rol', 'comercial')
      if (data) setComerciales(data)
    }
    cargarComerciales()
  }, [])

  const handleAsignar = (leadId: string) => {
    setLeadSeleccionado(leadId)
    setMostrarModal(true)
  }

  const getComercialNombre = (comercialId: string | null | undefined) => {
    if (!comercialId) return 'Sin asignar'
    const comercial = comerciales.find((c) => c.id === comercialId)
    return comercial ? comercial.nombre : comercialId
  }

  const isOpenLead = (lead: any) => !lead.situacion_final || lead.situacion_final === 'Libre' || lead.situacion_final === '-';
  const totalLeadsCount = leads.length;
  const openLeadCount = leads.filter(isOpenLead).length;

  const comercialOpenCounts = leads.reduce((acc, lead) => {
    if (!isOpenLead(lead)) return acc;
    const key = lead.asignado_a || 'Sin asignar';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredLeads = leads.filter((lead) => {
    if (selectedComercialFilter === 'Todos') return true;

    if (selectedComercialFilter === 'En Gestión') return isOpenLead(lead);
    
    if (!isOpenLead(lead)) return false;
    return getComercialNombre(lead.asignado_a) === selectedComercialFilter;
  });

  const ejecutarAsignacion = async (comercialId: string) => {
    if (!leadSeleccionado) return

    const { error } = await supabase
      .from('leads')
      .update({ asignado_a: comercialId })
      .eq('id', leadSeleccionado)

    if (error) {
      alert("Error: " + error.message)
    } else {
      alert("Asignado correctamente")
      setMostrarModal(false)
      fetchLeads()
    }
  }

  return (
    <div className="bg-white min-h-screen relative">
      <header className="bg-[#4a86e8] p-4 text-white shadow-md">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className="text-center lg:text-left font-bold text-2xl tracking-widest[0.1em]">
              Vista - Resumen Gerencia
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedComercialFilter('Todos')}
                className={`rounded-full border px-3 py-2 text-[12px] font-semibold transition ${selectedComercialFilter === 'Todos' ? 'bg-white text-slate-800 border-white shadow-sm' : 'bg-blue-600 text-white border-transparent hover:bg-blue-500'}`}>
                Todos
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-2 text-[11px] font-semibold text-slate-900">
                  {totalLeadsCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedComercialFilter('En Gestión')} // <-- Cambiado el filtro
                className={`rounded-full border px-3 py-2 text-[12px] font-semibold transition ${selectedComercialFilter === 'En Gestión' ? 'bg-white text-slate-800 border-white shadow-sm' : 'bg-blue-600 text-white border-transparent hover:bg-blue-500'}`}>
                En Gestión
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-2 text-[11px] font-semibold text-slate-900">
                  {openLeadCount} {/* <-- Recuperamos el contador original de abiertos */}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedComercialFilter('Sin asignar')}
                className={`rounded-full border px-3 py-2 text-[12px] font-semibold transition ${selectedComercialFilter === 'Sin asignar' ? 'bg-white text-slate-800 border-white shadow-sm' : 'bg-blue-600 text-white border-transparent hover:bg-blue-500'}`}>
                Sin asignar
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-2 text-[11px] font-semibold text-slate-900">
                  {comercialOpenCounts['Sin asignar'] ?? 0}
                </span>
              </button>
              {comerciales.map((comercial) => (
                <button
                  key={comercial.id}
                  type="button"
                  onClick={() => setSelectedComercialFilter(comercial.nombre)}
                  className={`rounded-full border px-3 py-2 text-[12px] font-semibold transition ${selectedComercialFilter === comercial.nombre ? 'bg-white text-slate-800 border-white shadow-sm' : 'bg-blue-600 text-white border-transparent hover:bg-blue-500'}`}>
                  {comercial.nombre}
                  <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-2 text-[11px] font-semibold text-slate-900">
                    {comercialOpenCounts[comercial.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Link href="/dashboard/nuevo" className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition">
              Nuevo Lead
            </Link>
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-3 rounded-lg transition-all uppercase shadow-sm"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>
      <div className="overflow-x-auto p-4">
        <table className="border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-[#93c47d] text-center uppercase font-bold text-[10px]">
              <th className="w-80 border border-gray-400 p-2 text-white ">Cliente(Lead)</th>
              <th className="w-40 border border-gray-400 p-2">Provincia</th>
              <th className="w-32 border border-gray-400 p-2">Teléfono</th>
              <th className="w-32 border border-gray-400 p-2 bg-[#f6b26b]">Ingresos</th>
              <th className="w-35 border border-gray-400 p-2 bg-[#ea9999]">Fase Cliente</th>
              <th className="w-100 border border-gray-400 p-2 bg-[#ea9999]">Observaciones</th>
              <th className="w-35 border border-gray-400 p-2 bg-[#ea9999]">Estado del Lead</th>
              <th className="w-40 border border-gray-400 p-2 bg-[#ea9999]">Asignado A:</th>
              <th className="w-40 border border-gray-400 p-2 bg-purple-600 text-white">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-10 text-gray-800">No hay leads abiertos para este filtro.</td>
              </tr>
            ) : (
              filteredLeads.map((l) => (
                <tr key={l.id} className="hover:bg-slate-100 transition-colors">
                  <td className="border border-gray-400 p-2 text-gray-600 font-bold ">{l.nombre_completo}</td>
                  <td className="text-center border border-gray-400 p-2 text-gray-600 font-bold bg-[#fff2cc]">{l.provincia}</td>
                  <td className="text-center border border-gray-400 p-2 text-gray-600 font-bold">{l.telefono ? l.telefono.replace('+34', '').trim() : ''}</td>
                  <td className="text-center border border-gray-400 p-2 text-gray-600 font-bold">{l.ingresos || '0'}€</td>
                  <td className="text-center border border-gray-400 p-2 text-gray-600 font-bold">{l.fase}</td>
                  <td className="text-center border border-gray-400 p-2 text-gray-600 font-bold">{l.seguimiento}</td>
                  <td className="text-center border border-gray-400 p-2 text-gray-600 font-bold">{l.estado}</td>
                  <td className="text-center border border-gray-400 p-2 text-gray-600 font-bold">{getComercialNombre(l.asignado_a)}</td>
                  <td className="text-center border border-gray-400 p-2">
                    <button onClick={() => handleAsignar(l.id)} className="bg-blue-500 text-white px-2 py-1 rounded text-[10px] hover:bg-blue-600 transition-colors">
                      Asignar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE SELECCIÓN DE COMERCIAL */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-slate-800 mb-4 text-center">Asignar Comercial</h2>
            <div className="space-y-3">
              {comerciales.length > 0 ? (
                comerciales.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => ejecutarAsignacion(c.id)}
                    className="w-full p-3 bg-slate-100 hover:bg-blue-50 text-slate-700 font-semibold rounded-lg border border-slate-200 hover:border-blue-300 transition-all text-left flex justify-between items-center"
                  >
                    {c.nombre}
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded uppercase">Seleccionar</span>
                  </button>
                ))
              ) : (
                <p className="text-center text-gray-500">No se encontraron comerciales.</p>
              )}
            </div>
            <button 
              onClick={() => setMostrarModal(false)}
              className="w-full mt-6 text-slate-400 hover:text-red-500 text-sm font-medium transition-colors"
            >
              Cerrar ventana
            </button>
          </div>
        </div>
      )}
    </div>
  )
}