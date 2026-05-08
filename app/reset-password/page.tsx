'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPassword() {
  const [nuevaPass, setNuevaPass] = useState('')
  const [mensaje, setMensaje] = useState('')
  const router = useRouter()

  const manejarReset = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: nuevaPass })
    if (error) {
      setMensaje('Error: ' + error.message)
    } else {
      setMensaje('Contraseña actualizada correctamente.')
      setTimeout(() => router.push('/'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={manejarReset} className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <h1 className="text-2xl font-extrabold text-blue-900 mb-6 text-center">Nueva contraseña</h1>
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Nueva contraseña"
            className="w-full p-4 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-[#000000]"
            onChange={(e) => setNuevaPass(e.target.value)}
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg">
            Actualizar contraseña
          </button>
          {mensaje && <p className="text-center text-sm text-emerald-600">{mensaje}</p>}
        </div>
      </form>
    </div>
  )
}