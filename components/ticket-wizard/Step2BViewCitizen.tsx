'use client';

import { Citizen } from '@/lib/types';
import { User, Phone, Mail } from 'lucide-react';

interface Step2BViewCitizenProps {
  citizen: Citizen;
  isAnonymous?: boolean;
  onSelectType: (type: 'consulta' | 'requerimiento') => void;
  onBack: () => void;
}

export function Step2BViewCitizen({ citizen, isAnonymous = false, onSelectType, onBack }: Step2BViewCitizenProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Confirmar Ciudadano</h2>
        <p className="mt-2 text-muted-foreground">Seleccione el tipo de atención</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Nombre</p>
              <p className="text-sm font-semibold text-foreground">{citizen.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Teléfono</p>
              <p className="text-sm font-semibold text-foreground">{citizen.phone}</p>
            </div>
          </div>

          {citizen.email && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">Correo</p>
                <p className="text-sm font-semibold text-foreground">{citizen.email}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">Tipo de Atención *</label>
        {isAnonymous && (
          <p className="mt-1 text-sm text-muted-foreground">
            Como ciudadano anónimo, solo puede realizar una consulta.
          </p>
        )}
        <div className={`mt-3 grid gap-3 ${isAnonymous ? '' : 'sm:grid-cols-2'}`}>
          <button
            onClick={() => onSelectType('consulta')}
            className="rounded-lg border-2 border-transparent bg-blue-50 p-4 text-left transition-all hover:border-blue-300 focus:border-blue-500 focus:outline-none dark:bg-blue-950/30"
          >
            <div className="font-semibold text-blue-900 dark:text-blue-300">Consulta</div>
            <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
              Pregunta que sera respondida inmediatamente
            </p>
          </button>
          {!isAnonymous && (
            <>
            <button
              onClick={() => onSelectType('requerimiento')}
              className="rounded-lg border-2 border-transparent bg-orange-50 p-4 text-left transition-all hover:border-orange-300 focus:border-orange-500 focus:outline-none dark:bg-orange-950/30"
            >
              <div className="font-semibold text-orange-900 dark:text-orange-300">Requerimiento</div>
              <p className="mt-1 text-xs text-orange-700 dark:text-orange-400">
                Será enviada a otra área para su gestión
              </p>
            </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          Atrás
        </button>
      </div>
    </div>
  );
}
