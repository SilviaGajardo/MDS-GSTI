'use client';

import { Header } from '@/components/shared/Header';
import { TicketWizard } from '@/components/ticket-wizard/TicketWizard';

export default function NewTicketPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-2xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <TicketWizard />
      </div>
    </main>
  );
}
// app/new-ticket/page.tsx
