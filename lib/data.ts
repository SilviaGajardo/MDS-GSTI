'use client';

import { Citizen, Ticket } from './types';

// In-memory data store
export let citizens: Citizen[] = [
  {
    id: '1',
    name: 'Juan García López',
    rut: '12345678-9',
    phone: '+56 9 1234 5678',
    email: 'juan.garcia@example.com',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'María Rodriguez Silva',
    rut: '87654321-0',
    phone: '+56 9 8765 4321',
    email: 'maria.rodriguez@example.com',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'Carlos Martínez Pérez',
    rut: '11111111-1',
    phone: '+56 9 1111 1111',
    createdAt: new Date('2024-03-10'),
  },
];

export let tickets: Ticket[] = [
  {
    id: '1',
    code: 'TKT-2024-001',
    citizenId: '1',
    type: 'consulta',
    status: 'cerrado',
    subject: 'Consulta sobre trámite de residencia',
    description: 'Necesito información sobre el proceso de residencia temporal',
    response: 'El proceso de residencia temporal toma aproximadamente 30 días hábiles.',
    createdAt: new Date('2024-06-01'),
    updatedAt: new Date('2024-06-02'),
    closedAt: new Date('2024-06-02'),
  },
  {
    id: '2',
    code: 'TKT-2024-002',
    citizenId: '2',
    type: 'requerimiento',
    status: 'en_proceso',
    subject: 'Derivación a Departamento de Inmigración',
    description: 'Requiere revisión especial de documentación',
    derivedTo: 'Inmigración',
    createdAt: new Date('2024-06-05'),
    updatedAt: new Date('2024-06-05'),
  },
];

export function addCitizen(citizen: Citizen) {
  citizens.push(citizen);
}

export function findCitizenByRut(rut: string) {
  return citizens.find((c) => c.rut === rut);
}

export function findCitizenByPhone(phone: string) {
  return citizens.find((c) => c.phone === phone);
}

export function addTicket(ticket: Ticket) {
  tickets.push(ticket);
}

export function getCitizenTickets(citizenId: string) {
  return tickets.filter((t) => t.citizenId === citizenId);
}

export function getTicketById(id: string) {
  return tickets.find((t) => t.id === id);
}

export function updateTicket(id: string, updates: Partial<Ticket>) {
  const ticket = tickets.find((t) => t.id === id);
  if (ticket) {
    Object.assign(ticket, updates, { updatedAt: new Date() });
  }
  return ticket;
}

export function generateTicketCode(): string {
  const year = new Date().getFullYear();
  const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  const lastCode = tickets[tickets.length - 1]?.code || 'TKT-0000-000';
  const lastNum = parseInt(lastCode.split('-')[2]) || 0;
  return `TKT-${year}-${String(lastNum + 1).padStart(3, '0')}`;
}

export function generateCitizenId(): string {
  return String(Math.max(...citizens.map((c) => parseInt(c.id) || 0)) + 1);
}

export function getTicketStats() {
  const total = tickets.length;
  const abiertos = tickets.filter((t) => t.status === 'abierto').length;
  const enProceso = tickets.filter((t) => t.status === 'en_proceso').length;
  const cerrados = tickets.filter((t) => t.status === 'cerrado').length;
  return { total, abiertos, enProceso, cerrados };
}
