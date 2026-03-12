import { Badge } from '@/components/ui/badge';
import type { LoanStatus, InstallmentStatus } from '@finance-app/shared';

interface LoanStatusBadgeProps {
  status: LoanStatus;
}

interface InstallmentStatusBadgeProps {
  status: InstallmentStatus;
}

export function LoanStatusBadge({ status }: LoanStatusBadgeProps) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="accent">Activo</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">Completado</Badge>;
    case 'OVERDUE':
      return <Badge variant="destructive">En mora</Badge>;
  }
}

export function InstallmentStatusBadge({ status }: InstallmentStatusBadgeProps) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="secondary">Pendiente</Badge>;
    case 'PAID':
      return <Badge variant="success">Pagado</Badge>;
    case 'OVERDUE':
      return <Badge variant="destructive">Vencida</Badge>;
    case 'PARTIAL':
      return <Badge variant="warning">Parcial</Badge>;
  }
}
