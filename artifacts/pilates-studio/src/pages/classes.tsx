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
  useListClients,
  getListClassesQueryKey,
  getListReservationsQueryKey,
  CreateClassBodyLevel,
  CreateClassBodyType,
  PilatesClass,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  UserMinus,
  CheckCircle2,
  Circle,
  Plus,
  Users,
  Clock,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth";

const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const WEEKEND_DAYS = ["Sábado"];
const ALL_DAYS = [...WEEKDAYS, ...WEEKEND_DAYS];

const ALL_SLOTS = [
  { value: "10:00", label: "10:00 AM", end: "11:00 AM" },
  { value: "11:00", label: "11:00 AM", end: "12:00 PM" },
  { value: "12:00", label: "12:00 PM", end: "1:00 PM" },
  { value: "13:00", label: "1:00 PM",  end: "2:00 PM" },
  { value: "14:00", label: "2:00 PM",  end: "3:00 PM" },
  { value: "15:00", label: "3:00 PM",  end: "4:00 PM" },
  { value: "16:00", label: "4:00 PM",  end: "5:00 PM" },
  { value: "17:00", label: "5:00 PM",  end: "6:00 PM" },
  { value: "18:00", label: "6:00 PM",  end: "7:00 PM" },
  { value: "19:00", label: "7:00 PM",  end: "8:00 PM" },
];

const CAPACITY = 6;

function getSlotsForDay(_dayName: string) {
  return ALL_SLOTS;
}

function getWeekDates(offset: number): { label: string; date: string; dayName: string }[] {
  const now = new Date();
  const monday = new Date(now);
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1 - day) + offset * 7;
  monday.setDate(now.getDate() + diff);
  return ALL_DAYS.map((dayName, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dayName,
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("es-PA", { day: "numeric", month: "short" }),
    };
  });
}

type SelectedSlot = {
  dayName: string;
  date: string;
  time: string;
  cls: PilatesClass | null;
};

