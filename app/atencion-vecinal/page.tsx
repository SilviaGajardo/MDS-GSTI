'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { useTickets } from '@/hooks/useTickets';
import { TicketTable } from '@/components/tickets-query/TicketTable';
import { TicketDetailModal } from '@/components/TicketDetailModal';
import { Ticket } from '@/lib/types';
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  Plus,
  Search,
  Filter,
  X,
  Users,
  Cpu,
  ArrowLeft,
  Ticket as TicketIcon,
} from 'lucide-react';

export default function AtencionVecinalPage() {
  const { tickets, getTicketStats, loading, refreshTickets } = useTickets();

  const stats = getTicketStats
    ? getTicketStats()
    : {
        total: 0,
        abiertos: 0,
        enProceso: 0,
        cerrados: 0,
      };

const [filterState, setFilterState] = useState<
  'todos' | 'abierto' | 'en_proceso' | 'cerrado' | 'activos'
>('todos');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Filtrado combinado: estado y búsqueda.
  const filteredTickets = (tickets || []).filter((t: Ticket) => {
    const ticket = t as any;

    const st = String(ticket.estado || ticket.status || '')
      .toLowerCase()
      .replace(' ', '_');

    let matchState = true;

    if (filterState === 'activos') {
      matchState = st === 'abierto' || st === 'en_proceso';
    } else if (filterState !== 'todos') {
      matchState = st === filterState;
    }

    const query = searchTerm.trim().toLowerCase();
    let matchSearch = true;

    if (query) {
      const ticketNum = String(
        ticket.numero_ticket || ticket.ticket_number || ticket.id || ''
      ).toLowerCase();

      const ciudadano = String(
        ticket.ciudadano ||
          ticket.citizenName ||
          ticket.nombre_ciudadano ||
          ''
      ).toLowerCase();

      const asunto = String(
        ticket.asunto || ticket.subject || ticket.motivo || ''
      ).toLowerCase();

      const depto = String(
        ticket.departamento || ticket.department || ''
      ).toLowerCase();

      const correo = String(
        ticket.correo || ticket.email || ''
      ).toLowerCase();

      matchSearch =
        ticketNum.includes(query) ||
        ciudadano.includes(query) ||
        asunto.includes(query) ||
        depto.includes(query) ||
        correo.includes(query);
    }

    return matchState && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Menú lateral */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0">
        <div className="p-4 bg-[#285ec4] text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center font-extrabold text-xs tracking-wider">
            MPH
          </div>

          <div className="leading-tight">
            <span className="text-xs font-black block">
              MPH - Mi Padre Hurtado
            </span>

            <span className="text-[10px] text-blue-100 font-medium opacity-80">
              Plataforma de Gestión
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 text-xs text-slate-600 overflow-y-auto">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al Hub
          </Link>

          <div className="px-3 pt-3 pb-1 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Módulos de Atención
          </div>

          {/* Módulo 1: Atención Vecinal, activo */}
          <Link
            href="/atencion-vecinal"
            aria-current="page"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-semibold border-l-4 border-[#285ec4]"
          >
            <span className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>MPH - Atención Vecinal</span>
            </span>

            <span className="text-blue-600">&rsaquo;</span>
          </Link>

          {/* Módulo 2: Servicios TI */}
          <Link
            href="/servicios-ti"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-slate-400" />
              <span>MPH - Servicios TI</span>
            </span>

            <span className="text-slate-400">&rsaquo;</span>
          </Link>

          {/* Módulo 3: Ticket Soporte */}
          <Link
            href="/ticket-soporte"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors"
          >
            <span className="flex items-center gap-2.5">
              <TicketIcon className="w-4 h-4 text-slate-400" />
              <span>MPH - Ticket Soporte</span>
            </span>

            <span className="text-slate-400">&rsaquo;</span>
          </Link>
        </nav>
      </aside>

      {/* Área principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior institucional */}
        <header className="bg-[#285ec4] text-white h-14 px-6 flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold tracking-wide">
              Sistema Gestión Interna Municipal | MPH - Mi Padre Hurtado
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-emerald-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full">
              Versión Demo
            </span>

            <div className="flex items-center gap-2 border border-white/20 px-3 py-1 rounded-full bg-white/10 text-xs font-medium">
              <span>Silvia Gajardo</span>
            </div>
          </div>
        </header>

        {/* Cabecera del módulo */}
        <div className="w-full shrink-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-[#285ec4] rounded-xl border border-blue-100">
              <Users className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                Módulo 1
              </span>

              <h2 className="text-lg font-black text-slate-800 leading-tight mt-1">
                MPH - Atención Vecinal
              </h2>

              <p className="text-xs text-slate-500">
                Consultas ciudadanas, orientación y derivaciones comunitarias
              </p>
            </div>
          </div>

          <Link href="/new-ticket">
            <button className="bg-[#285ec4] hover:bg-[#1e4a9e] text-white text-sm font-bold px-6 py-3 rounded-xl shadow-md hover:shadow-lg flex items-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0">
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>+ Ir a Crear Ticket</span>
            </button>
          </Link>
        </div>

        {/* Contenedor principal */}
        <main className="p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Estadísticas */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-800">
                  Estadísticas y Filtros de Estado
                </h2>

                <span className="text-xs text-slate-400">
                  Haz clic en una tarjeta para filtrar por estado
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* Total */}
                <div
                  onClick={() => setFilterState('todos')}
                  className={`group relative rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 cursor-pointer flex items-center justify-between overflow-hidden ${
                    filterState === 'todos'
                      ? 'ring-2 ring-[#285ec4] border-[#285ec4] bg-blue-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Total de Tickets
                    </p>

                    <p className="text-3xl font-extrabold mt-1 text-slate-800">
                      {loading ? '...' : stats.total}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>

                {/* Abiertos */}
                <div
                  onClick={() => setFilterState('abierto')}
                  className={`group relative rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 cursor-pointer flex items-center justify-between overflow-hidden ${
                    filterState === 'abierto'
                      ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Abiertos
                    </p>

                    <p className="text-3xl font-extrabold mt-1 text-amber-600">
                      {loading ? '...' : stats.abiertos}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                </div>

                {/* En proceso */}
                <div
                  onClick={() => setFilterState('en_proceso')}
                  className={`group relative rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 cursor-pointer flex items-center justify-between overflow-hidden ${
                    filterState === 'en_proceso'
                      ? 'ring-2 ring-blue-400 border-blue-400 bg-blue-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      En Proceso
                    </p>

                    <p className="text-3xl font-extrabold mt-1 text-blue-600">
                      {loading ? '...' : stats.enProceso}
                    </p>
                  </div>

                  <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                    <Clock className="h-6 w-6" />
                  </div>
                </div>

                {/* Cerrados */}
                <div
                  onClick={() => setFilterState('cerrado')}
                  className={`group relative rounded-xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 cursor-pointer flex items-center justify-between overflow-hidden ${
                    filterState === 'cerrado'
                      ? 'ring-2 ring-emerald-400 border-emerald-400 bg-emerald-50/20'
                      : 'border-slate-200'
                  }`}
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Cerrados
                    </p>

                    <p className="text-3xl font-extrabold mt-1 text-emerald-600">
                      {loading ? '...' : stats.cerrados}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </section>

            {/* Búsqueda y tabla */}
            <section className="space-y-4 pt-2">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-800">
                    {filterState === 'todos' &&
                      'Todos los Tickets'}
                    {filterState === 'activos' &&
                      'Requerimientos Activos (Abiertos y En Proceso)'}

                    {filterState === 'abierto' &&
                      'Tickets en Estado Abierto'}

                    {filterState === 'en_proceso' &&
                      'Tickets En Proceso'}

                    {filterState === 'cerrado' &&
                      'Historial de Tickets Cerrados'}
                  </h2>

                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#285ec4]">
                    {filteredTickets.length}
                  </span>
                </div>

                {filterState !== 'activos' && (
                  <button
                    onClick={() => setFilterState('activos')}
                    className="text-xs font-medium text-[#285ec4] hover:underline"
                  >
                    &larr; Volver a Requerimientos Activos
                  </button>
                )}
              </div>

              {/* Barra de búsqueda */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="relative w-full md:w-2/3">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />

                  <input
                    type="text"
                    placeholder="Buscar por N° ticket, ciudadano, asunto o departamento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#285ec4] text-slate-700"
                  />

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />

                  <select
                    value={filterState}
                    onChange={(e) =>
                      setFilterState(e.target.value as any)
                    }
                    className="w-full md:w-auto px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#285ec4]"
                  >
                    <option value="activos">
                      Estado: Requerimientos Activos
                    </option>
                    <option value="todos">
                      Estado: Todos los Tickets
                    </option>
                    <option value="abierto">
                      Estado: Abiertos
                    </option>
                    <option value="en_proceso">
                      Estado: En Proceso
                    </option>
                    <option value="cerrado">
                      Estado: Cerrados
                    </option>
                  </select>
                </div>
              </div>

              {/* Tabla de resultados */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <TicketTable
                  tickets={filteredTickets}
                  loading={loading}
                  onSelectTicket={(ticket: Ticket) =>
                    setSelectedTicket(ticket)
                  }
                />
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* Detalle del ticket vecinal */}
      {selectedTicket && (
      <TicketDetailModal
      key={String(selectedTicket.id)}
      ticket={selectedTicket}
      onClose={() => setSelectedTicket(null)}
      onTicketUpdated={() => {
        if (refreshTickets) {
          void refreshTickets();
        }
      }}
    />
  )}
    </div>
  );
}