import { CheckCircle2, Clock, XCircle, ShoppingCart, CalendarDays, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface ClientMembership {
  id: number;
  membershipName: string;
  startDate: string;
  endDate: string;
  classesUsed: number;
  classesTotal: number;
  status: "Activa" | "Vencida" | "Completada" | "Agotada" | "Cancelada";
  computedStatus: "active" | "expired" | "completed";
}

export function computeMembershipStatus(m: {
  classesUsed: number;
  classesTotal: number;
  endDate: string;
}): "active" | "expired" | "completed" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(m.endDate);
  expiry.setHours(0, 0, 0, 0);

  const unlimited = m.classesTotal === -1;
  const classesExhausted = !unlimited && m.classesUsed >= m.classesTotal;

  if (classesExhausted) return "completed";
  if (expiry < today) return "expired";
  return "active";
}

const STATUS_CONFIG = {
  active: {
    label: "Activa",
    badge: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
    iconColor: "text-green-500",
    bar: "bg-green-500",
    border: "border-green-200",
    bg: "bg-green-50/40",
  },
  expired: {
    label: "Vencida",
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: XCircle,
    iconColor: "text-red-500",
    bar: "bg-red-400",
    border: "border-red-200",
    bg: "bg-red-50/30",
  },
  completed: {
    label: "Completada",
    badge: "bg-gray-100 text-gray-600 border-gray-200",
    icon: CheckCircle2,
    iconColor: "text-gray-400",
    bar: "bg-gray-400",
    border: "border-gray-200",
    bg: "bg-gray-50/50",
  },
};

interface MembershipStatusCardProps {
  membership: ClientMembership;
  onBuyNewPlan?: () => void;
  compact?: boolean;
}

export function MembershipStatusCard({ membership, onBuyNewPlan, compact = false }: MembershipStatusCardProps) {
  const status = computeMembershipStatus(membership);
  const cfg = STATUS_CONFIG[status];
  const StatusIcon = cfg.icon;

  const unlimited = membership.classesTotal === -1;
  const remaining = unlimited ? null : Math.max(0, membership.classesTotal - membership.classesUsed);
  const pct = unlimited ? 100 : Math.min(100, Math.round((membership.classesUsed / membership.classesTotal) * 100));

  const expiryDate = new Date(membership.endDate);
  const formattedExpiry = expiryDate.toLocaleDateString("es-PA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className={`rounded-xl border p-4 ${cfg.border} ${cfg.bg} ${compact ? "space-y-2" : "space-y-3"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon className={`h-4 w-4 shrink-0 ${cfg.iconColor}`} />
          <span className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"} truncate`}>
            {membership.membershipName}
          </span>
        </div>
        <Badge className={`text-xs font-semibold border shrink-0 ${cfg.badge}`}>
          {cfg.label}
        </Badge>
      </div>

      {/* Progress bar */}
      {!unlimited && (
        <div className="space-y-1">
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${cfg.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{membership.classesUsed} de {membership.classesTotal} clases utilizadas</span>
            <span>{pct}%</span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className={`grid ${compact ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
        {!unlimited && remaining !== null && (
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Restantes</div>
              <div className="text-sm font-bold text-foreground">{remaining}</div>
            </div>
          </div>
        )}
        {!unlimited && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <div className="text-xs text-muted-foreground">Usadas</div>
              <div className="text-sm font-bold text-foreground">{membership.classesUsed}</div>
            </div>
          </div>
        )}
        <div className={`flex items-center gap-1.5 ${compact && unlimited ? "col-span-2" : ""}`}>
          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <div>
            <div className="text-xs text-muted-foreground">
              {status === "expired" ? "Venció el" : "Vence el"}
            </div>
            <div className="text-sm font-bold text-foreground">{formattedExpiry}</div>
          </div>
        </div>
      </div>

      {/* CTA for expired or completed */}
      {(status === "expired" || status === "completed") && onBuyNewPlan && (
        <Button
          size="sm"
          variant="outline"
          className="w-full rounded-lg gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
          onClick={onBuyNewPlan}
        >
          <ShoppingCart className="h-3.5 w-3.5" />
          Comprar nuevo plan
        </Button>
      )}

      {status === "expired" && (
        <p className="text-xs text-red-600 font-medium">
          Esta membresía venció. No se permiten nuevas reservas.
        </p>
      )}
    </div>
  );
}
