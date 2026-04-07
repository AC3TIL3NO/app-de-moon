import { useState } from "react";
import { motion } from "framer-motion";
import {
  useListMemberships,
  useCreateMembership,
  useDeleteMembership,
  useListClientMemberships,
  useDeleteClientMembership,
  type MembershipPlan,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus, Users, CheckCircle2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pilates-studio$/, "") + "/api";

const HIGHLIGHTED_PLAN = "Moon Flow";

const STATUS_COLORS: Record<string, string> = {
  Activa: "bg-primary/10 text-primary",
  Vencida: "bg-orange-500/10 text-orange-600",
  Agotada: "bg-red-500/10 text-red-600",
  Cancelada: "bg-muted text-muted-foreground",
};

export default function Memberships() {
  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Membresías</h1>
          <p className="text-muted-foreground mt-2">Planes disponibles y membresías activas de clientes.</p>
        </div>
        <NewPlanDialog />
      </div>

      <PlansGrid />

      <ClientMembershipsSection />
    </motion.div>
  );
}

function NewPlanDialog() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    totalClasses: 8,
    price: 0,
    durationDays: 30,
  });

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
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
              placeholder="Ej. Moon Start"
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
              <Label htmlFor="plan-price">Precio (B/.)</Label>
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
              <Label htmlFor="plan-days">Días</Label>
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
  );
}

function PlansGrid() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: plans, isLoading } = useListMemberships();
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", totalClasses: 8, price: 0, durationDays: 30 });
  const [saving, setSaving] = useState(false);

  const deleteMutation = useDeleteMembership({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/memberships"] });
        toast({ title: "Plan eliminado." });
      },
      onError: () => toast({ title: "Error al eliminar.", variant: "destructive" }),
    },
  });

  function openEdit(plan: MembershipPlan) {
    setEditForm({
      name: plan.name,
      description: plan.description ?? "",
      totalClasses: plan.totalClasses,
      price: plan.price,
      durationDays: plan.durationDays,
    });
    setEditingPlan(plan);
  }

  async function saveEdit() {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("pilates_token");
      const res = await fetch(`${API_BASE}/memberships/${editingPlan.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          totalClasses: editForm.totalClasses,
          price: editForm.price,
          durationDays: editForm.durationDays,
        }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      qc.invalidateQueries({ queryKey: ["/memberships"] });
      setEditingPlan(null);
      toast({ title: "Plan actualizado correctamente." });
    } catch {
      toast({ title: "Error al guardar el plan.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
      </div>
    );
  }

  if (!plans?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl bg-muted/20 text-sm">
        No hay planes de membresía. Crea el primero.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const isDark = plan.name === HIGHLIGHTED_PLAN;
          const features = (plan.description ?? "").split("\n").filter(Boolean);
          const classLabel = plan.totalClasses >= 999 ? "Ilimitadas" : `${plan.totalClasses} clases`;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col border transition-shadow hover:shadow-lg ${
                isDark
                  ? "bg-gray-900 text-white border-gray-800"
                  : "bg-white text-gray-900 border-gray-100"
              }`}
            >
              {isDark && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    POPULAR
                  </span>
                </div>
              )}

              <div className="mb-1">
                <p className={`text-xs font-bold tracking-widest uppercase mb-1 ${isDark ? "text-violet-400" : "text-primary"}`}>
                  {plan.name}
                </p>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {classLabel} al mes
                </p>
              </div>

              <div className="flex items-end gap-1 my-4">
                <span className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                  B/. {plan.price}
                </span>
                <span className={`pb-1 text-sm ${isDark ? "text-gray-400" : "text-gray-400"}`}>/mes</span>
              </div>

              <ul className="space-y-2 flex-1">
                {features.length > 0 ? features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <span className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${isDark ? "bg-primary/30" : "bg-primary/10"}`}>
                      <CheckCircle2 className={`h-3 w-3 ${isDark ? "text-white" : "text-primary"}`} />
                    </span>
                    <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>{feat}</span>
                  </li>
                )) : (
                  <li className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {plan.durationDays} días de vigencia
                  </li>
                )}
              </ul>

              <div className="mt-5 flex items-center justify-between gap-2">
                <Badge
                  variant="secondary"
                  className={plan.active
                    ? (isDark ? "bg-white/10 text-white" : "bg-primary/10 text-primary")
                    : "bg-muted text-muted-foreground"
                  }
                >
                  {plan.active ? "Activo" : "Inactivo"}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${isDark ? "text-gray-400 hover:text-violet-300 hover:bg-white/5" : "text-muted-foreground hover:text-primary"}`}
                    onClick={() => openEdit(plan)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 ${isDark ? "text-gray-400 hover:text-red-400 hover:bg-white/5" : "text-muted-foreground hover:text-destructive"}`}
                    onClick={() => deleteMutation.mutate({ id: plan.id })}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editingPlan} onOpenChange={(o) => !o && setEditingPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre del Plan</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Clases</Label>
                <Input type="number" min={1} value={editForm.totalClasses} onChange={(e) => setEditForm((f) => ({ ...f, totalClasses: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Precio (B/.)</Label>
                <Input type="number" min={0} step="0.01" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Días</Label>
                <Input type="number" min={1} value={editForm.durationDays} onChange={(e) => setEditForm((f) => ({ ...f, durationDays: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Características (una por línea)</Label>
              <Textarea
                rows={6}
                placeholder={"8 clases mensuales\nAcceso a clases grupales\nSoporte por WhatsApp"}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="resize-none font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Cada línea aparece como una característica en el landing page.</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
              <Button onClick={saveEdit} disabled={!editForm.name || saving}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
                    <span>Vence {new Date(cm.endDate).toLocaleDateString("es-PA", { day: "2-digit", month: "short", year: "numeric" })}</span>
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
