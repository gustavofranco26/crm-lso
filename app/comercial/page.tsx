"use client";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { CheckIcon, LogOut } from "lucide-react";


export default function ComercialPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [nombreComercial, setNombreComercial] = useState<string>('Cargando...');
  const [loading, setLoading] = useState(true);
  const [selectedFilterButton, setSelectedFilterButton] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'provincia' | 'situacion_pagos' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  const [filtroActual, setFiltroActual] = useState('Nuevos');

  useEffect(() => {
    const inicializarPagina = async () => {
      const rawId = localStorage.getItem('user_id');
      const userId = rawId?.replace(/['"]+/g, '');

      if (!userId) {
        router.push('/'); // Si no hay ID, redirigir al login
        return;
      }

      // 1. Traer nombre del comercial
      const { data, error } = await supabase
        .from('usuarios')
        .select('nombre')
        .eq('id', userId)
        .single();

      if (data && !error) {
        setNombreComercial(data.nombre);
      } else {
        setNombreComercial('Comercial');
      }

      // 2. Traer los leads
      await fetchLeads();
    };

    inicializarPagina();
  }, []);

  const leadsFiltrados = leads.filter(lead => {
  if (filtroActual === 'Nuevos') {
    // Al pulsar "Nuevos", solo mostramos los leads que no tienen una situación final definitiva
    return !lead.situacion_final || lead.situacion_final === 'Libre' || lead.situacion_final === '-';
  }
  // Al pulsar cualquier otro botón, mostramos solo los que coincidan con esa situación
  return lead.situacion_final === filtroActual;
});

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
      case 'Perder Vivienda':
      case 'No contesta':
      case 'No tiene Solución':
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
      case 'Perder Vivienda':
      case 'No contesta':
      case 'No tiene Solución':
      case 'Me cuelga': return 'No Viable';
      default: return null;
    }
  };

  const filterPhase = mapButtonToPhase(selectedFilterButton);

  const filtroOptions = [
    'Nuevos',
    'Contratado',
    'Se lo piensa',
    'No puede Pagar',
    'Perder Coche',
    'Perder Vivienda',
    'Llamar más adelante',
    'No contesta',
    'No tiene Solución',
    'Me cuelga',
  ];

  const statusCounts = leads.reduce((acc, lead) => {
    const situacion = lead.situacion_final || 'Libre';
    acc[situacion] = (acc[situacion] || 0) + 1;

    if (!lead.situacion_final || lead.situacion_final === 'Libre' || lead.situacion_final === '-') {
      acc.Nuevos = (acc.Nuevos || 0) + 1;
    }

    return acc;
  }, {} as Record<string, number>);

  const ExpandableTextInput = ({
    id,
    field,
    value,
    placeholder,
  }: {
    id: string;
    field: string;
    value: any;
    placeholder?: string;
  }) => {
    const [expanded, setExpanded] = useState(false);
    const [text, setText] = useState(value ?? '');
    const ref = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      setText(value ?? '');
    }, [value]);

    const closeField = () => {
      setExpanded(false);
      ref.current?.blur();
    };

    const handleBlur = () => {
      setExpanded(false);
      updateField(id, field, text);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        closeField();
      }
    };

    return (
      <textarea
        ref={ref}
        rows={expanded ? 4 : 1}
        className="w-full p-1 text-center bg-transparent border-none text-[12px] resize-none overflow-hidden wrap-break-word text-slate-700"
        placeholder={placeholder}
        value={text}
        onFocus={() => setExpanded(true)}
        onBlur={handleBlur}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    );
  };

  const ServiceInterestToggle = ({
    id,
    value,
  }: {
    id: string;
    value: any;
  }) => {
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(value ?? 'Lso');

    useEffect(() => {
      setSelected(value || 'Lso');
    }, [value]);

    const handleSelect = (option: 'Lso' | 'Negociacion') => {
      setSelected(option);
      setOpen(false);
      updateField(id, 'servicio_interes', option);
    };

    return (
      <div className="relative inline-flex w-full justify-center">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {selected}
        </button>
        {open && (
          <div className="absolute left-0 top-full z-20 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
            {['Lso', 'Negociacion'].map((option) => (
              <button
                key={option}
                type="button"
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => handleSelect(option as 'Lso' | 'Negociacion')}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const dateToInputValue = (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  };

  const getSortIcon = (field: 'provincia' | 'situacion_pagos') => {
    if (sortField !== field) return '↕';
    return sortOrder === 'asc' ? '▲' : '▼';
  };

  const handleSort = (field: 'provincia' | 'situacion_pagos') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortLeads = (items: any[]) => {
    if (!sortField) return items;
    return [...items].sort((a, b) => {
      const aValue = (a[sortField] || '').toString().toLowerCase();
      const bValue = (b[sortField] || '').toString().toLowerCase();
      const comparison = aValue.localeCompare(bValue, 'es', { numeric: true });
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  async function fetchLeads() {
    const rawId = localStorage.getItem('user_id');
    const comercialId = rawId?.replace(/['"]+/g, '');
    if (!comercialId) return;

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      //.neq('estado', 'cerrado')
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
      estado: 'cerrado',
      fecha_contratado: value === 'Contratado' ? new Date().toISOString() : null // Solo ponemos fecha si es Contratado
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

const getFilterButtonClasses = (opcion: string) => {
  const base = 'px-4 py-1.5 rounded-full text-xs font-bold transition-all border inline-flex items-center gap-2';

  const styles: Record<string, string> = {
    Contratado: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    'Se lo piensa': 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    'No puede Pagar': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'Perder Coche': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'Perder Vivienda': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'No contesta': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'No tiene Solución': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'Llamar más adelante': 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    'Me cuelga': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    Nuevos: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
  };

  const activeStyles: Record<string, string> = {
    Contratado: 'bg-emerald-600 text-white border-emerald-600 shadow-sm',
    'Se lo piensa': 'bg-amber-600 text-white border-amber-600 shadow-sm',
    'No puede Pagar': 'bg-rose-600 text-white border-rose-600 shadow-sm',
    'Perder Coche': 'bg-rose-600 text-white border-rose-600 shadow-sm',
    'Perder Vivienda': 'bg-rose-600 text-white border-rose-600 shadow-sm',
    'No contesta': 'bg-rose-600 text-white border-rose-600 shadow-sm',
    'No tiene Solución': 'bg-rose-600 text-white border-rose-600 shadow-sm',
    'Llamar más adelante': 'bg-orange-600 text-white border-orange-600 shadow-sm',
    'Me cuelga': 'bg-rose-600 text-white border-rose-600 shadow-sm',
  };

  return `${base} ${filtroActual === opcion ? activeStyles[opcion] ?? styles[opcion] : styles[opcion] ?? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`;
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
    case 'Perder Coche':
    case 'Perder Vivienda':
    case 'No contesta':
    case 'No tiene Solución':
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
        <div className="ml-6 flex flex-wrap items-center gap-2">
          {filtroOptions.map((opcion) => (
            <button
              key={opcion}
              onClick={() => setFiltroActual(opcion)}
              className={getFilterButtonClasses(opcion)}
            >
              <span>{opcion}</span>
              <span className="inline-flex h-5 min-w-1.25 items-center justify-center rounded-full bg-white px-2 text-[11px] font-semibold text-slate-900">
                {statusCounts[opcion] ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* SECCIÓN DERECHA: Nombre y Salir (empujados por ml-auto) */}
        <div className="ml-auto flex items-center gap-6">
          <span className="text-slate-600 font-medium hidden lg:block text-sm italic">
            {nombreComercial}
          </span>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#4d4d4d] px-4 py-2 rounded-md text-sm font-bold hover:text-[#7c6b6b] transition duration-200"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* TABLA DE GESTIÓN */}
      <div className="p-4 flex-1">
        <div className="bg-white rounded-lg shadow-2xl border-slate-200 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '42rem' }}>
            <table className="w-full text-[12px] border-collapse table-fixed">
              <thead className="text-[13px] bg-[#ffffff] sticky top-0 z-20">
                <tr>
                  <th className="w-24 p-2 font-extrabold text-[#097706]">FASE</th>
                  <th className="w-28 p-2 font-extrabold text-[#097706]">F. CONTRAT.</th>
                  <th className="w-50 p-2 font-extrabold text-[#097706]">OBSERVACIONES</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#ff7700]">FECHA</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#ff7700]">CONTACTAR</th>
                  <th className="w-55 p-2 font-extrabold border-slate-300 text-[#ff7700]">NOMBRE COMPLETO</th>
                  <th className="w-32 p-2 font-extrabold border-slate-300 text-[#ff7700]">TELÉFONO</th>
                  <th className="w-32 p-2 font-extrabold border-slate-300 text-[#ff7700]">
                    <button
                      type="button"
                      onClick={() => handleSort('provincia')}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      PROVINCIA <span>{getSortIcon('provincia')}</span>
                    </button>
                  </th>
                  <th className="w-50 p-2 font-extrabold border-slate-300 text-[#ff7700]">SIT-LABORAL</th>
                  <th className="w-42 p-2 font-extrabold border-slate-300 text-[#ff7700]">DEUDA</th>
                  <th className="w-50 p-2 font-extrabold border-slate-300 text-[#ff7700]">
                    <button
                      type="button"
                      onClick={() => handleSort('situacion_pagos')}
                      className="inline-flex items-center gap-1 cursor-pointer"
                    >
                      SIT-PAGOS <span>{getSortIcon('situacion_pagos')}</span>
                    </button>
                  </th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#eb2323]">EMBARGOS</th>
                  <th className="w-40 p-2 font-extrabold border-slate-300 text-[#ff7700]">PREOCUPACIÓN</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#2575f6]">INGRESOS</th>
                  <th className="w-50 p-2 font-extrabold border-slate-300 text-[#2575f6]">VIVIENDA/HIPOTECA</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#2575f6]">COCHE</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#2575f6]">DEUD-PÚBL.</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#4b8b16]">SERVICIO</th>
                  <th className="w-28 p-2 font-extrabold border-slate-300 text-[#4b8b16]">ENTRADA</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#4b8b16]">CUOTA</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#4b8b16]">N.CUOTAS</th>
                  <th className="w-32 p-2 font-extrabold border-slate-300 text-[#4b8b16]">F. 1ER PAGO</th>
                  <th className="w-24 p-2 font-extrabold border-slate-300 text-[#4b8b16]">H.ENCARGO</th>
                  <th className="w-32 p-2 font-extrabold text-[#af7532]">SITUA. FINAL</th>

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
                  sortLeads(
                    leads.filter(lead => {
                      // 1. Lógica para el botón "Nuevos" (Vivos)
                      if (filtroActual === 'Nuevos') {
                        const noEsCerrado = !lead.situacion_final || lead.situacion_final === "Libre" || lead.situacion_final === "-";
                        const coincideConFase = filterPhase === null || lead.estado === filterPhase;
                        return noEsCerrado && coincideConFase;
                      }

                      // 2. Lógica para los botones específicos (Contratado, Me cuelga, etc.)
                      // Aquí mostramos solo los que coinciden exactamente con el botón pulsado
                      return lead.situacion_final === filtroActual;
                    })
                  ).map((lead) => (
                    <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors border-b border-slate-100">
                    {/* FASE */}
                    <td className="p-1 text-center font-bold">
                      <div className={`w-full p-1 text-center ${getStatusTextColor(lead.estado)}`}>
                        {lead.estado}
                      </div>
                    </td>
                    {/* OBSERVACIONES */}
                    <td className="p-1 text-center text-slate-500 text-[10px]">
                      {lead.fecha_contratado ? new Date(lead.fecha_contratado).toLocaleDateString('es-ES') : '-'}
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
                    <td className="p-2 text-center font-bold">
                      <ExpandableTextInput
                        id={lead.id}
                        field="importe_deuda"
                        value={lead.importe_deuda}
                        placeholder="Deuda pública"
                      />
                    </td>
                    <td className="p-2 text-center truncate text-slate-700">{lead.situacion_pagos}</td>
                    
                    {/* EMBARGOS */}
                    <td className="p-2 text-center truncate text-slate-700">{lead.embargos}</td>

                    <td className="p-2 text-center truncate text-slate-700 italic">{lead.preocupacion}</td>
                    
                    {/* INGRESOS */}
                    <td className="p-1 text-center truncate text-slate-700">
                      <ExpandableTextInput
                        id={lead.id}
                        field="ingresos"
                        value={lead.ingresos}
                        placeholder="Ingresos"
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
                    <td className="p-2 text-center font-bold">
                      <ExpandableTextInput
                        id={lead.id}
                        field="deuda_publica"
                        value={lead.deuda_publica}
                        placeholder="Deuda pública"
                      />
                    </td>
                    <td className="p-2 text-center font-bold">
                      <ServiceInterestToggle
                        id={lead.id}
                        value={lead.servicio_interes}
                      />
                    </td>

                    {/* ENTRADA Y CUOTA */}
                    <td className="p-1 text-center">
                      <ExpandableTextInput
                        id={lead.id}
                        field="entrada_importe"
                        value={lead.entrada_importe}
                        placeholder="Entrada"
                      />
                    </td>
                    <td className="p-2 text-center font-bold truncate text-slate-700">
                      <ExpandableTextInput
                        id={lead.id}
                        field="cuota_importe"
                        value={lead.cuota_importe}
                        placeholder="Cuota"
                      />
                    </td>
                    <td className="p-2 text-center truncate text-slate-700">
                      <ExpandableTextInput
                        id={lead.id}
                        field="total_cuotas"
                        value={lead.total_cuotas}
                        placeholder="¿Cuántas?"
                      />
                    </td>
                    <td className="p-2 text-center truncate text-slate-700">
                      <input
                        type="date"
                        className="w-full p-1 text-center bg-transparent border-none text-slate-700"
                        defaultValue={dateToInputValue(lead.fecha_primera_cuota)}
                        onBlur={(e) => updateField(lead.id, 'fecha_primera_cuota', e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <label className="inline-flex cursor-pointer items-center justify-center">
                        <input
                          type="checkbox"
                          className="h-4 w-24 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={Boolean(lead.he_firmada === true || lead.he_firmada === 'true' || lead.he_firmada === 1 || lead.he_firmada === '1')}
                          onChange={(e) => updateField(lead.id, 'he_firmada', e.target.checked)}
                        />
                      </label>
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
                        <option className="text-rose-600" value="Perder Vivienda">Perder Vivienda</option>
                        <option className="text-rose-600" value="No contesta">No contesta</option>
                        <option className="text-rose-600" value="No tiene Solución">No tiene Solución</option>
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