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
      <header className="bg-[#4a86e8] p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex-1 text-center font-bold text-2xl tracking-[0.2em] ml-20">
          VISTA - RESUMEN GERENCIA
        </div>
        <Link href="/dashboard/nuevo" className="bg-gray-600 text-white  px-4 py-3 rounded-lg hover:bg-blue-700 transition">
          Nuevo Lead
        </Link>
        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-white font-bold px-2 py-3 rounded-lg transition-all uppercase shadow-sm"
        >
          Cerrar Sesión
        </button>
      </header>
      <div className="overflow-x-auto p-4">
        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr className="bg-[#93c47d] text-center uppercase font-bold text-[10px]">
              <th className="border border-gray-400 p-2 text-blue-800 italic">Cliente(Lead)</th>
              <th className="border border-gray-400 p-2">Provincia</th>
              <th className="border border-gray-400 p-1 bg-red-600 text-white">D. Pública</th>
              <th className="border border-gray-400 p-2 bg-[#f6b26b]">Ingresos</th>
              <th className="border border-gray-400 p-2 bg-[#ea9999]">Estado</th>
              <th className="border border-gray-400 p-2 bg-purple-600 text-white">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-10 text-gray-800">No hay leads registrados todavía.</td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id} className="text-center hover:bg-slate-100">
                  <td className="border border-gray-400 p-2 text-gray-600 font-bold ">{l.nombre_completo}</td>
                  <td className="border border-gray-400 p-2 text-gray-600 font-bold bg-[#fff2cc]">{l.provincia}</td>
                  <td className="border border-gray-400 p-2 text-red-600 font-bold">{l.deuda_publica || '0'}€</td>
                  <td className="border border-gray-400 p-2 font-bold text-gray-600 font-bold">{l.ingresos || '0'}€</td>
                  <td className="border border-gray-400 p-2 font-bold text-gray-600 font-bold">{l.estado}</td>
                  <td className="border border-gray-400 p-2">
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