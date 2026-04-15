'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [pass, setPass] = useState('')
  const router = useRouter()

  interface Usuario {
    id: string;
    nombre: string;
    rol: string;
  } 

  const manejarLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  

  const { data, error } = await supabase.auth.signInWithPassword({
    email: usuario, 
    password: pass,
  })

  if (error) {
    alert("Error de acceso: " + error.message)
    return
  }

  if (data.user) {
    localStorage.setItem('user_id', data.user.id);
    
    const { data: perfil, error: perfilError } = await supabase
      .from('usuarios')
      .select('rol, nombre')
      .eq('id', data.user.id)
      .single()

    if (perfil) {
      localStorage.setItem('user_role', perfil.rol)
      localStorage.setItem('user_name', perfil.nombre)
      
      const rol = perfil.rol.toLowerCase()
      if (['gerencia', 'ti', 'contabilidad'].includes(rol)) {
        router.push('/gerencia')
      } else if (rol === 'administrador') {
        router.push('/administrador')
      } else {
        router.push('/dashboard')
      }
    }
    if (error) {
      alert("Error de acceso: " + (error as any).message)
      return
    }
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans">
      <form onSubmit={manejarLogin} className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2 italic">LSO CRM</h1>
          <p className="text-slate-500 uppercase tracking-widest text-xs">Acceso Profesionales</p>
        </div>
        
        <div className="space-y-4">
          <input 
            type="text" 
            placeholder="Nombre y Apellido"
            className="w-full p-4 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={(e) => setUsuario(e.target.value)}
          />
          <input 
            type="password" 
            placeholder="Contraseña"
            className="w-full p-4 bg-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            onChange={(e) => setPass(e.target.value)}
          />
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-lg transition-transform active:scale-95">
            ENTRAR
          </button>
        </div>
      </form>
    </div>
  )
}