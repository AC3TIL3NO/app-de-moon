import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useListClasses,
  useCreateClass,
  useDeleteClass,
  useListReservations,
  useCreateReservation,
  useCancelReservation,
  useMarkAttendance,
  useSendTestNotification,
  useListClients,
  useListInstructors,
  getListClassesQueryKey,
  getListReservationsQueryKey,
  CreateClassBodyLevel,
  CreateClassBodyType,
  PilatesClass,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  UserMinus,
  CheckCircle2,
  Circle,
  MessageCircle,
  Users,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const TIME_SLOTS = [
  { value: "10:00", label: "10:00 AM", end: "11:00 AM" },
  { value: "11:00", label: "11:00 AM", end: "12:00 PM" },
  { value: "12:00", label: "12:00 PM", end: "1:00 PM" },
  { value: "13:00", label: "1:00 PM",  end: "2:00 PM" },
  { value: "14:00", label: "2:00 PM",  end: "3:00 PM" },
  { value: "15:00", label: "3:00 PM",  end: "4:00 PM" },
  { value: "16:00", label: "4:00 PM",  end: "5:00 PM" },
  { value: "17:00", label: "5:00 PM",  end: "6:00 PM" },
  { value: "18:00", label: "6:00 PM",  end: "7:00 PM" },
];

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  Reformer: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-700", dot: "bg-violet-500" },
  Mat:      { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-700", dot: "bg-emerald-500" },
  Privada:  { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-700", dot: "bg-amber-500" },
};

const CAPACITY = 6;

function getWeekDates(offset: number): { label: string; date: string; dayName: string }[] {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1 - day) + offset * 7;
  monday.setDate(now.getDate() + diff);
  return DAYS.map((dayName, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dayName,
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("es-PA", { day: "numeric", month: "short" }),
    };
  });
}

