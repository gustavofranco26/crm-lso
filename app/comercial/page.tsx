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
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
    
    const { error } = await supabase
      .from('leads')
      .update({ [field]: value })
      .eq('id', id);

    if (error) console.error(`Error en ${field}:`, error.message);
  };

  return (
    <div className="bg-slate-100 min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-white px-6 py-2 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Image 
            src="/Defendoo_logo_color.png" 
            alt="Logo" 
            width={200} 
            height={40}
            priority 
          />
          <h1 className="text-slate-500 font-medium border-l pl-4 hidden md:block text-sm">
            Luis Ramos Valcárcel
          </h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors">
          <LogOut size={16} /> SALIR
        </button>
      </header>

      {/* TABLA DE GESTIÓN */}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-120px)]">
            <table className="w-full text-[11px] border-collapse table-fixed">
              <thead className="bg-[#ffffff] text-[#071638] sticky top-0 z-20">
                <tr>
                  <th className="w-24 p-2 border-r border-slate-300">FASE</th>
                  <th className="w-64 p-2 border-r border-slate-300">SEGUIMIENTO</th>
                  <th className="w-24 p-2 border-r border-slate-300">FECHA</th>
                  <th className="w-32 p-2 border-r border-slate-300">CONTACTAR</th>
                  <th className="w-48 p-2 border-r border-slate-300">NOMBRE</th>
                  <th className="w-32 p-2 border-r border-slate-300">TELÉFONO</th>
                  <th className="w-32 p-2 border-r border-slate-300">PROVINCIA</th>
                  <th className="w-32 p-2 border-r border-slate-300">S. LABORAL</th>
                  <th className="w-32 p-2 border-r border-slate-300">DEUDA</th>
                  <th className="w-48 p-2 border-r border-slate-300">SITUACIÓN PAGOS</th>
                  <th className="w-24 p-2 border-r border-slate-300">EMBARGOS</th>
                  <th className="w-48 p-2 border-r border-slate-300">PREOCUPACIÓN</th>
                  <th className="w-28 p-2 border-r border-slate-300">INGRESOS</th>
                  <th className="w-32 p-2 border-r border-slate-300">VIVIENDA/HIPO</th>
                  <th className="w-28 p-2 border-r border-slate-300">COCHE</th>
                  <th className="w-28 p-2 border-r border-slate-300">DEUDA PÚBLICA</th>
                  <th className="w-28 p-2 border-r border-slate-300">HONORARIOS</th>
                  <th className="w-28 p-2 border-r border-slate-300 ">ENTRADA</th>
                  <th className="w-24 p-2 border-r border-slate-300">CUOTA</th>
                  <th className="w-20 p-2 border-r border-slate-300">Nº CUOTAS</th>
                  <th className="w-32 p-2 border-r border-slate-300">1er PAGO</th>
                  <th className="w-24 p-2 border-r border-slate-300">H.E. FIRMADA</th>
                  <th className="w-32 p-2">SIT. FINAL</th>

                </tr>
              </thead>
              <tbody className="divide-slate-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* FASE */}
                    <td className="p-1 text-center font-bold text-gray-700">{lead.estado}</td>
                    
                    {/* SEGUIMIENTO */}
                    <td className="p-1">
                      <textarea 
                        className="w-full h-8 p-1 bg-transparent border-none text-[10px] resize-none focus:ring-1 focus:ring-blue-500"
                        defaultValue={lead.seguimiento}
                        onBlur={(e) => updateField(lead.id, 'seguimiento', e.target.value)}
                        placeholder="Escribir nota..."
                      />
                    </td>

                    <td className="p-2">{new Date(lead.fecha_creacion).toLocaleDateString('es-ES')}</td>
                    <td className="p-2 text-slate-700">{lead.horario_contacto}</td>
                    <td className="p-2 font-semibold truncate text-slate-700">{lead.nombre_completo}</td>
                    <td className="p-2 text-gray-700 font-medium">{lead.telefono}</td>
                    <td className="p-2">{lead.provincia}</td>

                    {/* S. LABORAL */}
                    <td className="p-1">
                      <select
                        className="w-full p-1 bg-transparent"
                        defaultValue={lead.situacion_laboral}
                        onChange={(e) => updateField(lead.id, 'situacion_laboral', e.target.value)}
                      >
                        <option value="Cuenta ajena">Cuenta ajena</option>
                        <option value="Autónomo">Autónomo</option>
                        <option value="Pensionista">Pensionista</option>
                        <option value="Desempleado">Desempleado</option>
                      </select>
                    </td>

                    <td className="p-2">{lead.monto_deuda}</td>
                    <td className="p-2 truncate">{lead.situacion_pagos}</td>
                    
                    {/* EMBARGOS */}
                    <td className="p-1 text-center">
                      <input 
                        type="checkbox" 
                        defaultChecked={lead.embargos}
                        onChange={(e) => updateField(lead.id, 'embargos', e.target.checked)}
                      />
                    </td>

                    <td className="p-2 truncate text-slate-500 italic">{lead.preocupacion}</td>
                    
                    {/* INGRESOS */}
                    <td className="p-1">
                      <input 
                        type="number" 
                        className="w-full text-center p-1 bg-transparent"
                        defaultValue={lead.ingresos}
                        onBlur={(e) => updateField(lead.id, 'ingresos', e.target.value)}
                      />
                    </td>

                    <td className="p-2 text-center">{lead.vivienda_hipoteca}</td>
                    <td className="p-2 text-center">{lead.coche}</td>
                    <td className="p-2 text-center font-bold">{lead.deuda_publica ? 'SÍ' : 'NO'}</td>
                    <td className="p-2 text-center">{lead.honorarios || '5200'}€</td>

                    {/* ENTRADA Y CUOTA */}
                    <td className="p-1">
                      <input 
                        type="number" 
                        className="w-full text-center p-1 font-bold"
                        defaultValue={lead.entrada_importe}
                        onBlur={(e) => updateField(lead.id, 'entrada_importe', e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-center font-bold">{lead.cuota_mensual}€</td>
                    <td className="p-2 text-center">{lead.numero_cuotas}</td>
                    <td className="p-2 text-center">{lead.fecha_primer_pago}</td>

                    {/* HE FIRMADO */}
                    <td className="p-1 text-center">
                      <input
                        type="checkbox" 
                        defaultChecked={lead.he_firmado}
                        onChange={(e) => updateField(lead.id, 'he_firmado', e.target.checked)}
                      />
                    </td>

                    {/* SITUACION FINAL */}
                    <td className="p-1 text-center">
                      <select 
                        className="w-full p-1 bg-transparent"
                        defaultValue={lead.situacion_final}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}