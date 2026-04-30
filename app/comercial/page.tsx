"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function ComercialPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilterButton, setSelectedFilterButton] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/')
}

  // Mapeo de SITUACIÓN FINAL a FASE
  const mapSituacionToFase = (situacion: string): string => {
    switch (situacion) {
      case 'Contratado': return 'Contratado';
      case 'Se lo piensa': return 'Viable';
      case 'No puede Pagar':
      case 'Perder Coche':
      case 'Me cuelga': return 'No Viable';
      case 'Llamar más adelante': return 'Pendiente Llamada';
      case '-':
      case 'Libre':
      default: return 'Nuevo';
    }
  };

  const mapButtonToPhase = (button: string | null): string | null => {
    if (!button) return null;
    switch (button) {
      case 'Contratado': return 'Contratado';
      case 'Se lo piensa': return 'Viable';
      case 'Llamar más adelante': return 'Pendiente Llamada';
      case 'No puede Pagar':
      case 'Perder Coche':
      case 'Me cuelga': return 'No Viable';
      default: return null;
    }
  };

  const filterPhase = mapButtonToPhase(selectedFilterButton);

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
  // Si es situacion_final, también actualizamos la fase automáticamente
  const updates = field === 'situacion_final' 
    ? { [field]: value, estado: mapSituacionToFase(value) }
    : { [field]: value };

  setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

  // Lógica de base de datos
  if (esCierre) {
    const rawId = localStorage.getItem('user_id');
    const comercialId = rawId?.replace(/['"]+/g, '');

    // 1. Cerramos el lead en DB con la fase actualizada
    await supabase.from('leads').update({ 
      situacion_final: value, 
      estado: 'cerrado'
    }).eq('id', id);

    // 2. Insertamos comisión
    await supabase.from('comisiones').insert([{ id_usuario: comercialId, id_lead: id, monto: 40 }]);
    
    alert("Acción Realizada Correctamente.");
    await fetchLeads(); // Recargamos para limpiar datos
    setLoading(false);  // Quitamos spinner
  } else if (field === 'situacion_final') {
    // Actualización de situacion_final sin cierre
    const { error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error(`Error en ${field}:`, error.message);
      setLoading(false);
    }
  } else {
    // Actualización normal para otros campos (teléfono, etc)
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

        {/* FILTROS: Centro */}
        <div className="ml-6 flex items-center gap-2">
          <button
            onClick={() => setSelectedFilterButton(null)}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              selectedFilterButton === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedFilterButton('Contratado')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              selectedFilterButton === 'Contratado'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Contratado
          </button>
          <button
            onClick={() => setSelectedFilterButton('Se lo piensa')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              selectedFilterButton === 'Se lo piensa'
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Se lo piensa
          </button>
          <button
            onClick={() => setSelectedFilterButton('Llamar más adelante')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              selectedFilterButton === 'Llamar más adelante'
                ? 'bg-orange-500 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Llamar más adelante
          </button>
          <button
            onClick={() => setSelectedFilterButton('No puede Pagar')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              selectedFilterButton === 'No puede Pagar'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            No puede Pagar
          </button>
          <button
            onClick={() => setSelectedFilterButton('Perder Coche')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              selectedFilterButton === 'Perder Coche'
                ? 'bg-rose-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Perder Coche
          </button>
          <button
            onClick={() => setSelectedFilterButton('Me cuelga')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
              selectedFilterButton === 'Me cuelga'
                ? 'bg-red-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Me cuelga
          </button>
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
              <thead className="text-[13px] bg-[#ffffff] sticky top-0 z-20">
                <tr>
                  <th className="w-24 p-2 font-extrabold text-[#085e05]">FASE</th>
                  <th className="w-60 p-2 font-extrabold text-[#085e05]">OBSERVACIONES</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#ff7700]">FECHA</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#ff7700]">CONTACTAR</th>
                  <th className="w-55 p-2 font-extrabold border-slate-300 text-[#ff7700]">NOMBRE</th>
                  <th className="w-32 p-2 font-extrabold border-slate-300 text-[#ff7700]">TELÉFONO</th>
                  <th className="w-32 p-2 font-extrabold border-slate-300 text-[#ff7700]">PROVINCIA</th>
                  <th className="w-32 p-2 font-extrabold border-slate-300 text-[#ff7700]">S. LABORAL</th>
                  <th className="w-32 p-2 font-extrabold border-slate-300 text-[#ff7700]">DEUDA</th>
                  <th className="w-30 p-2 font-extrabold border-slate-300 text-[#ff7700]">SITUA. PAGOS</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#4a1500]">EMBARGOS</th>
                  <th className="w-40 p-2 font-extrabold border-slate-300 text-[#ff7700]">PREOCUPACIÓN</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#2575f6]">INGRESOS</th>
                  <th className="w-60 p-2 font-extrabold border-slate-300 text-[#2575f6]">VIVIEN/HIPOT</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#2575f6]">COCHE</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#2575f6]">DEUDA PÚBL.</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#4b8b16]">HONORARIOS</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#4b8b16]">ENTRADA</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#4b8b16]">CUOTA</th>
                  <th className="w-20 p-2 font-extrabold border-slate-300 text-[#4b8b16]">N.CUOTAS</th>
                  <th className="w-32 p-2 font-extrabold border-slate-300 text-[#4b8b16]">F. 1ER PAGO</th>
                  <th className="w-32 p-2 font-extrabold text-[#bb6f17]">SITUA. FINAL</th>

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
                    .filter(lead => {
                      const noEsCerrado = !lead.situacion_final || lead.situacion_final === "Libre" || lead.situacion_final === "-";
                      const coincideConFiltro = filterPhase === null || lead.estado === filterPhase;
                      return noEsCerrado && coincideConFiltro;
                    })
                    .map((lead) => (
                      <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors border-b border-slate-100">
                    {/* FASE */}
                    <td className="p-1 text-center font-bold">
                      <div className={`w-full p-1 text-center ${getStatusTextColor(lead.estado)}`}>
                        {lead.estado}
                      </div>
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