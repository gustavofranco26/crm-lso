'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft} from 'lucide-react'
import Link from 'next/link'

export default function NuevoLead() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [provincia, setProvincia] = useState('')
  const [ingresos, setIngresos] = useState('')
  const [deuda, setDeuda] = useState('')
  const [embargos, setEmbargos] = useState('No')
  const [loading, setLoading] = useState(false)

  const guardarLead = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
    .from('leads')
    .insert([{
      nombre_completo: nombre,
      telefono,
      provincia,
      ingresos: parseFloat(ingresos) || 0,
      deuda_publica: parseFloat(deuda) || 0,
      embargos,
      estado: 'nuevo'
    }])

    if (error) {
      alert("Error al guardar: " + error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen text-black">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 mb-6 hover:text-black transition">
          <ArrowLeft size={20} /> Volver al Dashboard
        </Link>

        <h1 className="text-3xl font-bold mb-8">Registrar Nuevo Lead</h1>

        <form onSubmit={guardarLead} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Nombre Completo</label>
              <input required type="text" className="w-full p-3 border rounded-xl" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Teléfono</label>
                <input required type="tel" className="w-full p-3 border rounded-xl" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Provincia</label>
                <input required type="text" className="w-full p-3 border rounded-xl" value={provincia} onChange={(e) => setProvincia(e.target.value)} />
              </div>
            </div>

            <hr className="my-2" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-green-700">Ingresos Mensuales (€)</label>
                <input required type="number" className="w-full p-3 border border-green-200 rounded-xl bg-green-50" value={ingresos} onChange={(e) => setIngresos(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-red-700">Deuda Pública (€)</label>
                <input required type="number" className="w-full p-3 border border-red-200 rounded-xl bg-red-50" value={deuda} onChange={(e) => setDeuda(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">¿Tiene Embargos?</label>
              <select className="w-full p-3 border rounded-xl bg-white" value={embargos} onChange={(e) => setEmbargos(e.target.value)}>
                <option value="No">No</option>
                <option value="Sí">Sí</option>
              </select>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-blue-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition mt-4">
              {loading ? 'Guardando...' : <><Save size={20} /> Guardar Lead</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}