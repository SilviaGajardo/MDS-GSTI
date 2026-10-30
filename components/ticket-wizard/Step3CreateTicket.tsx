'use client';

import { useState } from 'react';
import { Citizen } from '@/lib/types';
import { getDepartmentOptions, getAreasByDepartment } from '@/lib/departments';

interface Step3CreateTicketProps {
  citizen: Citizen;
  ticketType: 'consulta' | 'requerimiento';
  onSubmit: (data: {
    subject: string;
    description: string;
    department?: string;
    area?: string;
    staff?: string;
    attentionMode?: 'normal' | 'llamada_transferida';
    callOutcome?: 'exito' | 'no_contestada' | 'vuelta_mesa_ayuda';
    pendingInformation?: boolean;
  }) => void;
  onBack: () => void;
}

export function Step3CreateTicket({
  citizen,
  ticketType,
  onSubmit,
  onBack,
}: Step3CreateTicketProps) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    department: '',
    area: '',
    staff: '',
    attentionMode: 'normal' as 'normal' | 'llamada_transferida',
    callOutcome: 'exito' as 'exito' | 'no_contestada' | 'vuelta_mesa_ayuda',
    pendingInformation: false,
  });

  const anonymousConsultaOptions = [
    'Horarios de atención',
    'Requisitos para trámites',
    'Información de programas municipales',
    'Consultas generales',
  ];

  const isAnonymous = String(citizen?.id || '').startsWith('anon-');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const departments = getDepartmentOptions();
  const areas = formData.department ? getAreasByDepartment(formData.department) : [];

  // Determinamos si la descripción es obligatoria según la regla solicitada
// Función helper dentro de Step3CreateTicket
const isDescriptionRequired = () => {
  if (isAnonymous && ticketType === 'consulta') {
    return formData.subject.trim().toLowerCase() === 'consultas generales';
  }
  return true; // Para registrado o requerimiento siempre es obligatoria
};

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'El asunto es requerido';
    }

    if (isDescriptionRequired() && !formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.department) {
      newErrors.department = 'Debe seleccionar un departamento';
    }

    if (ticketType !== 'consulta') {
      if (!formData.area) newErrors.area = 'Debe seleccionar un área';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Si la descripción no es obligatoria y se dejó vacía, usaremos el mismo asunto como detalle por defecto
    const finalDescription = formData.description.trim() || formData.subject;

    onSubmit({
      subject: formData.subject,
      description: finalDescription,
      department: formData.department,
      area: ticketType !== 'consulta' ? formData.area : undefined,
      staff: undefined,
      attentionMode: ticketType === 'requerimiento' ? formData.attentionMode : undefined,
      callOutcome:
        ticketType === 'requerimiento' && formData.attentionMode === 'llamada_transferida'
          ? formData.callOutcome
          : undefined,
      pendingInformation: ticketType === 'requerimiento' ? formData.pendingInformation : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          {ticketType === 'consulta' ? 'Nueva Consulta' : 'Nuevo Requerimiento'}
        </h2>
        <p className="mt-2 text-muted-foreground">
          Complete los detalles para {citizen.name || (citizen as any).nombre}
        </p>
      </div>

      <div className="rounded-lg bg-secondary/30 p-4">
        <p className="text-sm text-foreground">
          <span className="font-medium">Ciudadano:</span> {citizen.name || (citizen as any).nombre}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">Asunto *</label>
          {isAnonymous && ticketType === 'consulta' ? (
            <select
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: '' });
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccione el motivo de la consulta</option>
              {anonymousConsultaOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => {
                setFormData({ ...formData, subject: e.target.value });
                if (errors.subject) setErrors({ ...errors, subject: '' });
              }}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Ingrese el asunto del ticket"
            />
          )}
          {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">
            Descripción {isDescriptionRequired() ? '*' : '(Opcional)'}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) setErrors({ ...errors, description: '' });
            }}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder={
              isDescriptionRequired()
                ? 'Describa la consulta en detalle'
                : 'Describa la consulta en detalle (opcional)'
            }
            rows={5}
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
        </div>

        {ticketType === 'requerimiento' && !isAnonymous && (
          <div className="rounded-lg border border-border bg-secondary/20 p-4">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={formData.attentionMode === 'llamada_transferida'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    attentionMode: e.target.checked ? 'llamada_transferida' : 'normal',
                    callOutcome: 'exito',
                  })
                }
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              Llamada transferida
            </label>
            {formData.attentionMode === 'llamada_transferida' && (
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-foreground">
                  Resultado de la llamada *
                </label>
                <select
                  value={formData.callOutcome}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      callOutcome: e.target.value as typeof formData.callOutcome,
                    })
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="exito">Llamada transferida con éxito</option>
                  <option value="no_contestada">No contestada</option>
                  <option value="vuelta_mesa_ayuda">Llamada vuelta a mesa de ayuda</option>
                </select>
              </div>
            )}
          </div>
        )}

        {ticketType === 'requerimiento' && (
          <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-4 dark:border-orange-900 dark:bg-orange-950/20">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-foreground">
              <input
                type="checkbox"
                checked={formData.pendingInformation}
                onChange={(e) =>
                  setFormData({ ...formData, pendingInformation: e.target.checked })
                }
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              Pendiente de información
            </label>
            <p className="mt-2 pl-7 text-sm text-muted-foreground">
              El requerimiento quedará en proceso para completar los antecedentes pendientes.
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground">
            Departamento a{' '}
            {ticketType === 'requerimiento' && formData.attentionMode === 'llamada_transferida'
              ? 'derivar'
              : 'consultar'}{' '}
            *
          </label>
          <select
            value={formData.department}
            onChange={(e) => {
              setFormData({ ...formData, department: e.target.value, area: '', staff: '' });
              if (errors.department) setErrors({ ...errors, department: '' });
            }}
            className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Seleccione un departamento</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department}</p>}
        </div>

        {ticketType !== 'consulta' && formData.department && (
          <div>
            <label className="block text-sm font-medium text-foreground">Área *</label>
            <select
              value={formData.area}
              onChange={(e) => {
                setFormData({ ...formData, area: e.target.value, staff: '' });
                if (errors.area) setErrors({ ...errors, area: '' });
              }}
              className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Seleccione un área</option>
              {areas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
            {errors.area && <p className="mt-1 text-sm text-red-500">{errors.area}</p>}
          </div>
        )}
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
          {ticketType === 'consulta' ? 'Registro de Consulta' : 'Registro de Requerimiento'}
        </button>
      </div>
    </form>
  );
}