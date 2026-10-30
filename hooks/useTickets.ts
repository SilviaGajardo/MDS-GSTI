'use client';

import { useState, useEffect, useCallback } from 'react';

export function useTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [citizens, setCitizens] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicketsAndCitizens = useCallback(async () => {
    try {
      setLoading(true);

      const [resTickets, resCitizens] = await Promise.all([
        fetch('/api/tickets', { cache: 'no-store' }),
        fetch('/api/citizens', { cache: 'no-store' }),
      ]);

      const dataTickets = resTickets.ok ? await resTickets.json() : [];
      const dataCitizens = resCitizens.ok ? await resCitizens.json() : [];

      setTickets(Array.isArray(dataTickets) ? dataTickets : (dataTickets.data || []));
      setCitizens(Array.isArray(dataCitizens) ? dataCitizens : (dataCitizens.data || []));
    } catch (err: any) {
      console.error('Error al sincronizar con la base de datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTicketsAndCitizens();
  }, [fetchTicketsAndCitizens]);

  // 1. Agregar Ciudadano
  const addCitizen = useCallback(async (citizenData: any) => {
    try {
      const response = await fetch('/api/citizens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(citizenData),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error('Detalle del error del servidor:', result);
        throw new Error(result.error || `Error ${response.status}: No se pudo guardar el ciudadano`);
      }

      const newCitizen = result.data || result;
      setCitizens((prev) => [...prev, newCitizen]);
      return newCitizen;
    } catch (err: any) {
      console.error('Error en addCitizen:', err);
      throw err;
    }
  }, []);

  // 2. Crear Ticket
const createTicket = useCallback(async (ticketData: any) => {
  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    });

    // Extraer siempre la respuesta JSON
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = result.error || result.message || `Error ${response.status}: No se pudo crear el ticket`;
      console.error('Detalle del error devuelto por la API:', errorMessage);
      throw new Error(errorMessage);
    }

    const newTicket = result.data || result;
    setTickets((prev) => [newTicket, ...prev]);
    return newTicket;
  } catch (err: any) {
    console.error('Error en createTicket:', err);
    throw err;
  }
}, []);

  // 3. Actualizar Ticket con Respuesta
  const updateTicketWithResponse = useCallback(
    async (ticketId: string, responseText: string) => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ respuesta: responseText, estado: 'cerrado' }),
        });
        if (response.ok) fetchTicketsAndCitizens();
      } catch (err) {
        console.error('Error actualizando ticket:', err);
      }
    },
    [fetchTicketsAndCitizens]
  );

  // 4. Derivar Ticket
  const updateTicketToDerivar = useCallback(
    async (ticketId: string, department: string) => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ department, status: 'en_proceso' }),
        });
        if (response.ok) fetchTicketsAndCitizens();
      } catch (err) {
        console.error('Error derivando ticket:', err);
      }
    },
    [fetchTicketsAndCitizens]
  );

  // 5. Obtener Ticket por ID
  const getTicketById = useCallback(
    (id: string) => tickets.find((t) => String(t.id) === String(id) || String(t.code) === String(id)),
    [tickets]
  );

  const getTicketStats = useCallback(() => {
    const total = tickets.length;
    const abiertos = tickets.filter((t) => t.estado === 'abierto' || t.status === 'abierto').length;
    const enProceso = tickets.filter((t) => t.estado === 'en_proceso' || t.status === 'en_proceso').length;
    const cerrados = tickets.filter((t) => t.estado === 'cerrado' || t.status === 'cerrado').length;
    return { total, abiertos, enProceso, cerrados };
  }, [tickets]);

  const getAllTickets = useCallback(() => tickets, [tickets]);

  const getCitizenById = useCallback(
    (id: string) => citizens.find((c) => String(c.id) === String(id)),
    [citizens]
  );

  return {
    tickets,
    citizens,
    loading,
    error,
    addCitizen,
    createTicket,
    updateTicketWithResponse,
    updateTicketToDerivar,
    getTicketById,
    getTicketStats,
    getAllTickets,
    getCitizenById,
    refreshTickets: fetchTicketsAndCitizens,
  };
}