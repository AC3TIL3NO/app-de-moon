import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useStudio } from "@/contexts/studio";
import {
  Save, Building2, Palette, CreditCard, Plus, Trash2,
  GripVertical, Image, Phone, Mail, MapPin, FileText,
} from "lucide-react";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pilates-studio$/, "") + "/api";

const PRESET_COLORS = [
  { label: "Violeta", value: "#7C3AED" },
  { label: "Violeta claro", value: "#8B5CF6" },
  { label: "Índigo", value: "#6366F1" },
  { label: "Azul", value: "#3B82F6" },
  { label: "Celeste", value: "#0EA5E9" },
  { label: "Teal", value: "#14B8A6" },
  { label: "Verde", value: "#10B981" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Rojo", value: "#EF4444" },
  { label: "Naranja", value: "#F97316" },
  { label: "Ámbar", value: "#F59E0B" },
  { label: "Gris", value: "#334155" },
];

const SUGGESTED_METHODS = ["Zelle", "SINPE Móvil", "Nequi", "PayPhone", "Binance Pay"];

const DEFAULT_PAYMENT_METHODS = [
  "Efectivo", "Yappy", "Visa", "Mastercard", "PayPal", "PagueloFacil", "Transferencia",
];

export default function Settings() {
  const { settings, loading, refresh } = useStudio();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    cancellationPolicy: "",
    logoUrl: "",
    primaryColor: "#7C3AED",
    secondaryColor: "#A78BFA",
  });
  const [paymentMethods, setPaymentMethods] = useState<string[]>(DEFAULT_PAYMENT_METHODS);
  const [newMethod, setNewMethod] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        address: settings.address ?? "",
        cancellationPolicy: settings.cancellationPolicy ?? "",
        logoUrl: settings.logoUrl ?? "",
        primaryColor: settings.primaryColor ?? "#7C3AED",
        secondaryColor: settings.secondaryColor ?? "#A78BFA",
      });
      setPaymentMethods(
        settings.paymentMethods?.length ? settings.paymentMethods : DEFAULT_PAYMENT_METHODS
      );
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("pilates_token") ?? "";
      const res = await fetch(`${API_BASE}/studio/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, paymentMethods }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Configuración guardada correctamente." });
      refresh();
    } catch {
      toast({ title: "Error al guardar la configuración.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addMethod = () => {
    const m = newMethod.trim();
    if (!m || paymentMethods.includes(m)) return;
    setPaymentMethods(pm => [...pm, m]);
    setNewMethod("");
  };

  const removeMethod = (m: string) => {
    setPaymentMethods(pm => pm.filter(x => x !== m));
  };

  return (
    <motion.div
      className="space-y-6 max-w-3xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Solo los administradores pueden editar esta sección.</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="gap-2 rounded-xl font-semibold"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>

      {/* Studio Info */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Información del Estudio</CardTitle>
            <CardDescription>Nombre, contacto y dirección.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Building2 className="h-3.5 w-3.5" /> Nombre del estudio
                  </Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="rounded-xl"
                    placeholder="Moon Pilates Studio"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Phone className="h-3.5 w-3.5" /> Teléfono
                  </Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="rounded-xl"
                    placeholder="+507 6586-9949"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <Mail className="h-3.5 w-3.5" /> Correo electrónico
                  </Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="rounded-xl"
                    placeholder="moonpilatesstudiopty@gmail.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <MapPin className="h-3.5 w-3.5" /> Dirección
                  </Label>
                  <Input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="rounded-xl"
                    placeholder="Atrio Mall, Costa del Este, Piso 2"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <FileText className="h-3.5 w-3.5" /> Política de cancelación
                </Label>
                <Textarea
                  value={form.cancellationPolicy}
                  onChange={e => setForm(f => ({ ...f, cancellationPolicy: e.target.value }))}
                  className="rounded-xl min-h-[80px] resize-none"
                  placeholder="Las cancelaciones deben realizarse con al menos 24 horas de anticipación."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Logo */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Image className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Logo del Estudio</CardTitle>
            <CardDescription>Se muestra en la barra lateral de navegación.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="h-16 w-16 rounded-2xl border-2 border-border/50 overflow-hidden flex items-center justify-center bg-muted/30">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="Vista previa del logo"
                    className="h-full w-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center text-2xl font-black text-white"
                    style={{ backgroundColor: form.primaryColor }}
                  >
                    {form.name ? form.name.charAt(0).toUpperCase() : "M"}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">Vista previa</p>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">URL del logo</Label>
              <Input
                value={form.logoUrl}
                onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                className="rounded-xl"
                placeholder="https://ejemplo.com/logo.png"
              />
              <p className="text-xs text-muted-foreground">
                Pega la URL de tu logo (PNG, JPG o SVG con fondo transparente recomendado).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Colores de la Plataforma</CardTitle>
            <CardDescription>El color principal se aplica en toda la interfaz al guardar.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
              Color principal
            </Label>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_COLORS.map(c => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setForm(f => ({ ...f, primaryColor: c.value }))}
                  className={`h-9 w-9 rounded-xl border-2 transition-all shadow-sm hover:scale-110 ${
                    form.primaryColor === c.value
                      ? "border-gray-800 scale-110 shadow-md ring-2 ring-offset-1 ring-gray-400"
                      : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.primaryColor}
                onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                className="h-10 w-14 rounded-xl border border-border/50 cursor-pointer p-1 bg-background"
                title="Selector personalizado"
              />
              <Input
                value={form.primaryColor}
                onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                className="rounded-xl font-mono w-32"
                placeholder="#7C3AED"
                maxLength={7}
              />
              <div
                className="flex-1 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-sm transition-colors"
                style={{ backgroundColor: form.primaryColor }}
              >
                Vista previa
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">
              Color secundario / acento
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.secondaryColor}
                onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                className="h-10 w-14 rounded-xl border border-border/50 cursor-pointer p-1 bg-background"
                title="Selector de color secundario"
              />
              <Input
                value={form.secondaryColor}
                onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                className="rounded-xl font-mono w-32"
                placeholder="#A78BFA"
                maxLength={7}
              />
              <div
                className="flex-1 h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold shadow-sm transition-colors"
                style={{ backgroundColor: form.secondaryColor }}
              >
                Vista previa
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Métodos de Cobro</CardTitle>
            <CardDescription>Define los métodos disponibles en el módulo de caja.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {paymentMethods.map(m => (
              <div
                key={m}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20 group hover:bg-muted/40 transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <span className="flex-1 text-sm font-medium text-foreground">{m}</span>
                <button
                  onClick={() => removeMethod(m)}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  title={`Eliminar ${m}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {paymentMethods.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay métodos configurados. Agrega al menos uno.
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <Input
              value={newMethod}
              onChange={e => setNewMethod(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addMethod()}
              placeholder="Agregar método (ej: Zelle, SINPE...)"
              className="rounded-xl flex-1"
            />
            <Button
              variant="outline"
              onClick={addMethod}
              disabled={!newMethod.trim() || paymentMethods.includes(newMethod.trim())}
              className="rounded-xl gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </div>

          {SUGGESTED_METHODS.filter(m => !paymentMethods.includes(m)).length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground self-center">Sugeridos:</span>
              {SUGGESTED_METHODS.filter(m => !paymentMethods.includes(m)).map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethods(pm => [...pm, m])}
                  className="text-xs px-2.5 py-1 rounded-full border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-colors"
                >
                  + {m}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          size="lg"
          className="gap-2 rounded-xl font-semibold px-8"
        >
          <Save className="h-4 w-4" />
          {saving ? "Guardando..." : "Guardar todos los cambios"}
        </Button>
      </div>
    </motion.div>
  );
}
