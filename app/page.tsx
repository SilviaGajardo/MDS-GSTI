'use client';

import Link from 'next/link';
import { Users, Cpu, ArrowRight } from 'lucide-react';

export default function HubModulosMPH() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      
      {/* BARRA SUPERIOR INSTITUCIONAL MUNICIPAL */}
      <header className="bg-[#285ec4] text-white h-16 px-6 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm tracking-wider">
            MPH
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-wide">MPH - Mi Padre Hurtado</h1>
            <p className="text-[11px] text-blue-100 opacity-90">Plataforma Integrada de Service Desk Municipal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
            Versión Demo ITIL
          </span>
          <div className="flex items-center gap-2 border border-white/20 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium">
            <span>Silvia Gajardo</span>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL: SELECCIÓN DE MÓDULOS */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-6">
          
          {/* TEXTO ACTUALIZADO */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
              Seleccione el módulo de atención
            </h2>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              Acceda al servicio municipal que necesita. Cada módulo cuenta con equipos responsables, servicios especializados y seguimiento de los requerimientos, dentro de una misma plataforma institucional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            {/* MÓDULO 1: ATENCIÓN VECINAL */}
            <Link href="/atencion-vecinal" className="group">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all duration-200 hover:border-[#285ec4] hover:shadow-md h-full flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#285ec4] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#285ec4] group-hover:text-white transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Módulo 1
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">
                    MPH - Atención Vecinal
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Gestión de consultas ciudadanas, orientación comunitaria, solicitudes y derivaciones a DIMAO, DIDECO y direcciones operativas.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-[#285ec4]">
                  <span>Ingresar al Módulo</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

            {/* MÓDULO 2: GESTIÓN DE SERVICIOS TI */}
            <Link href="/servicios-ti" className="group">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm transition-all duration-200 hover:border-[#285ec4] hover:shadow-md h-full flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-12 h-12 bg-blue-50 text-[#285ec4] rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#285ec4] group-hover:text-white transition-colors">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                    Módulo 2
                  </span>
                  <h3 className="text-lg font-bold text-slate-800 mt-2">
                    MPH - Gestión de Servicios TI
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    Soporte técnico interno, gestión de incidentes de software y hardware, infraestructura tecnológica y requerimientos de sistemas.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs font-bold text-[#285ec4]">
                  <span>Ingresar al Módulo</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>

          </div>

          <div className="text-center pt-4">
            <span className="text-[11px] text-slate-400">
              Municipalidad de Padre Hurtado • Ley 21.180 y Ley 21.719
            </span>
          </div>

        </div>
      </main>
    </div>
  );
}