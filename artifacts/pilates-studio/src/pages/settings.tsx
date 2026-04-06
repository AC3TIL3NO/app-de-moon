import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useGetStudioSettings, useUpdateStudioSettings } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Save, Building2, Palette } from "lucide-react";

export default function Settings() {
  const { data: settings, isLoading } = useGetStudioSettings();
  const updateSettings = useUpdateStudioSettings();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    cancellationPolicy: "",
    primaryColor: "#7C3AED",
    secondaryColor: "#A78BFA",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name ?? "",
        phone: settings.phone ?? "",
        email: settings.email ?? "",
        address: settings.address ?? "",
        cancellationPolicy: settings.cancellationPolicy ?? "",
        primaryColor: settings.primaryColor ?? "#7C3AED",
        secondaryColor: settings.secondaryColor ?? "#A78BFA",
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(
      { data: form },
      {
        onSuccess: () => toast({ title: "Configuración guardada" }),
        onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
      }
    );
  };

  return (
    <motion.div
      className="space-y-8 max-w-3xl"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-2">Personaliza la información y apariencia de tu estudio.</p>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Información del Estudio</CardTitle>
            <CardDescription>Datos generales de tu estudio de pilates.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del estudio</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="rounded-xl"
                    placeholder="Studio Pilates Madrid"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="rounded-xl"
                    placeholder="+34 911 234 567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="rounded-xl"
                    placeholder="hola@estudio.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    className="rounded-xl"
                    placeholder="Calle Serrano 45, Madrid"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellationPolicy">Política de cancelación</Label>
                <Textarea
                  id="cancellationPolicy"
                  value={form.cancellationPolicy}
                  onChange={e => setForm(f => ({ ...f, cancellationPolicy: e.target.value }))}
                  className="rounded-xl min-h-[100px] resize-none"
                  placeholder="Describe tu política de cancelación..."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border/50">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Palette className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Branding y Colores</CardTitle>
            <CardDescription>Personaliza los colores de tu plataforma.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label htmlFor="primaryColor">Color principal</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  value={form.primaryColor}
                  onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                  className="h-10 w-14 rounded-lg border border-border/50 cursor-pointer bg-card p-1"
                />
                <Input
                  value={form.primaryColor}
                  onChange={e => setForm(f => ({ ...f, primaryColor: e.target.value }))}
                  className="rounded-xl font-mono"
                  placeholder="#7C3AED"
                />
              </div>
              <div className="h-10 rounded-xl flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: form.primaryColor }}>
                Vista previa
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="secondaryColor">Color secundario</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="secondaryColor"
                  value={form.secondaryColor}
                  onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                  className="h-10 w-14 rounded-lg border border-border/50 cursor-pointer bg-card p-1"
                />
                <Input
                  value={form.secondaryColor}
                  onChange={e => setForm(f => ({ ...f, secondaryColor: e.target.value }))}
                  className="rounded-xl font-mono"
                  placeholder="#A78BFA"
                />
              </div>
              <div className="h-10 rounded-xl flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: form.secondaryColor }}>
                Vista previa
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateSettings.isPending || isLoading}
          className="gap-2 px-6"
        >
          <Save className="h-4 w-4" />
          {updateSettings.isPending ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </motion.div>
  );
}
