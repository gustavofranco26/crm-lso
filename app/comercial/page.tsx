"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function ComercialPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/')
}

  async function fetchLeads() {
    const rawId = localStorage.getItem('user_id');
    const comercialId = rawId?.replace(/['"]+/g, '');
    if (!comercialId) return;

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .neq('estado', 'cerrado')
      .eq('asignado_a', comercialId)
      .order('fecha_creacion', { ascending: false });

    if (data) setLeads(data);
    setLoading(false);
  }

  const updateField = async (id: string, field: string, value: any) => {
  // Si es un cierre, activamos el loading para dar feedback
  const esCierre = field === 'situacion_final' && value !== 'Libre' && value !== '-';
  
  if (esCierre) {
    const confirmar = window.confirm("¿Confirmas esta Acción?");
    if (!confirmar) return;
    setLoading(true); // Iniciamos el spinner
  }

  // Actualización en local para que el filtro lo oculte al instante
  setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));

  // Lógica de base de datos
  if (esCierre) {
    const rawId = localStorage.getItem('user_id');
    const comercialId = rawId?.replace(/['"]+/g, '');

    // 1. Cerramos el lead en DB
    await supabase.from('leads').update({ situacion_final: value, estado: 'cerrado' }).eq('id', id);

    // 2. Insertamos comisión
    await supabase.from('comisiones').insert([{ id_usuario: comercialId, id_lead: id, monto: 40 }]);
    
    alert("Acción Realizada Correctamente.");
    await fetchLeads(); // Recargamos para limpiar datos
    setLoading(false);  // Quitamos spinner
  } else {
    // Actualización normal para otros campos (FASE, teléfono, etc)
    const { error } = await supabase
      .from('leads')
      .update({ [field]: value })
      .eq('id', id);

    if (error) {
      console.error(`Error en ${field}:`, error.message);
      setLoading(false);
    }
  }
};

const getStatusTextColor = (valor: string) => {
  switch (valor) {
    case 'Nuevo': return 'text-blue-600';
    case 'Contratado': return 'text-emerald-600';
    case 'Pendiente Llamada': 
    case 'Llamar más adelante': return 'text-orange-500';
    case 'Viable': return 'text-indigo-600';
    case 'No Viable': 
    case 'No puede Pagar':
    case 'Me cuelga': return 'text-rose-600';
    case 'Ficha Pendiente': 
    case 'Se lo piensa': return 'text-amber-500';
    default: return 'text-slate-500';
  }
};

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-white px-6 py-2 flex items-center sticky top-0 z-30 mt-5 shadow-sm">
        {/* SECCIÓN IZQUIERDA: Logo y Títulos */}
        <div className="flex flex-col items-start gap-1">
          <div className="pt-2">
            <Image 
              src="/Defendoo_logo_color.png" 
              alt="Logo"
              width={150}
              height={150}
              style={{ width: 'auto', height: 'auto' }}
              priority 
            />
            <h1 className="text-[16px] text-slate-500 font-semibold tracking-widest h-10 top-0 z-0 mt-5 ml-15">
              DefenCore
            </h1>
          </div>
        </div>

        {/* SECCIÓN DERECHA: Nombre y Salir (empujados por ml-auto) */}
        <div className="ml-auto flex items-center gap-6">
          <span className="text-slate-600 font-medium hidden lg:block text-sm">
            Luis Ramos Valcárcel
          </span>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-md text-sm font-bold hover:bg-red-100 transition duration-200"
          >
            <LogOut size={16} />
            <span>SALIR</span>
          </button>
        </div>
      </header>

      {/* TABLA DE GESTIÓN */}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-lg shadow-2xl border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-120px)]">
            <table className="w-full text-[12px] border-collapse table-fixed">
              <thead className="text-[13px] bg-[#ffffff] text-[#071638] sticky top-0 z-20">
                <tr>
                  <th className="w-24 p-2 border-slate-300">FASE</th>
                  <th className="w-60 p-2 border-slate-300">SEGUIMIENTO</th>
                  <th className="w-24 p-2 border-slate-300">FECHA</th>
                  <th className="w-24 p-2 border-slate-300">CONTACTAR</th>
                  <th className="w-55 p-2 border-slate-300">NOMBRE</th>
                  <th className="w-32 p-2 border-slate-300">TELÉFONO</th>
                  <th className="w-32 p-2 border-slate-300">PROVINCIA</th>
                  <th className="w-32 p-2 border-slate-300">S. LABORAL</th>
                  <th className="w-32 p-2 border-slate-300">DEUDA</th>
                  <th className="w-30 p-2 border-slate-300">SITUA. PAGOS</th>
                  <th className="w-24 p-2 border-slate-300">EMBARGOS</th>
                  <th className="w-40 p-2 border-slate-300">PREOCUPACIÓN</th>
                  <th className="w-28 p-2 border-slate-300">INGRESOS</th>
                  <th className="w-60 p-2 border-slate-300">VIVIEN/HIPOT</th>
                  <th className="w-28 p-2 border-slate-300">COCHE</th>
                  <th className="w-28 p-2 border-slate-300">DEUDA PÚBL.</th>
                  <th className="w-28 p-2 border-slate-300">HONORARIOS</th>
                  <th className="w-28 p-2 border-slate-300">ENTRADA</th>
                  <th className="w-24 p-2 border-slate-300">CUOTA</th>
                  <th className="w-20 p-2 border-slate-300">N.CUOTAS</th>
                  <th className="w-32 p-2 border-slate-300">F. 1ER PAGO</th>
                  <th className="w-32 p-2">SITUA. FINAL</th>

                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  /* SPINNER QUE OCUPA TODA LA TABLA */
                  <tr>
                    <td colSpan={24} className="py-24 text-center bg-white/50">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <p className="mt-4 text-blue-600 font-bold text-base animate-pulse">
                          Procesando Acción y actualizando datos...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  /* LISTADO DE LEADS FILTRADOS */
                  leads
                    .filter(lead => !lead.situacion_final || lead.situacion_final === "Libre" || lead.situacion_final === "-")
                    .map((lead) => (
                      <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors border-b border-slate-100">
                    {/* FASE */}
                    <td className="p-1 text-center font-bold">
                      <select
                        className={`w-full p-1 text-center bg-transparent outline-none cursor-pointer ${getStatusTextColor(lead.estado)}`}
                        value={lead.estado}
                        onChange={(e) => updateField(lead.id, 'estado', e.target.value)}
                      >
                        <option className="text-blue-600" value="Nuevo">Nuevo</option>
                        <option className="text-emerald-600" value="Contratado">Contratado</option>
                        <option className="text-orange-500" value="Pendiente Llamada">Pendiente Llamada</option>
                        <option className="text-amber-500" value="Ficha Pendiente">Ficha Pendiente</option>
                        <option className="text-indigo-600" value="Viable">Viable</option>
                        <option className="text-rose-600" value="No Viable">No Viable</option>
                      </select>
                    </td>
                    
                    {/* SEGUIMIENTO */}
                    <td className="p-1">
                      <textarea 
                        className="w-full truncate text-slate-700 h-8 p-1 text-center bg-transparent border-none text-[10px] resize-y "
                        defaultValue={lead.seguimiento}
                        onBlur={(e) => updateField(lead.id, 'seguimiento', e.target.value)}
                        placeholder="Escribir nota..."
                      />
                    </td>

                    <td className="p-2 text-center truncate text-slate-700">
                      {new Date(lead.fecha_creacion).toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short'
                      }).replace('.', '').replace(/ /g, '-').replace(/^\w|(?<=-)\w/g, (l) => l.toUpperCase())}
                    </td>
                    <td className="p-2 text-center truncate text-slate-700">{lead.horario_llamada}</td>
                    <td className="p-2 text-center font-semibold truncate text-slate-700">{lead.nombre_completo}</td>
                    <td className="p-2 font-medium text-center truncate text-slate-700">
                      {lead.telefono ? lead.telefono.replace('+34', '').trim() : ''}
                    </td>
                    <td className="p-2 text-center truncate text-slate-700">{lead.provincia}</td>

                    {/* S. LABORAL */}
                    <td className="p-2 text-center truncate text-slate-700">{lead.situacion}</td>

                    <td className="p-2 text-center truncate text-slate-700">{lead.importe_deuda}</td>
                    <td className="p-2 text-center truncate text-slate-700">{lead.situacion_pagos}</td>
                    
                    {/* EMBARGOS */}
                    <td className="p-2 text-center truncate text-slate-700">{lead.embargos}</td>

                    <td className="p-2 text-center truncate text-slate-700 italic">{lead.preocupacion}</td>
                    
                    {/* INGRESOS */}
                    <td className="p-1 text-center truncate text-slate-700">
                      <input 
                        type="number" 
                        className="w-full p-1 text-center bg-transparent"
                        defaultValue={lead.ingresos}
                        onBlur={(e) => updateField(lead.id, 'ingresos', e.target.value)}
                      />
                    </td>

                    <td className="p-2 text-center">
                      <textarea 
                        className="w-full h-8 p-1 text-center truncate text-slate-700 bg-transparent border-none text-[10px] resize-y "
                        defaultValue={lead.vivienda_propiedad}
                        onBlur={(e) => updateField(lead.id, 'seguimiento', e.target.value)}
                        placeholder="Escribir nota..."
                      />
                    </td>
                    <td className="p-2 text-center">
                      <textarea 
                        className="w-full h-8 p-1 text-center truncate text-slate-700 bg-transparent border-none text-[10px] resize-y "
                        defaultValue={lead.coche}
                        onBlur={(e) => updateField(lead.id, 'seguimiento', e.target.value)}
                        placeholder="Escribir nota..."
                      />
                    </td>
                    <td className="p-2 text-center font-bold"><input 
                        type="number"
                        className="w-full p-1 text-center font-bold truncate text-slate-700"
                        defaultValue={lead.deuda_publica}
                        onBlur={(e) => updateField(lead.id, 'deuda_publica', e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-center truncate text-slate-700">{lead.honorarios || '5200'}€</td>

                    {/* ENTRADA Y CUOTA */}
                    <td className="p-1 text-center">
                      <input 
                        type="number" 
                        className="w-full p-1 text-center font-bold truncate text-slate-700"
                        defaultValue={lead.entrada_importe}
                        onBlur={(e) => updateField(lead.id, 'entrada_importe', e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-center font-bold truncate text-slate-700">
                      <input 
                        type="number" 
                        className="w-full p-1 text-center font-bold"
                        defaultValue={lead.cuota_importe}
                        onBlur={(e) => updateField(lead.id, 'cuota_importe', e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-center truncate text-slate-700">{lead.total_cuotas}</td>
                    <td className="p-2 text-center truncate text-slate-700">
                      {new Date(lead.fecha_primera_cuota).toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short'
                      }).replace('.', '').replace(/ /g, '-').replace(/^\w|(?<=-)\w/g, (l) => l.toUpperCase())}
                    </td>
                    {/* SITUACION FINAL */}
                    <td className="p-1 text-center font-bold truncate text-slate-700">
                      <select 
                        className={`w-full p-1 text-center truncate bg-transparent outline-none cursor-pointer ${getStatusTextColor(lead.situacion_final)}`}
                        value={lead.situacion_final || "Libre"}
                        onChange={(e) => updateField(lead.id, 'situacion_final', e.target.value)}
                      >
                        <option className="text-slate-500" value="Libre">-</option>
                        <option className="text-emerald-600" value="Contratado">Contratado</option>
                        <option className="text-amber-500" value="Se lo piensa">Se lo piensa</option>
                        <option className="text-rose-600" value="No puede Pagar">No puede Pagar</option>
                        <option className="text-rose-600" value="Perder Coche">Perder Coche</option>
                        <option className="text-orange-500" value="Llamar más adelante">Llamar más adelante</option>
                        <option className="text-rose-600" value="Me cuelga">Me cuelga</option>
                      </select>
                    </td>
                  </tr>
                ))) }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}