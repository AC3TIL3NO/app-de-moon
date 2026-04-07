import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListClasses, useListReservations, useMarkAttendance } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Circle, ChevronLeft, Users, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DAY_ES: Record<string, string> = {
  Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles",
  Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado", Sunday: "Domingo",
};

const LEVEL_COLORS: Record<string, string> = {
  Principiante: "bg-green-500/10 text-green-700",
  Intermedio: "bg-blue-500/10 text-blue-700",
  Avanzado: "bg-orange-500/10 text-orange-700",
};

export default function Attendance() {
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const { data: classes, isLoading: classesLoading } = useListClasses();

  const selectedClass = classes?.find((c) => c.id === selectedClassId);

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start gap-4 flex-wrap">
        {selectedClass && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 mt-0.5 text-muted-foreground"
            onClick={() => setSelectedClassId(null)}
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Asistencias</h1>
          <p className="text-muted-foreground mt-2">
            {selectedClass
              ? `Registro de asistencia — ${selectedClass.name}`
              : "Selecciona una clase para registrar asistencia."}
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedClassId ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ClassList
              classes={classes}
              isLoading={classesLoading}
              onSelect={setSelectedClassId}
            />
          </motion.div>
        ) : (
          <motion.div key={`class-${selectedClassId}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AttendanceSheet classId={selectedClassId} className={selectedClass?.name ?? ""} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ClassList({
  classes,
  isLoading,
  onSelect,
}: {
  classes: ReturnType<typeof useListClasses>["data"];
  isLoading: boolean;
  onSelect: (id: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    );
  }
  if (!classes?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground border border-dashed rounded-2xl bg-muted/20 text-sm">
        No hay clases registradas.
      </div>
    );
  }

  const active = classes.filter((c) => c.status !== "Cancelada");

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {active.map((cls) => (
        <button
          key={cls.id}
          onClick={() => onSelect(cls.id)}
          className="group text-left p-5 rounded-xl border border-border/60 bg-card hover:border-primary/40 hover:bg-accent/30 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <Badge
              variant="secondary"
              className={LEVEL_COLORS[cls.level ?? ""] ?? "bg-muted text-muted-foreground"}
            >
              {cls.level ?? "—"}
            </Badge>
          </div>
          <p className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{cls.name}</p>
          <p className="text-xs text-muted-foreground">
            {cls.dayOfWeek ? (DAY_ES[cls.dayOfWeek] ?? cls.dayOfWeek) : (cls.date ?? "—")} · {cls.time}
          </p>
          <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{cls.enrolled ?? 0} / {cls.capacity} inscritos</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function AttendanceSheet({ classId, className: _cn }: { classId: number; className: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { data: reservations, isLoading } = useListReservations();
  const markMutation = useMarkAttendance();

  const classReservations = reservations?.filter(
    (r) => r.classId === classId && r.status !== "Cancelada"
  ) ?? [];

  const attended = classReservations.filter((r) => r.attended).length;
  const total = classReservations.length;

  function toggle(reservationId: number, current: boolean) {
    markMutation.mutate(
      { id: reservationId, data: { attended: !current } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["/reservations"] });
        },
        onError: () => toast({ title: "Error al actualizar asistencia.", variant: "destructive" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <Card className="shadow-sm border-border/50">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Lista de Asistencia</CardTitle>
            <CardDescription className="mt-1">
              Marca quién asistió a esta clase.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-2xl font-black tracking-tight text-foreground">{attended}/{total}</p>
              <p className="text-xs text-muted-foreground">presentes</p>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-primary/20 flex items-center justify-center bg-primary/5">
              <span className="text-sm font-bold text-primary">
                {total > 0 ? Math.round((attended / total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {classReservations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-dashed rounded-xl bg-muted/20">
            No hay reservas confirmadas para esta clase.
          </div>
        ) : (
          <div className="space-y-2">
            {classReservations.map((r) => {
              const isAttended = !!r.attended;
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isAttended
                      ? "border-primary/30 bg-primary/5"
                      : "border-border/50 bg-card hover:bg-accent/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isAttended ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    }`}>
                      {(r.clientName ?? "?").split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.clientName ?? "Cliente"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.date ? new Date(r.date).toLocaleDateString("es-PA", { day: "2-digit", month: "short" }) : "—"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(r.id, isAttended)}
                    disabled={markMutation.isPending}
                    className="shrink-0 flex items-center gap-2 transition-opacity hover:opacity-80"
                  >
                    {isAttended ? (
                      <>
                        <span className="text-xs font-medium text-primary hidden sm:inline">Presente</span>
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-muted-foreground hidden sm:inline">Marcar</span>
                        <Circle className="h-6 w-6 text-muted-foreground/50" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
