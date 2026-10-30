import { Headphones } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary p-2">
            <Headphones className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mesa de Ayuda</h1>
            <p className="text-sm text-muted-foreground">Sistema de gestión de tickets</p>
          </div>
        </div>
      </div>
    </header>
  );
}
