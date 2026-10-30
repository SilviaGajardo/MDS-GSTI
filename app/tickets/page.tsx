'use client';

import { TicketDetailModal } from '@/components/TicketDetailModal';
import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Filter, 
  User, 
  UserX, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  ArrowLeft,
  Eye 
} from 'lucide-react';

interface Ticket {
  id: number;
  numero_ticket: string;
  es_anonimo?: number | boolean;
  tipo_usuario?: string;
  asunto: string;
  ciudadano: string;
  agente: string;
  departamento: string;
  tipo_llamada: string;
  estado: string;
  fecha_creacion: string;
  descripcion?: string;
}

function TicketsDashboardContent() {
  const searchParams = useSearchParams();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para controlar el ticket seleccionado en el modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Estados de Filtros
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterUserType, setFilterUserType] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Helper centralizado para validar anónimo
  const isTicketAnon = (t: Ticket) => {
    if (t.es_anonimo === 1 || t.es_anonimo === true) return true;
    if (!t.ciudadano) return true;
    const c = t.ciudadano.trim().toLowerCase();
    return c.startsWith('anónimo') || c.startsWith('anonimo');
  };

  // 1. Cargar tickets desde la API
  useEffect(() => {
    async function fetchTickets() {
      try {
        const response = await fetch('/api/tickets');
        const data = await response.json();
        
        const ticketList = Array.isArray(data) ? data : (data.tickets || data.data || []);
        setTickets(ticketList);
      } catch (error) {
        console.error('Error cargando los tickets:', error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTickets();
  }, []);

  // 2. Leer query param ?estado= de la URL
  useEffect(() => {
    const estadoParam = searchParams.get('estado');
    if (estadoParam) {
      setFilterStatus(estadoParam);
    }
  }, [searchParams]);

  // 3. Métricas por Estado
  const stats = useMemo(() => {
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    const total = safeTickets.length;
    const abiertos = safeTickets.filter((t) => t.estado?.toLowerCase() === 'abierto').length;
    const enProceso = safeTickets.filter((t) => t.estado?.toLowerCase() === 'en_proceso' || t.estado?.toLowerCase() === 'en proceso').length;
    const cerrados = safeTickets.filter((t) => t.estado?.toLowerCase() === 'cerrado').length;
    return { total, abiertos, enProceso, cerrados };
  }, [tickets]);

  // 4. Métricas por Tipo de Usuario
  const userStats = useMemo(() => {
    const safeTickets = Array.isArray(tickets) ? tickets : [];
    const anonimos = safeTickets.filter((t) => isTicketAnon(t)).length;
    const registrados = safeTickets.length - anonimos;
    return { registrados, anonimos };
  }, [tickets]);

  // 5. Filtrado combinado
  const filteredTickets = useMemo(() => {
    const safeTickets = Array.isArray(tickets) ? tickets : [];

    return safeTickets.filter((t) => {
      const normalStatus = t.estado?.toLowerCase().replace(' ', '_');
      const isAnon = isTicketAnon(t);

      if (filterStatus !== 'todos' && normalStatus !== filterStatus) {
        return false;
      }

      if (filterUserType === 'registrado' && isAnon) return false;
      if (filterUserType === 'anonimo' && !isAnon) return false;

      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const numMatch = t.numero_ticket?.toLowerCase().includes(q);
        const asuntoMatch = t.asunto?.toLowerCase().includes(q);
        const ciudMatch = t.ciudadano?.toLowerCase().includes(q);
        const deptMatch = t.departamento?.toLowerCase().includes(q);
        return numMatch || asuntoMatch || ciudMatch || deptMatch;
      }

      return true;
    });
  }, [tickets, filterStatus, filterUserType, searchTerm]);

  // Helper formateador de fecha consistente en cliente/servidor
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch {
      return '-';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-6">
      {/* Header y Navegación */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard de Tickets</h1>
          <p className="text-sm text-gray-500">Gestión global de llamadas e incidencias ciudadanas</p>
        </div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setFilterStatus('todos')}
          className={`text-left p-5 rounded-xl border transition-all ${
            filterStatus === 'todos'
              ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
              : 'bg-white border-gray-200 hover:border-gray-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tickets</span>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-2">{stats.total}</p>
        </button>

        <button
          onClick={() => setFilterStatus('abierto')}
          className={`text-left p-5 rounded-xl border transition-all ${
            filterStatus === 'abierto'
              ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-gray-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Abiertos</span>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-amber-600 mt-2">{stats.abiertos}</p>
        </button>

        <button
          onClick={() => setFilterStatus('en_proceso')}
          className={`text-left p-5 rounded-xl border transition-all ${
            filterStatus === 'en_proceso'
              ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white border-gray-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">En Proceso</span>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-blue-600 mt-2">{stats.enProceso}</p>
        </button>

        <button
          onClick={() => setFilterStatus('cerrado')}
          className={`text-left p-5 rounded-xl border transition-all ${
            filterStatus === 'cerrado'
              ? 'bg-green-50 border-green-500 shadow-md ring-2 ring-green-500/20'
              : 'bg-white border-gray-200 hover:border-green-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">Cerrados</span>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-extrabold text-green-600 mt-2">{stats.cerrados}</p>
        </button>
      </div>

      {/* FILTROS SECUNDARIOS */}
      <div className="bg-white border rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Tipo Usuario:
          </span>
          <div className="inline-flex rounded-lg border bg-gray-100 p-1">
            <button
              onClick={() => setFilterUserType('todos')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                filterUserType === 'todos' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterUserType('registrado')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterUserType === 'registrado' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-blue-600" />
              Ciudadano Registrado ({userStats.registrados})
            </button>
            <button
              onClick={() => setFilterUserType('anonimo')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterUserType === 'anonimo' ? 'bg-white text-slate-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-gray-500" />
              Anónimo ({userStats.anonimos})
            </button>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por N°, asunto o ciudadano..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-4 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* TABLA DE VISUALIZACIÓN */}
      {loading ? (
        <div className="text-center py-16 text-gray-500 font-medium">
          Cargando tickets de la base de datos...
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <th className="p-4">N° Ticket</th>
                <th className="p-4">Tipo Usuario</th>
                <th className="p-4">Ciudadano</th>
                <th className="p-4">Asunto</th>
                <th className="p-4">Agente / Depto</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Fecha</th>
                <th className="p-4 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredTickets.length > 0 ? (
                filteredTickets.map((t) => {
                  const isAnon = isTicketAnon(t);
                  const normalState = t.estado?.toLowerCase().replace(' ', '_');

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-600">{t.numero_ticket}</td>

                      <td className="p-4">
                        {isAnon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <UserX className="w-3 h-3" />
                            Anónimo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <User className="w-3 h-3" />
                            Registrado
                          </span>
                        )}
                      </td>

                      <td className="p-4 font-medium text-gray-900">
                        {t.ciudadano}
                      </td>

                      <td className="p-4 font-medium text-gray-800">{t.asunto}</td>

                      <td className="p-4 text-gray-600">
                        <div>{t.agente}</div>
                        <div className="text-xs text-gray-400">{t.departamento || 'Sin asignar'}</div>
                      </td>

                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          normalState === 'abierto' ? 'bg-yellow-100 text-yellow-800' :
                          normalState === 'en_proceso' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {t.estado}
                        </span>
                      </td>

                      <td className="p-4 text-gray-500 text-xs">
                        {formatDate(t.fecha_creacion)}
                      </td>

                      <td className="p-4 text-center">
                        <button
                          onClick={() => setSelectedTicket(t)}
                          className="inline-flex items-center justify-center p-1.5 text-[#2888EC] hover:text-[#1E72C6] hover:bg-blue-50 rounded-full transition-colors"
                          title="Ver detalle del ticket"
                        >
                          <Eye className="w-5 h-5 stroke-[2.2]" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-gray-500">
                    No se encontraron tickets con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal para detalle */}
      <TicketDetailModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Cargando interfaz...</div>}>
      <TicketsDashboardContent />
    </Suspense>
  );
}