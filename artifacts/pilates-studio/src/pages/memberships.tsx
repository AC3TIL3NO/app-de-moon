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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Plus, Users, CheckCircle2, Pencil, Tag, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pilates-studio$/, "") + "/api";

const HIGHLIGHTED_PLAN = "Pilates Plus";

const STATUS_COLORS: Record<string, string> = {
  Activa: "bg-primary/10 text-primary",
  Vencida: "bg-orange-500/10 text-orange-600",
  Agotada: "bg-red-500/10 text-red-600",
  Cancelada: "bg-muted text-muted-foreground",
};

export default function Memberships() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

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
        {isAdmin && <NewPlanDialog />}
      </div>

      <PlansGrid isAdmin={isAdmin} />

      <ClientMembershipsSection isAdmin={isAdmin} />
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
    totalClasses: 1,
    price: 0,
    promoPrice: "",
    durationDays: 30,
    isPublic: true,
  });

  const createMutation = useCreateMembership({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/memberships"] });
        setOpen(false);
        setForm({ name: "", description: "", totalClasses: 1, price: 0, promoPrice: "", durationDays: 30, isPublic: true });
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
            <Label>Nombre del Plan</Label>
            <Input
              placeholder="Ej. Clase Individual"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Descripción (opcional)</Label>
            <Input
              placeholder="Breve descripción del plan"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Clases</Label>
              <Input type="number" min={1} value={form.totalClasses} onChange={(e) => setForm((f) => ({ ...f, totalClasses: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Precio (B/.)</Label>
              <Input type="number" min={0} step="1" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Días vigencia</Label>
              <Input type="number" min={1} value={form.durationDays} onChange={(e) => setForm((f) => ({ ...f, durationDays: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Precio en promoción (B/.) — opcional
            </Label>
            <Input
              type="number"
              min={0}
              step="1"
              placeholder="Dejar vacío si no hay promo"
              value={form.promoPrice}
              onChange={(e) => setForm((f) => ({ ...f, promoPrice: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Si se activa, el cobro se realiza al precio promocional.</p>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                {form.isPublic ? <Globe className="h-3.5 w-3.5 text-primary" /> : <Lock className="h-3.5 w-3.5 text-amber-500" />}
                {form.isPublic ? "Visible al público" : "Solo uso interno (staff)"}
              </Label>
              <p className="text-xs text-muted-foreground">
                {form.isPublic ? "Aparece en el landing page de membresías." : "No aparece al público, solo en cobros internos."}
              </p>
            </div>
            <Switch checked={form.isPublic} onCheckedChange={(v) => setForm((f) => ({ ...f, isPublic: v }))} />
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
                    promoPrice: form.promoPrice !== "" ? Number(form.promoPrice) : null,
                    durationDays: form.durationDays,
                    active: true,
                    isPublic: form.isPublic,
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

function PlansGrid({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: plans, isLoading } = useListMemberships();
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", description: "", totalClasses: 1, price: 0, promoPrice: "", durationDays: 30, isPublic: true,
  });
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
      promoPrice: plan.promoPrice != null ? String(plan.promoPrice) : "",
      durationDays: plan.durationDays,
      isPublic: plan.isPublic,
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
          promoPrice: editForm.promoPrice !== "" ? Number(editForm.promoPrice) : null,
          durationDays: editForm.durationDays,
          isPublic: editForm.isPublic,
        }),
      });
      if (!res.ok) throw new Error();
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
      <div className="space-y-8">
        <div className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!plans?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl bg-muted/20 text-sm">
        No hay planes. Crea el primero.
      </div>
    );
  }

  const publicPlans = plans.filter(p => p.isPublic);
  const internalPlans = plans.filter(p => !p.isPublic);

  function PlanCard({ plan }: { plan: MembershipPlan }) {
    const isDark = plan.name === HIGHLIGHTED_PLAN;
    const features = (plan.description ?? "").split("\n").filter(Boolean);
    const classLabel = plan.totalClasses >= 999 ? "Ilimitadas" : `${plan.totalClasses} clase${plan.totalClasses > 1 ? "s" : ""}`;
    const effectivePrice = plan.promoPrice ?? plan.price;

    return (
      <div
        className={`relative rounded-2xl p-6 flex flex-col border transition-shadow hover:shadow-lg ${
          isDark ? "bg-gray-900 text-white border-gray-800" : "bg-white text-gray-900 border-gray-100"
        }`}
      >
        {isDark && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow">POPULAR</span>
          </div>
        )}

        <div className="mb-1">
          <p className={`text-xs font-bold tracking-widest uppercase mb-1 ${isDark ? "text-amber-400" : "text-primary"}`}>
            {plan.name}
          </p>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            {classLabel} {plan.durationDays === 1 ? "por sesión" : "al mes"}
          </p>
        </div>

        <div className="flex items-end gap-2 my-4">
          <span className={`text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
            B/. {effectivePrice}
          </span>
          {plan.promoPrice != null && (
            <span className={`pb-1 text-base line-through ${isDark ? "text-gray-500" : "text-gray-400"}`}>
              B/. {plan.price}
            </span>
          )}
          {plan.promoPrice != null && (
            <span className="pb-1 text-xs font-bold text-green-500 uppercase tracking-wider">Promo</span>
          )}
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
              {plan.durationDays === 1 ? "Pago por clase" : `${plan.durationDays} días de vigencia`}
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
          {isAdmin && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${isDark ? "text-gray-400 hover:text-amber-300 hover:bg-white/5" : "text-muted-foreground hover:text-primary"}`}
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
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Public plans */}
      {publicPlans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Planes de Membresía</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">Públicos</Badge>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {publicPlans.map(plan => <PlanCard key={plan.id} plan={plan} />)}
          </div>
        </div>
      )}

      {/* Internal plans */}
      {internalPlans.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">Clases por Sesión</h2>
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 text-xs">Solo staff</Badge>
          </div>
          <p className="text-sm text-muted-foreground -mt-2">Planes internos para cobros individuales. No visibles al público.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {internalPlans.map(plan => (
              <div
                key={plan.id}
                className="rounded-2xl border border-amber-100 bg-amber-50/30 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  </div>
                  <Lock className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                </div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-foreground">
                    B/. {plan.promoPrice ?? plan.price}
                  </span>
                  {plan.promoPrice != null && (
                    <>
                      <span className="pb-0.5 text-sm line-through text-muted-foreground">B/. {plan.price}</span>
                      <span className="pb-0.5 text-xs font-bold text-green-600 uppercase">Promo</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-100">
                  <Badge variant="secondary" className={plan.active ? "bg-primary/10 text-primary text-xs" : "text-xs"}>
                    {plan.active ? "Activo" : "Inactivo"}
                  </Badge>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEdit(plan)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate({ id: plan.id })}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
                <Input type="number" min={0} step="1" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Días</Label>
                <Input type="number" min={1} value={editForm.durationDays} onChange={(e) => setEditForm((f) => ({ ...f, durationDays: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" />
                Precio en promoción (B/.) — opcional
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="Dejar vacío para quitar promo"
                value={editForm.promoPrice}
                onChange={(e) => setEditForm((f) => ({ ...f, promoPrice: e.target.value }))}
              />
              {editForm.promoPrice !== "" && (
                <p className="text-xs text-green-600 font-medium">
                  Precio efectivo: B/. {editForm.promoPrice} (ahorro B/. {editForm.price - Number(editForm.promoPrice)})
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Características (una por línea)</Label>
              <Textarea
                rows={4}
                placeholder={"8 clases mensuales\nAcceso a clases grupales"}
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="resize-none font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20">
              <div>
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  {editForm.isPublic ? <Globe className="h-3.5 w-3.5 text-primary" /> : <Lock className="h-3.5 w-3.5 text-amber-500" />}
                  {editForm.isPublic ? "Visible al público" : "Solo uso interno (staff)"}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editForm.isPublic ? "Aparece en el landing page." : "No visible al público."}
                </p>
              </div>
              <Switch checked={editForm.isPublic} onCheckedChange={(v) => setEditForm((f) => ({ ...f, isPublic: v }))} />
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

function ClientMembershipsSection({ isAdmin }: { isAdmin: boolean }) {
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
                {cm.status === "Activa" && isAdmin && (
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
