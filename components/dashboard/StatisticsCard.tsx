import { LucideIcon } from 'lucide-react';

interface StatisticsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
}

export function StatisticsCard({ label, value, icon: Icon, colorClass }: StatisticsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${colorClass}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
