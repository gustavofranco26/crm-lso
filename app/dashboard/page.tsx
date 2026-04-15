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
    const comercialId = localStorage.getItem('user_id')

    if (!comercialId) {
      console.error("Error: No se ha identificado al usuario. Por favor, vuelve a iniciar sesión.")
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('leads')
      .select('*')
      .neq('estado', 'cerrado')
      .neq('asignado_a', comercialId)
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


  async function updateField(leadId: string, field: string, value: any) {
    // Refresh veloz, aunque el cambio real se confirmará con la respuesta del servidor.
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, [field]: value } : l))

    const { error } = await supabase
      .from('leads')
      .update({ [field]: value })
      .eq('id', leadId)

    if (error) {
      console.error("Error al guardar:", error.message)
      // Actualizar si es necesario para revertir el cambio local.
      fetchLeads()
    }
  }


  if (loading) return <div className="flex justify-center mt-20"><Loader2 className="animate-spin" /></div>

  return (
    <div className="p-8 bg-gray-50 min-h-screen relative">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Leads Activos - LSO</h1>
          <button onClick={handleLogout}className="absolute bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all uppercase shadow-sm right-4 top-4">
          Cerrar Sesión
          </button>
        </div>

        <div className="grid gap-4">
          {leads.length === 0 ? (
            <p className="text-gray-500 text-center py-10">No hay leads activos en este momento.</p>
          ) : (
            leads.map((lead) => (
              <div key={lead.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                    <User size={20} />
                    </div>
                    <div>
                    <h3 className="font-bold text-gray-900 uppercase">{lead.nombre_completo}</h3>
                    <p className="text-xs text-gray-500">{lead.telefono} | {lead.provincia}</p>
                    </div>
                </div>

                <div className="flex gap-2 items-center bg-gray-50 p-1 rounded-lg border">
                    <span className="text-[10px] font-bold px-2 text-gray-400">WS:</span>
                    {[1, 2, 3].map((n) => {
                    const field = `w${n}`; // Asegúrate de tener estas columnas en Supabase
                    const activo = lead[field];
                    return (
                        <button
                        key={n}
                        onClick={() => updateField(lead.id, field, !activo)}
                        className={`w-8 h-8 rounded-md text-[10px] font-bold transition-all ${
                            activo ? 'bg-green-500 text-white shadow-sm' : 'bg-white text-gray-400 border hover:bg-gray-100'
                        }`}
                        >
                        W{n}
                        </button>
                    )
                    })}
                </div>

                <button 
                    onClick={() => cerrarVenta(lead.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-bold text-xs flex items-center gap-2 shadow-sm ml-auto"
                >
                    <CheckCircle size={14} /> CERRAR VENTA
                </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
                
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Ingresos</span>
                    <div className="flex gap-1">
                    {[1000, 1500, 2000].map((m) => (
                        <button
                        key={m}
                        onClick={() => updateField(lead.id, 'ingresos', m)}
                        className={`flex-1 py-1 rounded border text-[10px] font-bold transition ${
                            lead.ingresos === m ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                        >
                        {m}€
                        </button>
                    ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">¿Embargos?</span>
                    <div className="flex gap-1">
                    {['No', 'Sí'].map((op) => (
                        <button
                        key={op}
                        onClick={() => updateField(lead.id, 'embargos', op)}
                        className={`flex-1 py-1 rounded border text-[10px] font-bold transition ${
                            lead.embargos === op 
                            ? (op === 'Sí' ? 'bg-orange-500 text-white border-orange-600' : 'bg-green-500 text-white border-green-600') 
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                        >
                        {op}
                        </button>
                    ))}
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Estado</span>
                    <select 
                    value={lead.estado}
                    onChange={(e) => updateField(lead.id, 'estado', e.target.value)}
                    className="text-[10px] p-1.5 rounded border bg-white font-bold text-gray-700"
                    >
                    <option value="nuevo">Nuevo</option>
                    <option value="en_llamada">En Llamada</option>
                    <option value="pendiente">Pendiente Doc</option>
                    <option value="no_interesado">No Interesado</option>
                    </select>
                </div>

                </div>
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}