export default function Classes() {
  const { data: classes, isLoading } = useListClasses();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState<SelectedSlot | null>(null);
  const { user } = useAuth();

  const isAdmin = user?.role === "ADMIN";
  const canManage = user?.role === "ADMIN" || user?.role === "RECEPTIONIST";
  const weekDates = getWeekDates(weekOffset);

  const getClass = (dayName: string, time: string) =>
    (classes ?? []).find((c) => c.dayOfWeek === dayName && c.time === time) ?? null;

  const weekLabel = (() => {
    if (weekOffset === 0) return "Esta semana";
    if (weekOffset === 1) return "Próxima semana";
    if (weekOffset === -1) return "Semana pasada";
    const first = weekDates[0];
    const last = weekDates[6];
    return `${first.label} – ${last.label}`;
  })();

  return (
    <motion.div
      className="h-full flex flex-col gap-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Clases</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Horario semanal · Lun–Sáb · 10:00 AM – 8:00 PM · máx. {CAPACITY} por clase · 60 min
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
                <th className="w-20 border-b border-r border-border/40 bg-muted/30 p-3 text-center sticky left-0 z-10">
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
              {ALL_SLOTS.map((slot, si) => (
                <tr key={slot.value} className={si % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                  <td className="border-b border-r border-border/40 p-2 text-center align-middle sticky left-0 bg-muted/20">
                    <div className="text-[11px] font-bold text-foreground">{slot.label}</div>
                    <div className="text-[10px] text-muted-foreground">{slot.end}</div>
                  </td>
                  {weekDates.map(({ dayName, date }) => {
                    const daySlots = getSlotsForDay(dayName);
                    const isValidSlot = daySlots.some(s => s.value === slot.value);

                    if (!isValidSlot) {
                      return (
                        <td key={dayName} className="border-b border-r last:border-r-0 border-border/40 p-1 align-top">
                          <div className="min-h-[72px] rounded-lg bg-muted/20 flex items-center justify-center">
                            <span className="text-[10px] text-muted-foreground/40">—</span>
                          </div>
                        </td>
                      );
                    }

                    const cls = getClass(dayName, slot.value);
                    return (
                      <td key={dayName} className="border-b border-r last:border-r-0 border-border/40 p-1.5 align-top min-w-[100px]">
                        <SlotCell
                          cls={cls}
                          dayName={dayName}
                          date={date}
                          time={slot.value}
                          slotLabel={slot.label}
                          slotEnd={slot.end}
                          isAdmin={isAdmin}
                          canManage={canManage}
                          onSelect={(s) => setSelected(s)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ClassSlotDialog
        slot={selected}
        onClose={() => setSelected(null)}
        isAdmin={isAdmin}
      />
    </motion.div>
  );
}

function SlotCell({
  cls,
  dayName,
  date,
  time,
  slotLabel,
  slotEnd,
  isAdmin,
  canManage,
  onSelect,
}: {
  cls: PilatesClass | null;
  dayName: string;
  date: string;
  time: string;
  slotLabel: string;
  slotEnd: string;
  isAdmin: boolean;
  canManage: boolean;
  onSelect: (s: SelectedSlot) => void;
}) {
  const isFull = cls ? cls.enrolled >= cls.capacity : false;

  if (!cls) {
    return (
      <button
        onClick={() => canManage && onSelect({ dayName, date, time, cls: null })}
        className={`w-full min-h-[72px] rounded-lg border border-dashed border-border/30 bg-muted/10 flex items-center justify-center transition-all
          ${canManage ? "hover:border-primary/30 hover:bg-primary/5 cursor-pointer group" : "cursor-default opacity-40"}`}
      >
        {canManage && (
          <Plus className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => onSelect({ dayName, date, time, cls })}
      className={`w-full text-left p-2.5 rounded-lg border transition-all hover:shadow-md min-h-[72px] flex flex-col justify-between
        ${isFull
          ? "bg-orange-500/5 border-orange-500/25 hover:bg-orange-500/10"
          : "bg-primary/5 border-primary/20 hover:bg-primary/10"
        }
      `}
    >
      <div>
        <div className="text-[11px] font-bold leading-tight text-foreground">Clase</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{slotLabel} → {slotEnd}</div>
      </div>
      <div className="flex items-center gap-1 mt-2">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className={`text-[11px] font-bold ${isFull ? "text-orange-600" : "text-primary"}`}>
          {cls.enrolled}/{cls.capacity}
        </span>
        {isFull && (
          <span className="text-[9px] text-orange-600 font-semibold uppercase tracking-wider ml-1">Llena</span>
        )}
      </div>
    </button>
  );
}

function ClassSlotDialog({
  slot,
  onClose,
  isAdmin,
}: {
  slot: SelectedSlot | null;
  onClose: () => void;
  isAdmin: boolean;
}) {
  const { data: reservations, isLoading: resLoading } = useListReservations();
  const { data: clients } = useListClients();
  const [selectedClientId, setSelectedClientId] = useState("");
  const [creating, setCreating] = useState(false);

  const createClass = useCreateClass();
  const deleteClass = useDeleteClass();
  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();
  const markAttendance = useMarkAttendance();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!slot) return null;

  const { dayName, date, time, cls } = slot;
  const slotInfo = ALL_SLOTS.find(s => s.value === time);

  const classReservations = cls
    ? (reservations?.filter(r => r.classId === cls.id && r.status === "Confirmada") ?? [])
    : [];

  const availableClients = clients?.filter(
    c => !classReservations.some(r => r.clientId === c.id)
  ) ?? [];

  const isFull = cls ? cls.enrolled >= cls.capacity : false;

  async function ensureClass(): Promise<number | null> {
    if (cls) return cls.id;
    return new Promise((resolve) => {
      setCreating(true);
      createClass.mutate({
        data: {
          name: `Clase ${slotInfo?.label ?? time}`,
          instructorId: 0,
          time,
          duration: 60,
          capacity: CAPACITY,
          level: CreateClassBodyLevel.Principiante,
          type: CreateClassBodyType.Reformer,
          dayOfWeek: dayName,
          date,
        },
      }, {
        onSuccess: (newCls) => {
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          setCreating(false);
          resolve(newCls.id);
        },
        onError: () => {
          toast({ title: "Error al preparar la clase", variant: "destructive" });
          setCreating(false);
          resolve(null);
        },
      });
    });
  }

  async function handleAddClient() {
    if (!selectedClientId) return;
    const classId = await ensureClass();
    if (!classId) return;

    createReservation.mutate({
      data: { classId, clientId: parseInt(selectedClientId), date },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        toast({ title: "Cliente añadido" });
        setSelectedClientId("");
      },
      onError: () => toast({ title: "Error al inscribir cliente", variant: "destructive" }),
    });
  }

  function handleCancelReservation(reservationId: number) {
    if (confirm("¿Cancelar reserva?")) {
      cancelReservation.mutate({ id: reservationId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          toast({ title: "Reserva cancelada" });
        },
      });
    }
  }

  function handleToggleAttendance(reservationId: number, attended: boolean) {
    markAttendance.mutate({ id: reservationId, data: { attended: !attended } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
        toast({ title: !attended ? "Asistencia marcada" : "Asistencia desmarcada" });
      },
    });
  }

  function handleDeleteClass() {
    if (!cls) return;
    if (confirm(`¿Eliminar la clase del ${dayName} ${slotInfo?.label}?`)) {
      deleteClass.mutate({ id: cls.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          toast({ title: "Clase eliminada" });
          onClose();
        },
      });
    }
  }

  return (
    <Dialog open={!!slot} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden">
        <div className="bg-primary/10 border-b border-primary/10 p-5">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold">
                  {dayName} · {slotInfo?.label}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {slotInfo?.label} – {slotInfo?.end} · 60 min
                </p>
              </div>
              {isAdmin && cls && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={handleDeleteClass}
                  disabled={deleteClass.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {cls && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Cupos</span>
                  <span className={`text-xs font-bold ${isFull ? "text-orange-600" : "text-primary"}`}>
                    {cls.enrolled}/{cls.capacity}
                  </span>
                </div>
                <div className="h-1.5 bg-primary/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min((cls.enrolled / cls.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {!cls && (
              <Badge variant="outline" className="mt-2 border-muted-foreground/30 text-muted-foreground text-xs">
                Sin alumnos aún
              </Badge>
            )}
          </DialogHeader>
        </div>

        <div className="p-4 space-y-3 flex-1 max-h-[280px] overflow-auto">
          {resLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : classReservations.length === 0 ? (
            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-xl">
              No hay alumnos inscritos
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
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/40 border border-border/50 gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">{res.clientName}</span>
                    {res.attended ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                        Asistió
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 inline-block" />
                        Pendiente
                      </span>
                    )}
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
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleCancelReservation(res.id)}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {(!isFull) && (
          <div className="p-4 border-t border-border/50 bg-muted/20">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Agregar alumno
            </Label>
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
                className="shrink-0"
                onClick={handleAddClient}
                disabled={!selectedClientId || createReservation.isPending || creating}
              >
                {creating || createReservation.isPending ? (
                  <span className="text-xs">…</span>
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
