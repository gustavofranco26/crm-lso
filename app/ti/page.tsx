import React from 'react';
import { User, Shield, Target, Award, DollarSign, Briefcase } from 'lucide-react';

export default function MiPerfil() {
  // Datos locales estáticos para evitar dependencias de la base de datos
  const profile = {
    nombre: 'Gustavo Franco',
    rol: 'Full Stack Developer / Team Lead',
    email: 'gustavofranco26@gmail.com', // O tu correo asignado
    comisiones_totales: 160 // Valor de muestra basado en tus cierres (ej. 4 leads a 40€)
  };

  return (
    <div className="min-h-screen bg-[#14171c] p-6 text-white font-sans">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* CABECERA DE PERFIL */}
        <div className="flex flex-col items-center justify-between rounded-xl bg-[#1e222b] p-6 shadow-lg border border-gray-800 md:flex-row md:space-x-6">
          <div className="flex flex-col items-center space-y-4 md:flex-row md:space-x-6 md:space-y-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1b2b24] border border-[#2ecc71]/30">
              <User className="h-10 w-10 text-[#2ecc71]" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-white">{profile.nombre}</h1>
              <p className="text-sm text-gray-400 flex items-center justify-center md:justify-start gap-1.5 mt-1">
                <Briefcase className="h-4 w-4 text-gray-500" /> {profile.rol}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
            </div>
          </div>
          <div className="mt-4 rounded-full bg-[#1b2b24] px-4 py-1.5 text-xs font-semibold text-[#2ecc71] border border-[#2ecc71]/20 flex items-center gap-1.5 md:mt-0">
            <Shield className="h-3.5 w-3.5" /> Cuenta Verificada
          </div>
        </div>

        {/* CONTENEDOR PRINCIPAL: METRICAS Y METAS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* CARD DE COMISIONES */}
          <div className="rounded-xl bg-[#1e222b] p-6 shadow-lg border border-gray-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Comisiones del Mes</h2>
              <div className="rounded-lg bg-[#1b2b24] p-2">
                <DollarSign className="h-5 w-5 text-[#2ecc71]" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-4xl font-extrabold text-white">{profile.comisiones_totales}€</p>
              <p className="text-xs text-gray-500 mt-2">Acumulado automático por cierres efectivos (40€ por lead contratado).</p>
            </div>
          </div>

          {/* CARD METAS DEL TRIMESTRE */}
          <div className="rounded-xl bg-[#1e222b] p-6 shadow-lg border border-gray-800 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-[#2ecc71]" />
                <h2 className="text-base font-semibold text-white">Objetivo Trimestral (Q2)</h2>
              </div>
              <span className="text-xs text-gray-400">Progreso Operativo</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Gestión Automatizada de Cobros (SaaS)</span>
                  <span className="font-medium text-[#2ecc71]">75%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-800">
                  <div className="h-2 rounded-full bg-[#2ecc71]" style={{ width: '75%' }}></div>
                </div>
              </div>

              <div className="rounded-lg bg-[#14171c] p-3 border border-gray-800">
                <div className="flex items-start space-x-2">
                  <Award className="mt-0.5 h-4 w-4 text-[#2ecc71] shrink-0" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <strong className="text-gray-200">Enfoque actual:</strong> Optimización de flujos de comerciales y consistencia en el guardado de datos sin restricciones de formato para acelerar las ventas.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}