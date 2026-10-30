'use client';

import { useState } from 'react';
import { Citizen, Ticket } from '@/lib/types';
import { Check, AlertCircle } from 'lucide-react';

interface Step4ResponseConsultaProps {
  citizen: Citizen;
  ticket: Ticket;
  onSubmit: (response: string) => void;
  onBack: () => void;
}

export function Step4ResponseConsulta({
  citizen,
  ticket,
  onSubmit,
  onBack,
}: Step4ResponseConsultaProps) {
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!response.trim()) {
      setError('Por favor ingrese una respuesta');
      return;
    }

    setError('');
    setShowSuccess(true);
    onSubmit(response);
  };

  if (showSuccess) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950/30">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-900 dark:text-green-300">
            ¡Consulta Cerrada!
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-400">
            El ticket {ticket.code} ha sido cerrado exitosamente.
          </p>
          <p className="mt-4 font-medium text-foreground">
            Se envió la respuesta a {citizen.name}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="font-semibold text-foreground">Detalles del Ticket</h3>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Código:</dt>
              <dd className="font-medium text-foreground">{ticket.code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ciudadano:</dt>
              <dd className="font-medium text-foreground">{citizen.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estado:</dt>
              <dd className="inline-flex items-center gap-2 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <div className="h-2 w-2 rounded-full bg-green-600"></div>
                Cerrado
              </dd>
            </div>
          </dl>
        </div>

        <a href="/">
          <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Volver al Dashboard
          </button>
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Respuesta a Consulta</h2>
        <p className="mt-2 text-muted-foreground">Ingrese la respuesta para cerrar el ticket</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Al proporcionar una respuesta:</p>
              <p className="mt-1">El ticket se cerrará automáticamente</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-secondary/30 p-4">
          <p className="text-sm">
            <span className="font-medium text-foreground">Consulta de {citizen.name}:</span>
          </p>
          <p className="mt-2 font-semibold text-foreground">{ticket.subject}</p>
          <p className="mt-2 text-sm text-muted-foreground">{ticket.description}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Respuesta *</label>
          <textarea
            value={response}
            onChange={(e) => {
              setResponse(e.target.value);
              if (error) setError('');
            }}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Escriba la respuesta a la consulta del ciudadano..."
            rows={6}
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Atrás
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Cerrar Ticket con Respuesta
        </button>
      </div>
    </form>
  );
}
