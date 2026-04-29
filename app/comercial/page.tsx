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
    const confirmar = window.confirm("¿Confirmas el cierre de este lead?");
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
    
    alert("Venta procesada con éxito.");
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

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b px-6 py-2 flex items-center h-20 sticky top-0 z-30 shadow-sm">
        {/* SECCIÓN IZQUIERDA: Logo y Títulos */}
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <Image 
              src="/Defendoo_logo_color.png" 
              alt="Logo"
              width={150}
              height={150}
              style={{ width: 'auto', height: 'auto' }}
              priority 
            />
          </div>
          
          {/* Contenedor de títulos con bordes divisores verticales */}
          <div className="flex items-center h-8"> 
            <h1 className="text-[25px] text-slate-900 font-bold border-l pl-6 hidden md:block text-sm">
              DefenCore - CRM
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
            <table className="w-full text-[11px] border-collapse table-fixed">
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
                  <th className="w-24 p-2 border-slate-300">H.E.FIRMADA</th>
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
                          Procesando venta y actualizando comisión...
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
                    <td className="p-1 text-center font-bold text-gray-700">
                      <select
                        className="w-full p-1 text-center bg-transparent"
                        value={lead.estado} // Usamos value en lugar de defaultValue para sincronizar
                        onChange={(e) => updateField(lead.id, 'estado', e.target.value)} // CORREGIDO: 'estado' en lugar de 'situacion_laboral'
                      >
                        <option value="Nuevo">Nuevo</option>
                        <option value="Contratado">Contratado</option>
                        <option value="Pendiente Llamada">Pendiente Llamada</option>
                        <option value="Ficha Pendiente">Ficha Pendiente</option>
                        <option value="Viable">Viable</option>
                        <option value="No Viable">No Viable</option>
                      </select>
                    </td>
                    
                    {/* SEGUIMIENTO */}
                    <td className="p-1">
                      <textarea 
                        className="w-full h-8 p-1 text-center bg-transparent border-none text-[10px] resize-y "
                        defaultValue={lead.seguimiento}
                        onBlur={(e) => updateField(lead.id, 'seguimiento', e.target.value)}
                        placeholder="Escribir nota..."
                      />
                    </td>

                    <td className="p-2 text-center">
                      {new Date(lead.fecha_creacion).toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short'
                      }).replace('.', '').replace(/ /g, '-').replace(/^\w|(?<=-)\w/g, (l) => l.toUpperCase())}
                    </td>
                    <td className="p-2 text-center text-slate-700">{lead.horario_llamada}</td>
                    <td className="p-2 text-left font-semibold truncate text-slate-700">{lead.nombre_completo}</td>
                    <td className="p-2 font-medium text-center">
                      {lead.telefono ? lead.telefono.replace('+34', '').trim() : ''}
                    </td>
                    <td className="p-2 text-center">{lead.provincia}</td>

                    {/* S. LABORAL */}
                    <td className="p-1 text-center">
                      <select
                        className="w-full p-1 text-center bg-transparent"
                        defaultValue={lead.situacion_laboral}
                        onChange={(e) => updateField(lead.id, 'situacion_laboral', e.target.value)}
                      >
                        <option value="Cuenta ajena">Cuenta ajena</option>
                        <option value="Autónomo">Autónomo</option>
                        <option value="Pensionista">Pensionista</option>
                        <option value="Desempleado">Desempleado</option>
                      </select>
                    </td>

                    <td className="p-2 text-center">{lead.importe_deuda}</td>
                    <td className="p-2 text-center truncate">{lead.situacion_pagos}</td>
                    
                    {/* EMBARGOS */}
                    <td className="p-1 text-center">
                      <input 
                        type="checkbox" 
                        defaultChecked={lead.embargos}
                        onChange={(e) => updateField(lead.id, 'embargos', e.target.checked)}
                      />
                    </td>

                    <td className="p-2 text-center truncate text-slate-500 italic">{lead.preocupacion}</td>
                    
                    {/* INGRESOS */}
                    <td className="p-1 text-center">
                      <input 
                        type="number" 
                        className="w-full p-1 text-center bg-transparent"
                        defaultValue={lead.ingresos}
                        onBlur={(e) => updateField(lead.id, 'ingresos', e.target.value)}
                      />
                    </td>

                    <td className="p-2 text-center">
                      <textarea 
                        className="w-full h-8 p-1 text-center bg-transparent border-none text-[10px] resize-y "
                        defaultValue={lead.vivienda_propiedad}
                        onBlur={(e) => updateField(lead.id, 'seguimiento', e.target.value)}
                        placeholder="Escribir nota..."
                      />
                    </td>
                    <td className="p-2 text-center">
                      <textarea 
                        className="w-full h-8 p-1 text-center bg-transparent border-none text-[10px] resize-y "
                        defaultValue={lead.coche}
                        onBlur={(e) => updateField(lead.id, 'seguimiento', e.target.value)}
                        placeholder="Escribir nota..."
                      />
                    </td>
                    <td className="p-2 text-center font-bold">{lead.deuda_publica ? 'SÍ' : 'NO'}</td>
                    <td className="p-2 text-center">{lead.honorarios || '5200'}€</td>

                    {/* ENTRADA Y CUOTA */}
                    <td className="p-1 text-center">
                      <input 
                        type="number" 
                        className="w-full p-1 text-center font-bold"
                        defaultValue={lead.entrada_importe}
                        onBlur={(e) => updateField(lead.id, 'entrada_importe', e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-center font-bold">
                      <input 
                        type="number" 
                        className="w-full p-1 text-center font-bold"
                        defaultValue={lead.cuota_importe}
                        onBlur={(e) => updateField(lead.id, 'cuota_importe', e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-center">{lead.total_cuotas}</td>
                    <td className="p-2 text-center">
                      {new Date(lead.fecha_primera_cuota).toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short'
                      }).replace('.', '').replace(/ /g, '-').replace(/^\w|(?<=-)\w/g, (l) => l.toUpperCase())}
                    </td>
                    {/* HE FIRMADO */}
                    <td className="p-1 text-center">
                      <input
                        type="checkbox" 
                        defaultChecked={lead.he_firmada}
                        onChange={(e) => updateField(lead.id, 'he_firmada', e.target.checked)}
                      />
                    </td>

                    {/* SITUACION FINAL */}
                    <td className="p-1 text-center">
                      <select 
                        className="w-full p-1 text-center bg-transparent font-semibold "
                        value={lead.situacion_final || "Libre"}
                        onChange={(e) => updateField(lead.id, 'situacion_final', e.target.value)}
                      >
                        <option value="Libre">-</option>
                        <option value="Contratado">Contratado</option>
                        <option value="Se lo piensa">Se lo piensa</option>
                        <option value="No puede Pagar">No puede Pagar</option>
                        <option value="Perder Coche">Perder Coche</option>
                        <option value="Llamar más adelante">Llamar más adelante</option>
                        <option value="Me cuelga">Me cuelga</option>
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