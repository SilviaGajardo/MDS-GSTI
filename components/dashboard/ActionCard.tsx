import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface ActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export function ActionCard({ title, description, href, icon: Icon }: ActionCardProps) {
  return (
    <Link href={href}>
      <div className="group cursor-pointer rounded-lg border border-border bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary">
          <Icon className="h-6 w-6 text-secondary-foreground group-hover:text-primary-foreground" />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 text-sm font-medium text-primary">Continuar →</div>
      </div>
    </Link>
  );
}