export default function Classes() {
  const { data: classes, isLoading } = useListClasses();
  const [weekOffset, setWeekOffset] = useState(0);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaults, setCreateDefaults] = useState<{ day: string; time: string; date: string } | null>(null);

  const weekDates = getWeekDates(weekOffset);

  const getClass = (dayName: string, time: string) =>
    (classes ?? []).find((c) => c.dayOfWeek === dayName && c.time === time) ?? null;

  const weekLabel = (() => {
    const first = weekDates[0];
    const last = weekDates[6];
    if (weekOffset === 0) return "Esta semana";
    if (weekOffset === 1) return "Próxima semana";
    if (weekOffset === -1) return "Semana pasada";
    return `${first.label} – ${last.label}`;
  })();

  function openCreate(day: string, time: string, date: string) {
    setCreateDefaults({ day, time, date });
    setIsCreateOpen(true);
  }

  return (
    <motion.div
      className="h-full flex flex-col gap-6 animate-in fade-in duration-400"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clases</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Horario semanal — 10:00 a 19:00 · 60 min · máx. {CAPACITY} por clase
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setWeekOffset(w => w - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-3 min-w-[130px] text-center">{weekLabel}</span>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setWeekOffset(w => w + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button className="ml-2 rounded-xl" onClick={() => { setCreateDefaults(null); setIsCreateOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Clase
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-card rounded-2xl border border-border/50 shadow-sm overflow-auto">
        {isLoading ? (
          <div className="p-8 space-y-3">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-[500px] w-full rounded-xl" />
          </div>
        ) : (
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="w-20 border-b border-r border-border/40 bg-muted/30 p-3 text-center">
                  <Clock className="h-4 w-4 text-muted-foreground mx-auto" />
                </th>
                {weekDates.map(({ dayName, label }) => (
                  <th key={dayName} className="border-b border-r last:border-r-0 border-border/40 bg-muted/30 p-3 text-center">
                    <div className="text-sm font-semibold text-foreground">{dayName}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot, si) => (
                <tr key={slot.value} className={si % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                  <td className="border-b border-r border-border/40 p-2 text-center align-top">
                    <div className="text-xs font-semibold text-foreground">{slot.label}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">{slot.end}</div>
                  </td>
                  {weekDates.map(({ dayName, date }) => {
                    const cls = getClass(dayName, slot.value);
                    return (
                      <td key={dayName} className="border-b border-r last:border-r-0 border-border/40 p-1.5 align-top min-w-[100px]">
                        {cls ? (
                          <ClassCell cls={cls} onDelete={() => {}} />
                        ) : (
                          <button
                            onClick={() => openCreate(dayName, slot.value, date)}
                            className="w-full h-full min-h-[64px] rounded-lg border border-dashed border-border/40 flex items-center justify-center text-muted-foreground/40 hover:text-primary/60 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                          >
                            <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateClassDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        defaults={createDefaults}
      />
    </motion.div>
  );
}

function ClassCell({ cls }: { cls: PilatesClass; onDelete: () => void }) {
  const isFull = cls.enrolled >= cls.capacity;
  const isCancelled = cls.status === "Cancelada";
  const colors = TYPE_COLORS[cls.type] ?? { bg: "bg-primary/5", border: "border-primary/20", text: "text-primary", dot: "bg-primary" };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`w-full text-left p-2.5 rounded-lg border transition-all hover:shadow-md min-h-[64px] flex flex-col justify-between
            ${isCancelled
              ? "bg-destructive/5 border-destructive/20 opacity-70"
              : isFull
              ? "bg-orange-500/5 border-orange-500/25 hover:bg-orange-500/10"
              : `${colors.bg} ${colors.border} hover:shadow-sm`
            }
          `}
        >
          <div>
            <div className="text-[11px] font-bold truncate leading-tight text-foreground">{cls.name}</div>
            <div className="text-[10px] text-muted-foreground truncate mt-0.5">{cls.instructor}</div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-muted-foreground" />
              <span className={`text-[10px] font-bold ${isFull ? "text-orange-600" : "text-muted-foreground"}`}>
                {cls.enrolled}/{cls.capacity}
              </span>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-wider ${colors.text}`}>{cls.type}</span>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="right" className="w-[340px] p-0 rounded-2xl overflow-hidden shadow-xl">
        <ClassDetailsPopover cls={cls} />
      </PopoverContent>
    </Popover>
  );
}

function ClassDetailsPopover({ cls }: { cls: PilatesClass }) {
  const { data: reservations, isLoading } = useListReservations();
  const { data: clients } = useListClients();
  const [selectedClientId, setSelectedClientId] = useState("");

  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();
  const markAttendance = useMarkAttendance();
  const sendNotification = useSendTestNotification();
  const deleteClass = useDeleteClass();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const classReservations = reservations?.filter(r => r.classId === cls.id && r.status === "Confirmada") ?? [];
  const availableClients = clients?.filter(c => !classReservations.some(r => r.clientId === c.id)) ?? [];

  const handleAddClient = () => {
    if (!selectedClientId) return;
    createReservation.mutate({
      data: { classId: cls.id, clientId: parseInt(selectedClientId), date: cls.date },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        toast({ title: "Cliente añadido a la clase" });
        setSelectedClientId("");
      },
      onError: () => toast({ title: "Error al inscribir cliente", variant: "destructive" }),
    });
  };

  const handleCancel = (reservationId: number) => {
    if (confirm("¿Cancelar reserva?")) {
      cancelReservation.mutate({ id: reservationId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          toast({ title: "Reserva cancelada" });
        },
      });
    }
  };

  const handleToggleAttendance = (reservationId: number, attended: boolean) => {
    markAttendance.mutate({ id: reservationId, data: { attended: !attended } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
        toast({ title: !attended ? "Asistencia marcada" : "Asistencia desmarcada" });
      },
    });
  };

  const handleSendReminder = (reservationId: number) => {
    sendNotification.mutate({ id: reservationId }, {
      onSuccess: (data) => {
        toast({
          title: data.success ? "Recordatorio enviado" : "Servicio no configurado",
          description: data.message,
          variant: data.success ? "default" : "destructive",
        });
      },
    });
  };

  const handleDeleteClass = () => {
    if (confirm("¿Eliminar esta clase?")) {
      deleteClass.mutate({ id: cls.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          toast({ title: "Clase eliminada" });
        },
        onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
      });
    }
  };

  const isFull = cls.enrolled >= cls.capacity;

  return (
    <div className="flex flex-col max-h-[520px]">
      <div className="p-4 bg-primary/10 border-b border-primary/10">
        <div className="flex justify-between items-start mb-2">
          <Badge className="bg-primary hover:bg-primary text-primary-foreground text-xs">{cls.status}</Badge>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2 py-1 bg-white/60 rounded-lg">
              {TIME_SLOTS.find(t => t.value === cls.time)?.label ?? cls.time}
              {" → "}
              {TIME_SLOTS.find(t => t.value === cls.time)?.end}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleDeleteClass}
              disabled={deleteClass.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <h3 className="font-semibold text-lg leading-tight">{cls.name}</h3>
        <p className="text-sm text-primary/80 mt-1">{cls.instructor} · {cls.level} · {cls.type}</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.min((cls.enrolled / cls.capacity) * 100, 100)}%` }}
            />
          </div>
          <span className={`text-xs font-bold ${isFull ? "text-orange-600" : "text-primary"}`}>
            {cls.enrolled}/{cls.capacity} cupos
          </span>
        </div>
      </div>

      <div className="p-4 overflow-auto flex-1 bg-card space-y-2">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : classReservations.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-xl">
            Sin clientes inscritos
          </div>
        ) : (
          <AnimatePresence>
            {classReservations.map(res => (
              <motion.div
                key={res.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 text-sm gap-2"
              >
                <div className="flex-1 min-w-0">
                  <span className="font-medium truncate block">{res.clientName}</span>
                  <AnimatePresence mode="wait">
                    {res.attended ? (
                      <motion.span
                        key="attended"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Asistió
                      </motion.span>
                    ) : (
                      <motion.span
                        key="pending"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 inline-block" />
                        Pendiente
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-7 w-7 ${res.attended ? "text-emerald-600 hover:text-muted-foreground" : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"}`}
                    onClick={() => handleToggleAttendance(res.id, res.attended)}
                    disabled={markAttendance.isPending}
                    title={res.attended ? "Quitar asistencia" : "Marcar asistencia"}
                  >
                    {res.attended ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => handleSendReminder(res.id)}
                    disabled={sendNotification.isPending}
                    title="Enviar recordatorio"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleCancel(res.id)}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {!isFull && cls.status !== "Cancelada" && (
        <div className="p-4 border-t border-border/50 bg-muted/20">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Agregar cliente</Label>
          <div className="flex gap-2">
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Seleccionar cliente…" />
              </SelectTrigger>
              <SelectContent>
                {availableClients.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAddClient}
              disabled={!selectedClientId || createReservation.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateClassDialog({
  open,
  onOpenChange,
  defaults,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults: { day: string; time: string; date: string } | null;
}) {
  const { data: instructors } = useListInstructors();
  const createMutation = useCreateClass();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    instructorId: "",
    time: defaults?.time ?? "10:00",
    dayOfWeek: defaults?.day ?? "Lunes",
    date: defaults?.date ?? new Date().toISOString().split("T")[0],
    level: CreateClassBodyLevel.Principiante,
    type: CreateClassBodyType.Reformer,
  });

  const resetAndClose = () => {
    setFormData({
      name: "",
      instructorId: "",
      time: "10:00",
      dayOfWeek: "Lunes",
      date: new Date().toISOString().split("T")[0],
      level: CreateClassBodyLevel.Principiante,
      type: CreateClassBodyType.Reformer,
    });
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      {
        data: {
          ...formData,
          instructorId: formData.instructorId ? parseInt(formData.instructorId) : 0,
          duration: 60,
          capacity: CAPACITY,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          toast({ title: "Clase creada" });
          resetAndClose();
        },
        onError: () => {
          toast({ title: "Error al crear la clase", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Nueva Clase</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Nombre de la clase</Label>
            <Input
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
              <Label>Día</Label>
              <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData({ ...formData, dayOfWeek: v })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Hora de inicio</Label>
              <Select value={formData.time} onValueChange={(v) => setFormData({ ...formData, time: v })}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select value={formData.level} onValueChange={(v) => setFormData({ ...formData, level: v as CreateClassBodyLevel })}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(CreateClassBodyLevel).map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as CreateClassBodyType })}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(CreateClassBodyType).map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Duración: <strong className="text-foreground">60 min</strong></span>
            <span className="mx-1">·</span>
            <Users className="h-4 w-4 shrink-0" />
            <span>Cupo máximo: <strong className="text-foreground">{CAPACITY} personas</strong></span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-xl">
              {createMutation.isPending ? "Guardando…" : "Crear Clase"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
