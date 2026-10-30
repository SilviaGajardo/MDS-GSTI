'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, Search, Zap } from 'lucide-react';
import { Citizen } from '@/lib/types';

interface Step1SearchCitizenProps {
  onCitizenFound: (citizen: Citizen) => void;
  onNotFound: () => void;
  onAnonymous: () => void;
  onBack: () => void;
  allowAnonymous?: boolean;
  citizens: Citizen[];
}

export function Step1SearchCitizen({
  onCitizenFound,
  onNotFound,
  onAnonymous,
  onBack,
  allowAnonymous = true,
  citizens,
}: Step1SearchCitizenProps) {
  const [searchInput, setSearchInput] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);

  const filteredCitizens = useMemo(() => {
    if (!searchInput.trim()) return [];

    const query = searchInput.toLowerCase();

    return citizens.filter((citizen: any) => {
      // Unificar campos soportando nombres en español (MySQL) e inglés
      const name = `${citizen.nombre || citizen.name || ''} ${citizen.apellido || ''}`.trim();
      const phone = citizen.telefono || citizen.phone || '';
      const email = citizen.correo || citizen.email || '';

      const nameMatch = name.toLowerCase().includes(query);
      const phoneMatch = phone.toLowerCase().includes(query);
      const emailMatch = email.toLowerCase().includes(query);

      return nameMatch || phoneMatch || emailMatch;
    });
  }, [searchInput, citizens]);

  const handleSelectCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    onCitizenFound(citizen);
  };

const handleAnonymous = () => {
    const anonymousCitizen: Citizen = {
      id: `anon-${Date.now()}`,
      name: 'Ciudadano General',
    };
    onAnonymous();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a Nuevo ticket
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Buscar o Registrar Ciudadano</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ingrese datos del ciudadano para buscar en nuestros registros
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">
            Buscar por Nombre, Apellido, Teléfono o Correo
          </label>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ingrese nombre, apellido, teléfono o correo..."
              className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {searchInput && filteredCitizens.length > 0 && (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-border bg-card p-2">
              {filteredCitizens.map((citizen: any) => {
                const displayName = citizen.nombre 
                  ? `${citizen.nombre} ${citizen.apellido || ''}`.trim() 
                  : citizen.name;
                const displayPhone = citizen.telefono || citizen.phone;
                const displayEmail = citizen.correo || citizen.email;

                return (
                  <button
                    key={citizen.id}
                    onClick={() => handleSelectCitizen(citizen)}
                    className="w-full rounded px-3 py-2 text-left hover:bg-secondary transition-colors"
                  >
                    <p className="font-medium text-foreground">{displayName}</p>
                    {displayPhone && <p className="text-xs text-muted-foreground">Tel: {displayPhone}</p>}
                    {displayEmail && <p className="text-xs text-muted-foreground">Correo: {displayEmail}</p>}
                  </button>
                );
              })}
            </div>
          )}

          {searchInput && filteredCitizens.length === 0 && (
            <div className="mt-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950/30">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                No se encontraron resultados. El ciudadano será registrado como nuevo.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              if (searchInput.trim()) {
                onNotFound();
              }
            }}
            disabled={!searchInput.trim()}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Registrar Nuevo Ciudadano
          </button>

          {allowAnonymous && (
            <button
              onClick={handleAnonymous}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              <Zap className="h-4 w-4" />
              Atender como Anónimo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}