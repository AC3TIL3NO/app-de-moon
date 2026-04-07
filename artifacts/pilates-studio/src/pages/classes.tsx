import { useState } from "react";
import {
  useListClasses,
  useCreateClass,
  useDeleteClass,
  useListInstructors,
  getListClassesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, Edit2, Trash2, Clock, User, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CreateClassBodyLevel, CreateClassBodyType } from "@workspace/api-client-react";

const LEVEL_CONFIG = {
  Principiante: {
    bg: "bg-green-50",
    headerBorder: "border-b-green-500",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    cardBorder: "border-l-green-500",
    progressColor: "bg-green-500",
    dot: "bg-green-200",
  },
  Intermedio: {
    bg: "bg-amber-50",
    headerBorder: "border-b-amber-500",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    cardBorder: "border-l-amber-500",
    progressColor: "bg-amber-500",
    dot: "bg-amber-200",
  },
  Avanzado: {
    bg: "bg-purple-50",
    headerBorder: "border-b-purple-500",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    cardBorder: "border-l-purple-500",
    progressColor: "bg-purple-500",
    dot: "bg-purple-200",
  },
} as const;

type Level = keyof typeof LEVEL_CONFIG;
const LEVELS: Level[] = ["Principiante", "Intermedio", "Avanzado"];

export default function Classes() {
  const { data: classes, isLoading } = useListClasses();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filtered = (classes ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const byLevel = Object.fromEntries(
    LEVELS.map((level) => [level, filtered.filter((c) => c.level === level)])
  ) as Record<Level, typeof filtered>;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Clases</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organización por nivel de habilidad</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar clase o instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 rounded-xl bg-card"
            />
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl shadow-sm whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Clase
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex gap-6">
          {LEVELS.map((level) => (
            <div key={level} className="flex-1 min-w-[280px] space-y-3">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4 flex-1">
          {LEVELS.map((level) => {
            const cfg = LEVEL_CONFIG[level];
            const cols = byLevel[level];
            return (
              <div key={level} className="flex-1 min-w-[300px] flex flex-col">
                <div className={`bg-card rounded-t-xl border-b-4 shadow-sm mb-4 ${cfg.headerBorder}`}>
                  <div className={`h-1.5 w-full rounded-t-xl ${cfg.bg}`} />
                  <div className="px-4 py-3 flex justify-between items-center">
                    <h2 className="font-semibold text-foreground">{level}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                      {cols.length} {cols.length === 1 ? "clase" : "clases"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {cols.length === 0 ? (
                    <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground h-32 flex items-center justify-center">
                      Sin clases en este nivel
                    </div>
                  ) : (
                    cols.map((cls) => (
                      <ClassCard key={cls.id} cls={cls} level={level} cfg={cfg} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CreateClassDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

type Cfg = (typeof LEVEL_CONFIG)[Level];

function ClassCard({ cls, cfg }: { cls: { id: number; name: string; instructor: string; time: string; duration: number; type: string; level: string; enrolled: number; capacity: number; status: string }; level: Level; cfg: Cfg }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteClass();

  const handleDelete = () => {
    if (confirm("¿Estás seguro de eliminar esta clase?")) {
      deleteMutation.mutate({ id: cls.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          toast({ title: "Clase eliminada" });
        },
        onError: () => {
          toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
        },
      });
    }
  };

  const fillPct = cls.capacity > 0 ? Math.round((cls.enrolled / cls.capacity) * 100) : 0;
  const isActive = cls.status === "Activa";

  return (
    <div className={`bg-card rounded-xl shadow-sm border border-border border-l-4 ${cfg.cardBorder} p-4 hover:shadow-md transition-shadow group`}>
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{cls.name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{cls.instructor}</span>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="bg-muted/40 rounded-lg p-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <div className="text-xs font-medium text-foreground">{cls.time}</div>
            <div className="text-[10px] text-muted-foreground">{cls.duration} min</div>
          </div>
        </div>
        <div className="bg-muted/40 rounded-lg p-2 flex items-center gap-2">
          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold text-foreground ${cfg.bg}`}>
            {cls.type.substring(0, 1)}
          </div>
          <div className="text-xs font-medium text-foreground truncate">{cls.type}</div>
        </div>
      </div>

      <div className="pt-3 border-t border-border/50">
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{cls.enrolled} / {cls.capacity}</span>
            <span>inscritos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {isActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? "bg-emerald-500" : "bg-muted-foreground"}`} />
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              {cls.status}
            </span>
          </div>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${cfg.progressColor}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

const CLASS_TIME_SLOTS = [
  "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
];

const TIME_LABELS: Record<string, string> = {
  "10:00": "10:00 AM", "11:00": "11:00 AM", "12:00": "12:00 PM",
  "13:00": "1:00 PM", "14:00": "2:00 PM", "15:00": "3:00 PM",
  "16:00": "4:00 PM", "17:00": "5:00 PM", "18:00": "6:00 PM",
};

function CreateClassDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: instructors } = useListInstructors();
  const createMutation = useCreateClass();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    instructorId: "",
    time: "10:00",
    duration: "60",
    capacity: "10",
    level: CreateClassBodyLevel.Principiante,
    type: CreateClassBodyType.Reformer,
    dayOfWeek: "Lunes",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          ...formData,
          instructorId: formData.instructorId ? parseInt(formData.instructorId) : 0,
          duration: 60,
          capacity: parseInt(formData.capacity),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          toast({ title: "Clase creada exitosamente" });
          onOpenChange(false);
          setFormData({
            name: "",
            instructorId: "",
            time: "10:00",
            duration: "60",
            capacity: "10",
            level: CreateClassBodyLevel.Principiante,
            type: CreateClassBodyType.Reformer,
            dayOfWeek: "Lunes",
            date: new Date().toISOString().split("T")[0],
          });
        },
        onError: () => {
          toast({ title: "Error", description: "No se pudo crear la clase", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Nueva Clase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre de la clase</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Reformer Básico"
                className="rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Select value={formData.instructorId} onValueChange={(v) => setFormData({ ...formData, instructorId: v })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors?.map((inst) => (
                      <SelectItem key={inst.id} value={inst.id.toString()}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora de inicio</Label>
                <Select value={formData.time} onValueChange={(v) => setFormData({ ...formData, time: v })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_TIME_SLOTS.map((t) => (
                      <SelectItem key={t} value={t}>{TIME_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duración</Label>
                <div className="flex h-10 items-center px-3 rounded-lg border border-input bg-muted/50 text-sm text-muted-foreground font-medium">
                  60 minutos (fijo)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Cupos</Label>
                <Input
                  id="capacity"
                  type="number"
                  required
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v as CreateClassBodyLevel })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CreateClassBodyLevel).map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as CreateClassBodyType })}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CreateClassBodyType).map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-xl">
              {createMutation.isPending ? "Guardando..." : "Crear Clase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
