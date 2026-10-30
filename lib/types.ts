// @/lib/types.ts
export interface Citizen {
  id: string | number;
  name?: string;
  nombre?: string;
  email?: string;
  correo?: string;
  phone?: string;
  telefono?: string;
  // ...otros campos
}

export interface Ticket {
  id: string;
  code: string;
  citizenId: string;
  type: 'consulta' | 'requerimiento';
  attentionMode?: 'normal' | 'llamada_transferida';
  callOutcome?: 'exito' | 'no_contestada' | 'vuelta_mesa_ayuda';
  pendingInformation?: boolean;
  status: 'abierto' | 'en_proceso' | 'cerrado';
  subject: string;
  description: string;
  response?: string;
  department?: string; // Departamento asociado a la atención
  area?: string; // Área específica dentro del departamento
  staff?: string; // Funcionario a cargo
  derivedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}
