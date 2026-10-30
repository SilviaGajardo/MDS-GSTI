'use client';

import { Eye, User, UserX } from 'lucide-react';
import { Ticket } from '@/lib/types';

interface TicketTableProps {
  tickets: Ticket[];
  loading?: boolean;
  onSelectTicket?: (ticket: Ticket) => void;
}

export function TicketTable({ tickets, loading, onSelectTicket }: TicketTableProps) {
  // Helper con casteo seguro para evitar errores de propiedades inexistentes en la interfaz Ticket
  const isAnon = (ticket: any) => {
    if (ticket.es_anonimo === 1 || ticket.es_anonimo === true || ticket.is_anonymous) return true;
    const name = ticket.ciudadano || ticket.citizenName || ticket.nombre_ciudadano;
    if (!name) return true;
    const lowerName = String(name).trim().toLowerCase();
    return lowerName.startsWith('anónimo') || lowerName.startsWith('anonimo');
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 font-medium text-sm">
        Cargando tickets...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-[#f0f4f8] text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider">
          <tr>
            <th className="px-4 py-3">N° Ticket</th>
            <th className="px-4 py-3">Tipo Usuario</th>
            <th className="px-4 py-3">Ciudadano</th>
            <th className="px-4 py-3">Asunto</th>
            <th className="px-4 py-3">Departamento</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3 text-center">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-600">
          {tickets && tickets.length > 0 ? (
            tickets.map((t: Ticket) => {
              const ticket = t as any;
              const anonimo = isAnon(ticket);
              const ticketNumero = ticket.numero_ticket || ticket.ticket_number || `#${ticket.id}`;
              const ticketCiudadano = ticket.ciudadano || ticket.citizenName || ticket.nombre_ciudadano || 'Anónimo';
              const ticketAsunto = ticket.asunto || ticket.subject || 'Sin Asunto';
              const ticketDepto = ticket.departamento || ticket.department || '-';
              const ticketEstado = ticket.estado || ticket.status || 'abierto';
              const normalState = String(ticketEstado).toLowerCase().replace(' ', '_');

              return (
                <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* N° Ticket */}
                  <td className="px-4 py-3 font-mono font-bold text-blue-600">
                    {ticketNumero}
                  </td>

                  {/* Tipo Usuario */}
                  <td className="px-4 py-3">
                    {anonimo ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                        <UserX className="h-3 w-3" />
                        Anónimo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                        <User className="h-3 w-3" />
                        Registrado
                      </span>
                    )}
                  </td>

                  {/* Nombre Ciudadano */}
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {ticketCiudadano}
                  </td>

                  {/* Asunto */}
                  <td className="px-4 py-3 text-slate-600">{ticketAsunto}</td>

                  {/* Departamento */}
                  <td className="px-4 py-3 text-slate-600">{ticketDepto}</td>

                  {/* Badge Estado */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
                        normalState === 'abierto'
                          ? 'bg-yellow-100 text-yellow-800'
                          : normalState === 'en_proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {ticketEstado}
                    </span>
                  </td>

                  {/* Botón Ojito */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onSelectTicket && onSelectTicket(t)}
                      className="inline-flex items-center justify-center p-1.5 text-[#2888EC] hover:text-[#1E72C6] hover:bg-sky-50 rounded-full transition-colors"
                      title="Ver Detalle"
                    >
                      <Eye className="h-4 w-4 stroke-[2.2]" />
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                No hay tickets registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}