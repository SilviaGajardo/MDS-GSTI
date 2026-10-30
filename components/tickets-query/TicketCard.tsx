'use client';

import { useState } from 'react';
import { Ticket, Citizen } from '@/lib/types';
import { CheckCircle, Clock, AlertCircle, MessageSquare, Share2, ChevronDown, ChevronUp } from 'lucide-react';

interface TicketCardProps {
  ticket: Ticket;
  citizen?: Citizen;
}

export function TicketCard({ ticket, citizen }: TicketCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'cerrado':
        return {
          badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: CheckCircle,
          label: 'Cerrado',
        };
      case 'en_proceso':
        return {
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: Clock,
          label: 'En Proceso',
        };
      default:
        return {
          badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
          icon: AlertCircle,
          label: 'Abierto',
        };
    }
  };

  const getTypeConfig = (type: string) => {
    return type === 'consulta'
      ? { icon: MessageSquare, label: 'Consulta', color: 'text-blue-600' }
      : { icon: Share2, label: 'Derivación', color: 'text-orange-600' };
  };

  const statusConfig = getStatusConfig(ticket.status);
  const typeConfig = getTypeConfig(ticket.type);
  const TypeIcon = typeConfig.icon;

  // Renderizar tarjeta cerrada (Consulta completada)
  if (ticket.status === 'cerrado' && ticket.type === 'consulta') {
    return (
      <div className="overflow-hidden rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tracking-wide text-green-700 dark:text-green-400">
                  {ticket.code}
                </span>
                <div className={`inline-flex items-center gap-1 rounded-full ${statusConfig.badge} px-2.5 py-0.5 text-xs font-medium`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
                  {statusConfig.label}
                </div>
              </div>

              <h3 className="font-semibold text-green-900 dark:text-green-200">{ticket.subject}</h3>

              <div className="space-y-2 rounded bg-white/50 p-3 dark:bg-black/20">
                <p className="text-xs font-medium text-green-800 dark:text-green-300">Respuesta entregada:</p>
                <p className="text-sm text-green-700 dark:text-green-400">{ticket.response}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {ticket.department && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1 text-xs font-medium text-green-800 dark:bg-black/20 dark:text-green-300">
                    📋 {ticket.department}
                  </div>
                )}
                {citizen && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/50 px-3 py-1 text-xs font-medium text-green-800 dark:bg-black/20 dark:text-green-300">
                    👤 {citizen.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-green-200 pt-4 dark:border-green-900">
            <div className="flex items-center justify-between text-xs text-green-700 dark:text-green-400">
              <span>Creado: {new Date(ticket.createdAt).toLocaleDateString('es-CL')}</span>
              {ticket.closedAt && (
                <span>Cerrado: {new Date(ticket.closedAt).toLocaleDateString('es-CL')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar tarjeta en proceso (Requerimiento)
  if (ticket.status === 'en_proceso' && ticket.type === 'requerimiento') {
    return (
      <div className="overflow-hidden rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 hover:bg-blue-100/50 dark:hover:bg-blue-900/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold tracking-wide text-blue-700 dark:text-blue-400">
                  {ticket.code}
                </span>
                <div className={`inline-flex items-center gap-1 rounded-full ${statusConfig.badge} px-2.5 py-0.5 text-xs font-medium`}>
                  <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
                  {statusConfig.label}
                </div>
              </div>

              <h3 className="font-semibold text-blue-900 dark:text-blue-200">{ticket.subject}</h3>

              <p className="line-clamp-2 text-sm text-blue-700 dark:text-blue-300">{ticket.description}</p>
            </div>
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronDown className="h-5 w-5 text-blue-600" />
              )}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-blue-200 bg-white/50 p-6 dark:border-blue-900 dark:bg-black/20">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Asunto:</p>
                <p className="mt-1 text-sm text-foreground font-medium">{ticket.subject}</p>
              </div>

              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Descripción:</p>
                <p className="mt-1 text-sm text-foreground">{ticket.description}</p>
              </div>

              {ticket.department && (
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Departamento Asignado:</p>
                  <p className="mt-1 text-sm font-semibold text-blue-900 dark:text-blue-200">{ticket.department}</p>
                </div>
              )}

              {ticket.area && (
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Área:</p>
                  <p className="mt-1 text-sm text-foreground">{ticket.area}</p>
                </div>
              )}

              {ticket.staff && (
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Funcionario a Cargo:</p>
                  <p className="mt-1 text-sm text-foreground">{ticket.staff}</p>
                </div>
              )}

              {citizen && (
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Ciudadano:</p>
                  <p className="mt-1 text-sm text-foreground">{citizen.name}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Información de Fechas:</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Creado: {new Date(ticket.createdAt).toLocaleDateString('es-CL')} - {new Date(ticket.createdAt).toLocaleTimeString('es-CL')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Tarjeta por defecto
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold tracking-wide text-muted-foreground">
              {ticket.code}
            </span>
            <div className={`inline-flex items-center gap-1 rounded-full ${statusConfig.badge} px-2.5 py-0.5 text-xs font-medium`}>
              <div className="h-1.5 w-1.5 rounded-full bg-current"></div>
              {statusConfig.label}
            </div>
          </div>

          <h3 className="font-semibold text-foreground">{ticket.subject}</h3>

          <p className="line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>

          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
              <TypeIcon className="h-3 w-3" />
              {typeConfig.label}
            </div>

            {citizen && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                <span className="h-3 w-3 rounded-full bg-primary"></span>
                {citizen.name}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Creado: {new Date(ticket.createdAt).toLocaleDateString('es-CL')}</span>
          {ticket.closedAt && (
            <span>Cerrado: {new Date(ticket.closedAt).toLocaleDateString('es-CL')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
