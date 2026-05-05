"use client";
import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase";
import Image from 'next/image';
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

interface Lead {
  id: string;
  asignado_a?: string | null;
  situacion_final?: string | null;
  estado?: string | null;
  fecha_contratado?: string | null;
  seguimiento?: string | null;
  fecha_creacion?: string | null;
  horario_llamada?: string | null;
  nombre_completo?: string | null;
  telefono?: string | null;
  provincia?: string | null;
  situacion?: string | null;
  importe_deuda?: string | null;
  situacion_pagos?: string | null;
  embargos?: string | null;
  preocupacion?: string | null;
  ingresos?: string | null;
  vivienda_propiedad?: string | null;
  coche?: string | null;
  deuda_publica?: string | null;
  servicio_interes?: string | null;
  entrada_importe?: string | null;
  cuota_importe?: string | null;
  total_cuotas?: string | null;
  fecha_primera_cuota?: string | null;
  he_firmada?: boolean | string | number | null;
  [key: string]: string | boolean | number | null | undefined;
}

export default function ComercialPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [nombreComercial, setNombreComercial] = useState<string>('Cargando...');
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'provincia' | 'situacion_pagos' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const router = useRouter();
  const [filtroActual, setFiltroActual] = useState('En Gestión');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [faseDropdownOpenId, setFaseDropdownOpenId] = useState<string | null>(null);
  const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    router.push('/')
}

  const isFinalClosed = (situacion: string | number | boolean | null | undefined) => {
    return Boolean(situacion) && situacion !== 'Libre' && situacion !== '-';
  };

  const normalizeSituacionFinal = (value: string | number | boolean | null | undefined) => {
    if (!value || value === '-') return 'Libre';
    return String(value);
  };

  const filtroOptions = [
    'En Gestión',
    'Contratado',
    'Llamar más adelante',
    'No puede Pagar',
    'Perder Coche',
    'Perder Vivienda',
    'No contesta',
    'No tiene Solución',
    'Me cuelga',
  ];

  const getFilterKey = (value: string | null | undefined) => {
    if (!value || value === 'Libre' || value === '-') return 'En Gestión';
    if (value === 'Se lo piensa' || value === 'Llamar más adelante') return 'Llamar más adelante';
    return value;
  };

  const statusCounts = leads.reduce((acc, lead) => {
    const filterKey = getFilterKey(lead.situacion_final);
    acc[filterKey] = (acc[filterKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);


  const ExpandableTextInput = ({
    id,
    field,
    value,
    placeholder,
  }: {
    id: string;
    field: keyof Lead;
    value: string | number | null | undefined;
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
    value: string | null | undefined;
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

  const dateToInputValue = (value: string | null | undefined) => {
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

  const sortLeads = (items: Lead[]) => {
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

    const { data } = await supabase
      .from('leads')
      .select('*')
      //.neq('estado', 'cerrado')
      .eq('asignado_a', comercialId)
      .order('fecha_creacion', { ascending: false });

    if (data) setLeads(data as Lead[]);
    setLoading(false);
  }

  const updateField = async (id: string, field: keyof Lead, value: string | boolean | number | null | undefined) => {
    const situacionFinalValue = field === 'situacion_final' ? normalizeSituacionFinal(value) : undefined;
    const leadActual = leads.find((l) => l.id === id);
    const wasClosed = isFinalClosed(leadActual?.situacion_final);
    const isClosing = field === 'situacion_final' && isFinalClosed(situacionFinalValue);
    const isReopening = field === 'situacion_final' && !isClosing && wasClosed;

    if (isClosing || isReopening) {
      const confirmar = window.confirm("¿Confirmas esta acción?");
      if (!confirmar) return;
      setLoading(true);
    }

    const updates: Partial<Lead> = field === 'situacion_final'
      ? {
          situacion_final: situacionFinalValue,
          estado: isClosing ? 'cerrado' : 'nuevo',
          fecha_contratado: situacionFinalValue === 'Contratado' ? new Date().toISOString() : null,
        }
      : { [field]: value } as Partial<Lead>;

    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

    if (field === 'situacion_final') {
      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', id);

      if (!error && isClosing && !wasClosed) {
        const rawId = localStorage.getItem('user_id');
        const comercialId = rawId?.replace(/['"]+/g, '');
        await supabase.from('comisiones').insert([{ id_usuario: comercialId, id_lead: id, monto: 40 }]);
      }

      if (error) {
        console.error(`Error en ${field}:`, error.message);
      }

      if (isClosing || isReopening) {
        alert("Acción realizada correctamente.");
        await fetchLeads();
        setLoading(false);
      }
    } else {
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
  const base = 'px-4 py-1.5 w-full rounded-full text-xs font-bold transition-all border inline-flex items-center gap-2';

  const styles: Record<string, string> = {
    'En Gestión': 'bg-slate-50 text-slate-700  hover:bg-slate-100',    
    Contratado: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    'Llamar más adelante': 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
    'No puede Pagar': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'Perder Coche': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'Perder Vivienda': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'No contesta': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'No tiene Solución': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
    'Me cuelga': 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  };

  const activeStyles: Record<string, string> = {
    'En Gestión': 'bg-slate-600 text-black border-slate-600 shadow-sm',
    Contratado: 'bg-emerald-600 text-black border-emerald-600 shadow-sm',
    'Llamar más adelante': 'bg-orange-600 text-black border-orange-600 shadow-sm',
    'No puede Pagar': 'bg-rose-600 text-black border-rose-600 shadow-sm',
    'Perder Coche': 'bg-rose-600 text-black border-rose-600 shadow-sm',
    'Perder Vivienda': 'bg-rose-600 text-black border-rose-600 shadow-sm',
    'No contesta': 'bg-rose-600 text-black border-rose-600 shadow-sm',
    'No tiene Solución': 'bg-rose-600 text-black border-rose-600 shadow-sm',
    'Me cuelga': 'bg-rose-600 text-black border-rose-600 shadow-sm',
  };

  return `${base} ${filtroActual === opcion ? activeStyles[opcion] ?? styles[opcion] : styles[opcion] ?? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`;
};

const faseOptions = [
  'Nuevo',
  'Pend. Firm. H. E.',
  'Pend. Cobro',
  'Pend. Llamada',
  '1º Wsp Enviado',
  '2º Wsp Enviado',
] as const;

type FaseOption = (typeof faseOptions)[number];

const getFaseButtonClasses = (option: FaseOption, active: boolean) => {
  const base = 'px-2 py-1 rounded-full text-[11px] font-semibold transition-colors';
  const styles: Record<FaseOption, string> = {
    Nuevo: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    'Pend. Firm. H. E.': 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    'Pend. Cobro': 'bg-rose-100 text-rose-700 hover:bg-rose-200',
    'Pend. Llamada': 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    '1º Wsp Enviado': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    '2º Wsp Enviado': 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  };

  const activeStyles: Record<FaseOption, string> = {
    Nuevo: 'bg-blue-600 text-white',
    'Pend. Firm. H. E.': 'bg-amber-600 text-white',
    'Pend. Cobro': 'bg-rose-600 text-white',
    'Pend. Llamada': 'bg-orange-600 text-white',
    '1º Wsp Enviado': 'bg-emerald-600 text-white',
    '2º Wsp Enviado': 'bg-teal-600 text-white',
  };

  return `${base} ${active ? activeStyles[option] : styles[option]}`;
};

const getStatusTextColor = (valor?: string | null) => {
  switch (valor) {
    case 'Nuevo': return 'text-blue-600';
    case 'Contratado': return 'text-emerald-600';
    case 'Pend. Firm. H. E.': return 'text-amber-600';
    case 'Pend. Cobro': return 'text-rose-600';
    case 'Pend. Llamada': return 'text-orange-600';
    case '1º Wsp Enviado': return 'text-emerald-600';
    case '2º Wsp Enviado': return 'text-teal-600';
    case 'Llamar más adelante':
      return 'text-orange-500';
    case 'No puede Pagar':
    case 'Perder Coche':
    case 'Perder Vivienda':
    case 'No contesta':
    case 'No tiene Solución':
    case 'Me cuelga':
      return 'text-rose-600';
    default:
      return 'text-slate-500';
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
        <div className="ml-6 relative">
          <button
            type="button"
            onClick={() => setFilterDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <span>{filtroActual}</span>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-900">
              {statusCounts[filtroActual] ?? 0}
            </span>
          </button>
          {filterDropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-slate-200 bg-white shadow-xl">
              {filtroOptions.map((opcion) => (
                <button
                  key={opcion}
                  type="button"
                  onClick={() => {
                    setFiltroActual(opcion);
                    setFilterDropdownOpen(false);
                  }}
                  className={`${getFilterButtonClasses(opcion)} w-full justify-between rounded-none border-0 border-b border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50 ${filtroActual === opcion ? 'shadow-inner' : ''}`}
                >
                  <span>{opcion}</span>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-900">
                    {statusCounts[opcion] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          )}
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
                  <th className="w-40 p-2 font-extrabold text-[#097706]">FASE</th>
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
                  <th className="w-28 p-2 font-extrabold text-[#097706]">F. CONTRAT.</th>                  
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
                      const leadFilterKey = getFilterKey(lead.situacion_final);

                      if (filtroActual === 'Nuevos') {
                        return leadFilterKey === 'Nuevos';
                      }

                      return leadFilterKey === filtroActual;
                    })
                  ).map((lead) => (
                    <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors border-b border-slate-100">
                    {/* FASE */}
                    <td className="p-1 text-center font-bold">
                      <div className="relative inline-flex w-full justify-center">
                        <button
                          type="button"
                          className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          onClick={() => setFaseDropdownOpenId(prev => prev === lead.id ? null : lead.id)}
                        >
                          {lead.estado || 'Nuevo'}
                        </button>
                        {faseDropdownOpenId === lead.id && (
                          <div className="absolute left-1/2 top-full z-30 mt-2 w-56 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                            {faseOptions.map((option) => {
                              const active = lead.fase === option;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  className={`${getFaseButtonClasses(option, active)} mb-2 w-full justify-start ${active ? 'cursor-default' : ''}`}
                                  onClick={() => {
                                    updateField(lead.id, 'fase', option);
                                    setFaseDropdownOpenId(null);
                                  }}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    {/* OBSERVACIONES */}

                    <td className="p-1">
                      <ExpandableTextInput
                        id={lead.id}
                        field="seguimiento"
                        value={lead.seguimiento}
                        placeholder="Añadir nota..."
                      />
                    </td>
                    {/* FECHA CREACIÓN */}
                    <td className="p-2 text-center truncate text-slate-700">
                      {lead.fecha_creacion ? new Date(lead.fecha_creacion).toLocaleDateString('es-ES', { 
                        day: 'numeric',
                        month: 'short'
                      }).replace('.', '').replace(/ /g, '-').replace(/^\w|(?<=-)\w/g, (l) => l.toUpperCase()) : '-'}
                    </td>
                    {/* HORARIO DE LLAMADA */}
                    <td className="p-2 text-center truncate text-slate-700">{lead.horario_llamada}</td>
                    {/* NOMBRE COMPLETO */}
                    <td className="p-2 text-center font-semibold truncate text-slate-700">{lead.nombre_completo}</td>
                    {/* TELÉFONO */}
                    <td className="p-2 font-medium text-center truncate text-slate-700">
                      {lead.telefono ? lead.telefono.replace('+34', '').trim() : ''}
                    </td>
                    {/* PROVINCIA */}
                    <td className="p-2 text-center truncate text-slate-700">{lead.provincia}</td>
                    {/* S. LABORAL */}
                    <td className="p-2 text-center truncate text-slate-700">{lead.situacion}</td>
                    {/* IMPORTE DEUDA*/}
                    <td className="p-2 text-center font-bold">
                      <ExpandableTextInput
                        id={lead.id}
                        field="importe_deuda"
                        value={lead.importe_deuda}
                        placeholder="Deuda pública"
                      />
                    </td>
                    {/* SITUACIÓN PAGOS */}
                    <td className="p-2 text-center truncate text-slate-700">{lead.situacion_pagos}</td>
                    
                    {/* EMBARGOS */}
                    <td className="p-2 text-center truncate text-slate-700">{lead.embargos}</td>
                    {/* PREOCUPACIÓN */}
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
                    {/* VIVIENDA/PROPIEDAD */}
                    <td className="p-2 text-center">
                      <ExpandableTextInput
                        id={lead.id}
                        field="vivienda_propiedad"
                        value={lead.vivienda_propiedad}
                        placeholder="Escribir nota..."
                      />
                    </td>
                    {/* COCHE */}
                    <td className="p-2 text-center">
                      <ExpandableTextInput
                        id={lead.id}
                        field="coche"
                        value={lead.coche}
                        placeholder="Escribir nota..."
                      />
                    </td>
                    {/* DEUDA PÚBLICA */}
                    <td className="p-2 text-center font-bold">
                      <ExpandableTextInput
                        id={lead.id}
                        field="deuda_publica"
                        value={lead.deuda_publica}
                        placeholder="Deuda pública"
                      />
                    </td>
                    {/* SERVICIO DE INTERÉS */}
                    <td className="p-2 text-center font-bold">
                      <ServiceInterestToggle
                        id={lead.id}
                        value={lead.servicio_interes}
                      />
                    </td>
                    {/* ENTRADA IMPORTE */}
                    <td className="p-1 text-center">
                      <ExpandableTextInput
                        id={lead.id}
                        field="entrada_importe"
                        value={lead.entrada_importe}
                        placeholder="Entrada"
                      />
                    </td>
                    {/* CUOTA */}
                    <td className="p-2 text-center font-bold truncate text-slate-700">
                      <ExpandableTextInput
                        id={lead.id}
                        field="cuota_importe"
                        value={lead.cuota_importe}
                        placeholder="Cuota"
                      />
                    </td>
                    {/* NÚMERO DE CUOTAS */}
                    <td className="p-2 text-center truncate text-slate-700">
                      <ExpandableTextInput
                        id={lead.id}
                        field="total_cuotas"
                        value={lead.total_cuotas}
                        placeholder="¿Cuántas?"
                      />
                    </td>
                    {/* FECHA PRIMER PAGO */}
                    <td className="p-2 text-center truncate text-slate-700">
                      <input
                        type="date"
                        className="w-full p-1 text-center bg-transparent border-none text-slate-700"
                        defaultValue={dateToInputValue(lead.fecha_primera_cuota)}
                        onBlur={(e) => updateField(lead.id, 'fecha_primera_cuota', e.target.value)}
                      />
                    </td>
                    {/* HORA DE ENCARGO FIRMADA*/}
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
                    {/* FECHA CONTRATADO */}
                    <td className="p-1 text-center text-slate-500 text-[10px]">
                      {lead.situacion_final === 'Contratado' ? (
                        <input
                          ref={(el) => { dateInputRefs.current[lead.id] = el; }}
                          type="date"
                          className="w-full p-1 text-center bg-transparent border border-slate-200 rounded text-slate-700"
                          value={dateToInputValue(lead.fecha_contratado)}
                          onChange={(e) => updateField(lead.id, 'fecha_contratado', e.target.value)}
                        />
                      ) : (
                        '-'
                      )}
                    </td>
                    {/* SITUACION FINAL */}
                    <td className="p-1 text-center font-bold truncate text-slate-700">
                      {lead.situacion_final === 'Contratado' ? (
                        <div className={`w-full p-1 text-center font-semibold ${getStatusTextColor(lead.situacion_final)}`}>
                          Contratado
                        </div>
                      ) : (
                        <select 
                          className={`w-full p-1 text-center truncate bg-transparent outline-none cursor-pointer ${getStatusTextColor(lead.situacion_final ?? '')}`}
                          value={lead.situacion_final || "Libre"}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            updateField(lead.id, 'situacion_final', newValue);
                            if (newValue === 'Contratado') {
                              setTimeout(() => {
                                dateInputRefs.current[lead.id]?.focus();
                              }, 0);
                            }
                          }}
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
                      )}
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