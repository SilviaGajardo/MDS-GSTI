'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Eye, 
  X, 
  User, 
  UserX, 
  Calendar, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  MessageSquarePlus, 
  History, 
  Send 
} from 'lucide-react';

export interface Ticket {
  id: number | string;
  numero_ticket?: string;
  asunto?: string;
  subject?: string;
  detalles?: string;
  descripcion?: string;
  description?: string;
  ciudadano?: string;
  citizenName?: string;
  agente?: string;
  departamento?: string;
  department?: string;
  tipo_llamada?: string;
  ticketType?: string;
  estado?: string;
  status?: string;
  es_anonimo?: number | boolean;
  fecha_creacion?: string;
}

interface HistorialItem {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  comentario: string;
  fecha_registro: string;
  agente: string;
}

interface TicketDetailModalProps {
  ticket: Ticket | null;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

export function TicketDetailModal({ ticket, onClose, onTicketUpdated }: TicketDetailModalProps) {
  const [fullTicket, setFullTicket] = useState<Ticket | null>(ticket);
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Formulario de avances
  const [nuevoEstado, setNuevoEstado] = useState<string>('en_proceso');
  const [comentarioAvance, setComentarioAvance] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Extraer el identificador primario para consultas SQL
  const targetId = useMemo(() => {
    if (!ticket) return null;
    return ticket.id ?? ticket.numero_ticket ?? null;
  }, [ticket]);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Cargar detalles completos e historial directamente desde MySQL
  const fetchTicketDetails = useCallback(async (id: string | number, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tickets/${id}`, { signal });
      if (response.ok) {
        const data = await response.json();
        const resultTicket = data.ticket || data.data || data;
        setFullTicket(resultTicket);
        setHistorial(data.historial || []);

        if (resultTicket?.estado) {
          setNuevoEstado(resultTicket.estado.toLowerCase().replace(' ', '_'));
        }
      } else {
        setFullTicket(ticket);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error al obtener el detalle del ticket:', error);
        setFullTicket(ticket);
      }
    } finally {
      setLoading(false);
    }
  }, [ticket]);

  // Cargar datos cuando cambia el ticket
  useEffect(() => {
    if (!targetId) {
      setFullTicket(null);
      setHistorial([]);
      return;
    }

    const controller = new AbortController();
    fetchTicketDetails(targetId, controller.signal);

    return () => controller.abort();
  }, [targetId, fetchTicketDetails]);

  if (!ticket) return null;

  const activeTicket = fullTicket || ticket;

  // Determinar anonimato de forma estricta
  const isAnon = (() => {
    if (activeTicket.es_anonimo === 1 || activeTicket.es_anonimo === true) return true;
    const name = activeTicket.ciudadano || activeTicket.citizenName;
    if (!name) return true;
    const lowerName = name.trim().toLowerCase();
    return lowerName.startsWith('anónimo') || lowerName.startsWith('anonimo');
  })();

  const numeroTicketDisplay = activeTicket.numero_ticket || `#${activeTicket.id}`;
  const ciudadanoDisplay = activeTicket.ciudadano || activeTicket.citizenName || 'Anónimo';
  const tipoLlamadaDisplay = activeTicket.tipo_llamada || activeTicket.ticketType || 'Consulta';
  const departamentoDisplay = activeTicket.departamento || activeTicket.department || 'Sin Departamento Asignado';
  const agenteDisplay = activeTicket.agente || 'Sin Agente Asignado';
  const estadoDisplay = activeTicket.estado || activeTicket.status || 'Abierto';
  const asuntoDisplay = activeTicket.asunto || activeTicket.subject || 'Sin asunto especificado';
  const descripcionDisplay = activeTicket.detalles || activeTicket.descripcion || activeTicket.description;

  const normalState = estadoDisplay.toLowerCase().replace(' ', '_');

  // Enviar el avance a la API
  const handleGuardarAvance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetId || !comentarioAvance.trim()) return;

    setSubmitting(true);
    setMensajeExito(null);

    try {
      const res = await fetch(`/api/tickets/${targetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado,
          comentario: comentarioAvance,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setComentarioAvance('');
        setMensajeExito('Avance registrado y estado actualizado correctamente.');
        
        // Recargar datos actualizados de MySQL
        await fetchTicketDetails(targetId);

        // Notificar a la vista principal
        if (onTicketUpdated) onTicketUpdated();
      } else {
        alert(data.error || 'Error al actualizar el ticket.');
      }
    } catch (err) {
      console.error('Error al guardar avance:', err);
      alert('Ocurrió un error al intentar guardar el avance.');
    } finally {
      setSubmitting(false);
    }
  };

  // Formateador de fecha seguro
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      return new Intl.DateTimeFormat('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl rounded-xl bg-card p-6 shadow-2xl border border-border bg-white text-gray-900 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <Eye className="h-5 w-5 text-[#2888EC]" />
            <span>Detalle del Ticket {numeroTicketDisplay}</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido del Ticket */}
        {loading ? (
          <div className="py-12 text-center text-sm font-medium text-gray-500">
            Cargando detalles del ticket...
          </div>
        ) : (
          <div className="mt-4 space-y-5 text-sm">
            
            {/* Grid de Metadatos */}
            <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
              {/* Tipo Usuario */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo Usuario</p>
                {isAnon ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 border border-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    <UserX className="h-3 w-3" />
                    Anónimo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-semibold text-blue-700">
                    <User className="h-3 w-3" />
                    Registrado
                  </span>
                )}
              </div>

              {/* Ciudadano */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Ciudadano</p>
                <p className="font-semibold text-gray-900">{ciudadanoDisplay}</p>
              </div>

              {/* Tipo de Llamada */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de Llamada / Ticket</p>
                <p className="font-medium capitalize text-gray-800">
                  {tipoLlamadaDisplay.replace('_', ' ')}
                </p>
              </div>

              {/* Departamento */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Departamento</p>
                <p className="font-medium text-gray-800">{departamentoDisplay}</p>
              </div>

              {/* Agente Responsable */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Agente Responsable</p>
                <p className="font-medium text-gray-800">{agenteDisplay}</p>
              </div>

              {/* Estado */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                    normalState === 'abierto'
                      ? 'bg-amber-100 text-amber-800'
                      : normalState === 'en_proceso'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {normalState === 'abierto' && <AlertCircle className="w-3 h-3" />}
                  {normalState === 'en_proceso' && <Clock className="w-3 h-3" />}
                  {normalState === 'cerrado' && <CheckCircle className="w-3 h-3" />}
                  {estadoDisplay}
                </span>
              </div>
            </div>

            {/* Asunto */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Asunto</p>
              <p className="mt-1 font-semibold text-gray-900 text-base">{asuntoDisplay}</p>
            </div>

            {/* Descripción / Detalles */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción / Detalles</p>
              <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {descripcionDisplay && descripcionDisplay.trim() !== ''
                  ? descripcionDisplay
                  : 'Sin descripción adicional.'}
              </div>
            </div>

            {/* REGLA DE NEGOCIO: SOLO EDICIÓN PARA REQUERIMIENTOS ABIERTOS O EN PROCESO */}
            {(() => {
              const esRequerimiento = (activeTicket.tipo_llamada || '').toLowerCase().includes('requerimiento');
              const estaCerrado = normalState === 'cerrado';

              // CASO A: Consulta (Respuesta inmediata, solo lectura)
              if (!esRequerimiento) {
                return (
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-900 uppercase">Consulta Rápida - Respuesta Inmediata</p>
                      <p className="text-xs text-blue-700">Las consultas son resueltas inmediatamente y quedan en estado cerrado por defecto.</p>
                    </div>
                  </div>
                );
              }

              // CASO B: Requerimiento Cerrado (Solo lectura)
              if (estaCerrado) {
                return (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-green-900 uppercase">Requerimiento Finalizado</p>
                      <p className="text-xs text-green-700">Este requerimiento se encuentra cerrado. La bitácora ha sido archivada.</p>
                    </div>
                  </div>
                );
              }

              // CASO C: Requerimiento Abierto o En Proceso (Habilitar Edición)
              return (
                <form onSubmit={handleGuardarAvance} className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-900 font-semibold text-sm">
                    <MessageSquarePlus className="w-4 h-4 text-[#2888EC]" />
                    <span>Gestionar Requerimiento (Avance / Cambio de Estado)</span>
                  </div>

                  {mensajeExito && (
                    <div className="text-xs font-medium text-green-700 bg-green-100 p-2 rounded-md">
                      {mensajeExito}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nuevo Estado *</label>
                    <select
                      value={nuevoEstado}
                      onChange={(e) => setNuevoEstado(e.target.value)}
                      className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="abierto">Abierto</option>
                      <option value="en_proceso">En Proceso</option>
                      <option value="cerrado">Cerrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Comentario / Avance de Gestión *</label>
                    <textarea
                      rows={2}
                      required
                      value={comentarioAvance}
                      onChange={(e) => setComentarioAvance(e.target.value)}
                      placeholder="Describa las acciones realizadas o los avances pendientes..."
                      className="w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2888EC] hover:bg-[#1E72C6] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? 'Guardando...' : 'Guardar Avance'}
                    </button>
                  </div>
                </form>
              );
            })()}

            {/* HISTORIAL / BITÁCORA DE AVANCES */}
            {historial.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2 font-semibold text-gray-700 text-xs uppercase tracking-wider">
                  <History className="w-4 h-4 text-gray-500" />
                  <span>Bitácora de Avances ({historial.length})</span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {historial.map((h) => (
                    <div key={h.id} className="rounded-lg border border-gray-200 bg-white p-2.5 text-xs space-y-1 shadow-sm">
                      <div className="flex items-center justify-between text-gray-500">
                        <span className="font-semibold text-gray-700">{h.agente}</span>
                        <span>{formatDate(h.fecha_registro)}</span>
                      </div>
                      <p className="text-gray-800 text-sm">{h.comentario}</p>
                      <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">
                        Cambio: <span className="capitalize">{h.estado_anterior || 'Inicio'}</span> &rarr; <span className="font-semibold capitalize text-blue-600">{h.estado_nuevo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fecha de Creación */}
            {activeTicket.fecha_creacion && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Creado el: {formatDate(activeTicket.fecha_creacion)}</span>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#2888EC] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E72C6] shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}