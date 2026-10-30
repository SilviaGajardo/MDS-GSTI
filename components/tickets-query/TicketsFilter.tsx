'use client';

import { Search, Filter } from 'lucide-react';

interface TicketsFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  typeFilter: string;
  onTypeChange: (type: string) => void;
}

export function TicketsFilter({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
}: TicketsFilterProps) {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Filter className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">Filtros</h3>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-foreground">Búsqueda</label>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Código, asunto..."
              className="flex-1 bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los estados</option>
            <option value="abierto">Abiertos</option>
            <option value="en_proceso">En Proceso</option>
            <option value="cerrado">Cerrados</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Tipo</label>
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los tipos</option>
            <option value="consulta">Consultas</option>
            <option value="requerimiento">Requerimientos</option>
          </select>
        </div>
      </div>
    </div>
  );
}
