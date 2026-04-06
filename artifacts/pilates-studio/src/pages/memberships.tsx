import { useState } from "react";
import { motion } from "framer-motion";
import {
  useListMemberships,
  useCreateMembership,
  useDeleteMembership,
  useListClientMemberships,
  useDeleteClientMembership,
  useCreateCheckoutSession,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus, CreditCard, Users, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Memberships() {
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Membresías</h1>
        <p className="text-muted-foreground mt-2">Gestiona planes de membresía y asignaciones a clientes.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <MembershipPlansSection />
        <ClientMembershipsSection />
      </div>
    </motion.div>
  );
}

function MembershipPlansSection() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const checkout = useCreateCheckoutSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    totalClasses: 8,
    price: 0,
    durationDays: 30,
  });

  const { data: plans, isLoading } = useListMemberships();
  const createMutation = useCreateMembership({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/memberships"] });
        setOpen(false);
        setForm({ name: "", description: "", totalClasses: 8, price: 0, durationDays: 30 });
        toast({ title: "Plan creado correctamente." });
      },
      onError: () => toast({ title: "Error al crear el plan.", variant: "destructive" }),
    },
  });
  const deleteMutation = useDeleteMembership({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/memberships"] });
        toast({ title: "Plan eliminado." });
      },
      onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
    },
  });

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Planes de Membresía
          </CardTitle>
          <CardDescription>Define los planes disponibles en tu estudio.</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Plan de Membresía</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="plan-name">Nombre del Plan</Label>
                <Input
                  id="plan-name"
                  placeholder="Ej. Mensual 8 clases"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plan-desc">Descripción (opcional)</Label>
                <Input
                  id="plan-desc"
                  placeholder="Breve descripción del plan"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="plan-classes">Clases</Label>
                  <Input
                    id="plan-classes"
                    type="number"
                    min={1}
                    value={form.totalClasses}
                    onChange={(e) => setForm((f) => ({ ...f, totalClasses: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-price">Precio (€)</Label>
                  <Input
                    id="plan-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="plan-days">Vigencia (días)</Label>
                  <Input
                    id="plan-days"
                    type="number"
                    min={1}
                    value={form.durationDays}
                    onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button
                  onClick={() =>
                    createMutation.mutate({
                      data: {
                        name: form.name,
                        description: form.description || undefined,
                        totalClasses: form.totalClasses,
                        price: form.price,
                        durationDays: form.durationDays,
                        active: true,
                      },
                    })
                  }
                  disabled={!form.name || createMutation.isPending}
                >
                  {createMutation.isPending ? "Guardando..." : "Crear Plan"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : plans?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl bg-muted/20 text-sm">
            No hay planes de membresía. Crea el primero.
          </div>
        ) : (
          <div className="space-y-3">
            {plans?.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{plan.name}</span>
                    <Badge variant="secondary" className={plan.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                      {plan.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  {plan.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{plan.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{plan.totalClasses} clases</span>
                    <span>•</span>
                    <span>{plan.durationDays} días</span>
                    <span>•</span>
                    <span className="font-semibold text-foreground">€{plan.price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    disabled={checkout.isPending}
                    onClick={() => {
                      checkout.mutate(
                        { data: { membershipId: plan.id, clientId: 1 } },
                        {
                          onSuccess: (data) => {
                            if (data.url) {
                              window.open(data.url, "_blank");
                            } else {
                              toast({ title: "Stripe no está configurado", description: "Conecta tu cuenta de Stripe para procesar pagos.", variant: "destructive" });
                            }
                          },
                          onError: () => toast({ title: "Error al iniciar pago", variant: "destructive" }),
                        }
                      );
                    }}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Comprar
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate({ id: plan.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Activa: "bg-primary/10 text-primary",
  Vencida: "bg-orange-500/10 text-orange-600",
  Agotada: "bg-red-500/10 text-red-600",
  Cancelada: "bg-muted text-muted-foreground",
};

function ClientMembershipsSection() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: clientMemberships, isLoading } = useListClientMemberships();
  const deleteMutation = useDeleteClientMembership({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/client-memberships"] });
        toast({ title: "Membresía cancelada." });
      },
      onError: () => toast({ title: "Error al cancelar.", variant: "destructive" }),
    },
  });

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Membresías de Clientes
        </CardTitle>
        <CardDescription>Estado de membresías asignadas a clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : clientMemberships?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl bg-muted/20 text-sm">
            No hay membresías de clientes registradas.
          </div>
        ) : (
          <div className="space-y-3">
            {clientMemberships?.map((cm) => (
              <div key={cm.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-accent/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{cm.clientName}</span>
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[cm.status] ?? "bg-muted text-muted-foreground"}
                    >
                      {cm.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{cm.membershipName}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{cm.classesUsed} / {cm.classesTotal} clases</span>
                    <span>•</span>
                    <span>Vence {new Date(cm.endDate).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
                {cm.status === "Activa" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive shrink-0 ml-2"
                    onClick={() => deleteMutation.mutate({ id: cm.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
