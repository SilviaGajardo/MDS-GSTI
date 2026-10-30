'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Citizen, Ticket } from '@/lib/types';
import { useTickets } from '@/hooks/useTickets';
import { Step1SearchCitizen } from './Step1SearchCitizen';
import { Step2ARegisterCitizen } from './Step2ARegisterCitizen';
import { Step3CreateTicket } from './Step3CreateTicket';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

type Step = 'type' | 'search' | 'register' | 'view' | 'create' | 'redirect';

export function TicketWizard() {
  const router = useRouter();
  const {
    citizens,
    addCitizen,
    createTicket,
  } = useTickets();

  const [step, setStep] = useState<Step>('type');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [ticketType, setTicketType] = useState<'consulta' | 'requerimiento' | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [redirectPath, setRedirectPath] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (redirectPath) {
      const timer = setTimeout(() => {
        router.push(redirectPath);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [redirectPath, router]);

  const handleCitizenFound = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setStep('create');
  };

  const handleNotFound = () => {
    setStep('register');
  };

  const handleAnonymous = () => {
    if (ticketType !== 'consulta') return;

    const anonymousCitizen: Citizen = {
      id: `anon-${Date.now()}`,
      name: 'Ciudadano General',
    };
    setSelectedCitizen(anonymousCitizen);
    setStep('create');
  };

  const handleRegisterCitizen = async (citizen: Citizen) => {
    try {
      if (typeof addCitizen === 'function') {
        const savedCitizen = await addCitizen(citizen);
        setSelectedCitizen(savedCitizen || citizen);
      } else {
        setSelectedCitizen(citizen);
      }
      setStep('create');
    } catch (error) {
      console.error('Error al registrar ciudadano:', error);
    }
  };

  // 🛠️ CORREGIDO: Mapeo garantizado de ciudadano y atributos del ticket
  const handleCreateTicket = async (data: {
    subject: string;
    description: string;
    department?: string;
    area?: string;
    staff?: string;
    attentionMode?: 'normal' | 'llamada_transferida';
    callOutcome?: 'exito' | 'no_contestada' | 'vuelta_mesa_ayuda';
    pendingInformation?: boolean;
  }) => {
    if (!selectedCitizen) {
      setErrorMessage('Debe seleccionar o registrar un ciudadano antes de continuar.');
      return;
    }

    setErrorMessage(null);

    try {
      let newTicket: Ticket | null = null;

      if (typeof createTicket === 'function') {
        // Separamos el nombre para enviarlo como 'nombre' y 'apellido' si están disponibles
        const citizenNameParts = selectedCitizen.name ? selectedCitizen.name.split(' ') : [];
        const nombre = citizenNameParts[0] || '';
        const apellido = citizenNameParts.slice(1).join(' ') || '';

        // Determinamos si es anónimo
        const isAnon = String(selectedCitizen.id).startsWith('anon-');

        // Construcción completa del payload con alias en inglés y español para compatibilidad total
        const payload: any = {
          // Identificadores de Ciudadano (Formatos duplicados para match con API/Hook)
          citizenId: isAnon ? null : selectedCitizen.id,
          ciudadano_id: isAnon ? null : selectedCitizen.id,
          isAnonymous: isAnon,
          
          // Datos personales directos por si el id no fue guardado previamente en DB
          nombre: nombre,
          apellido: apellido,
          telefono: (selectedCitizen as any).phone || (selectedCitizen as any).telefono || null,
          correo: (selectedCitizen as any).email || (selectedCitizen as any).correo || null,

          // Tipos de Ticket (Compatibilidad con ambos nombres de propiedad)
          type: ticketType,
          tipo: ticketType,
          tipo_llamada: ticketType === 'consulta' ? 'consulta_rapida' : 'requerimiento',

          // Contenido del Ticket
          subject: data.subject,
          asunto: data.subject,
          description: data.description,
          descripcion: data.description,
          detalles: data.description,

          // Campos opcionales / Asignación
          department: data.department,
          departmentId: data.department,
          departamento_id: data.department,
          es_transferida: data.attentionMode === 'llamada_transferida',
          resultado_llamada: data.callOutcome,
          estado_transferencia: data.callOutcome,
          pendiente_informacion: data.pendingInformation,
        };

        newTicket = await createTicket(payload);
      }

      setCreatedTicket(newTicket || ({ code: 'TK-NUEVO' } as Ticket));
      setRedirectPath('/');
      setStep('redirect');
    } catch (error: any) {
      console.error('Error al crear ticket:', error);
      setErrorMessage(error.message || 'Error al procesar la solicitud.');
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    switch (step) {
      case 'register':
        setStep('search');
        break;
      case 'view':
        setSelectedCitizen(null);
        setStep('search');
        break;
      case 'search':
        setStep('type');
        break;
      case 'create':
        setStep('search');
        break;
      default:
        break;
    }
  };

  if (step === 'redirect' && createdTicket) {
    const isConsulta = ticketType === 'consulta';
    const bgColor = isConsulta ? 'bg-green-50' : 'bg-blue-50';
    const borderColor = isConsulta ? 'border-green-200' : 'border-blue-200';
    const darkBgColor = isConsulta ? 'dark:bg-green-950/30' : 'dark:bg-blue-950/30';
    const darkBorderColor = isConsulta ? 'dark:border-green-900' : 'dark:border-blue-900';
    const titleColor = isConsulta ? 'text-green-900 dark:text-green-300' : 'text-blue-900 dark:text-blue-300';
    const textColor = isConsulta ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400';
    const iconColor = isConsulta ? 'text-green-600' : 'text-blue-600';
    const bgIconColor = isConsulta ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30';

    return (
      <div className="space-y-6">
        <div className={`rounded-lg border-2 ${borderColor} ${bgColor} p-8 text-center ${darkBgColor} ${darkBorderColor}`}>
          <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${bgIconColor}`}>
            <svg
              className={`h-8 w-8 ${iconColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-2xl font-bold ${titleColor}`}>
            {isConsulta ? '¡Consulta creada y cerrada!' : '¡Requerimiento creado!'}
          </h2>
          <p className={`mt-2 ${textColor}`}>
            {isConsulta
              ? `El ticket ${createdTicket.code || (createdTicket as any).numero_ticket || ''} ha sido registrado y cerrado exitosamente.`
              : `El requerimiento ${createdTicket.code || (createdTicket as any).numero_ticket || ''} quedó registrado para gestión posterior.`
            }
          </p>
          <p className="mt-4 font-medium text-foreground">
            Redirigiendo al dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/">
          <button className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
            <ChevronLeft className="h-4 w-4" />
            Volver
          </button>
        </Link>
        <div className="flex gap-2">
          {['type', 'search', 'register', 'view', 'create'].map((s, i) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-colors ${
                step === s || (step === 'redirect' && i < 5)
                  ? 'bg-primary'
                  : ['type', 'search', 'register', 'view', 'create'].indexOf(step) > i
                    ? 'bg-primary'
                    : 'bg-secondary'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Alerta de Error si la API rechaza el ticket */}
      {errorMessage && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200 dark:bg-red-950/40 dark:border-red-900">
          <div className="flex">
            <div className="text-sm font-medium text-red-800 dark:text-red-200">
              {errorMessage}
            </div>
          </div>
        </div>
      )}

      {/* Card Container */}
      <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
        {step === 'type' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Nuevo ticket</h2>
              <p className="mt-2 text-muted-foreground">Seleccione el tipo de atención que desea registrar</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => { setTicketType('consulta'); setStep('search'); }}
                className="rounded-lg border-2 border-transparent bg-blue-50 p-5 text-left transition-all hover:border-blue-300 focus:border-blue-500 focus:outline-none dark:bg-blue-950/30"
              >
                <div className="font-semibold text-blue-900 dark:text-blue-300">Consulta</div>
                <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">Pregunta que será respondida inmediatamente</p>
              </button>
              <button
                type="button"
                onClick={() => { setTicketType('requerimiento'); setStep('search'); }}
                className="rounded-lg border-2 border-transparent bg-orange-50 p-5 text-left transition-all hover:border-orange-300 focus:border-orange-500 focus:outline-none dark:bg-orange-950/30"
              >
                <div className="font-semibold text-orange-900 dark:text-orange-300">Requerimiento</div>
                <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">Será enviado a otra área para su gestión</p>
              </button>
            </div>
          </div>
        )}

        {step === 'search' && (
          <Step1SearchCitizen
            citizens={citizens}
            onCitizenFound={handleCitizenFound}
            onNotFound={handleNotFound}
            onAnonymous={handleAnonymous}
            onBack={handleBack}
            allowAnonymous={ticketType === 'consulta'}
          />
        )}

        {step === 'register' && (
          <Step2ARegisterCitizen
            onRegister={handleRegisterCitizen}
            onBack={handleBack}
          />
        )}

        {step === 'create' && selectedCitizen && ticketType && (
          <Step3CreateTicket
            citizen={selectedCitizen}
            ticketType={ticketType}
            onSubmit={handleCreateTicket}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}