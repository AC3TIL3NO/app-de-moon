import { useState } from "react";
import { 
  useListClasses, 
  useListReservations, 
  useCreateReservation, 
  useCancelReservation,
  useListClients,
  getListReservationsQueryKey,
  getListClassesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, UserMinus, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PilatesClass } from "@workspace/api-client-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function CalendarPage() {
  const { data: classes, isLoading } = useListClasses();
  
  // Group classes by day for the calendar view
  const getClassesForDay = (dayName: string) => {
    if (!classes) return [];
    return classes.filter(c => c.dayOfWeek === dayName).sort((a, b) => a.time.localeCompare(b.time));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Calendario Semanal</h1>
          <p className="text-muted-foreground mt-2">Vista general de todas las clases programadas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-4 font-medium text-sm">Esta Semana</div>
          <Button variant="outline" size="icon" className="rounded-xl">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 shadow-sm border-border/50 overflow-hidden flex flex-col">
        <CardContent className="p-0 flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
            </div>
          ) : (
            <div className="grid grid-cols-7 min-w-[800px] h-full divide-x divide-border/50">
              {DAYS.map(day => (
                <div key={day} className="flex flex-col h-full bg-card">
                  <div className="p-3 text-center border-b border-border/50 bg-muted/20 sticky top-0 z-10">
                    <div className="font-medium text-sm text-foreground">{day}</div>
                  </div>
                  <div className="p-2 space-y-3 flex-1">
                    {getClassesForDay(day).map(cls => (
                      <ClassBlock key={cls.id} cls={cls} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ClassBlock({ cls }: { cls: PilatesClass }) {
  const isFull = cls.enrolled >= cls.capacity;
  const isCancelled = cls.status === 'Cancelada';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={`w-full text-left p-3 rounded-xl border transition-all hover:shadow-md
            ${isCancelled ? 'bg-destructive/5 border-destructive/10 opacity-70' : 
              isFull ? 'bg-orange-500/5 border-orange-500/20' : 
              'bg-primary/5 border-primary/20 hover:bg-primary/10'
            }
          `}
        >
          <div className="text-xs font-semibold mb-1">{cls.time}</div>
          <div className="font-medium text-sm truncate leading-tight">{cls.name}</div>
          <div className="text-xs text-muted-foreground mt-1 truncate">{cls.instructor}</div>
          
          <div className="flex items-center justify-between mt-3">
            <Badge variant="outline" className={`text-[10px] px-1.5 h-5 font-medium
              ${isCancelled ? 'border-destructive/30 text-destructive' : 
                isFull ? 'border-orange-500/30 text-orange-600' : 
                'border-primary/20 text-primary'
              }
            `}>
              {cls.enrolled}/{cls.capacity}
            </Badge>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{cls.type}</div>
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0 rounded-2xl overflow-hidden shadow-xl" side="right">
        <ClassDetailsPopover cls={cls} />
      </PopoverContent>
    </Popover>
  );
}

function ClassDetailsPopover({ cls }: { cls: PilatesClass }) {
  const { data: reservations, isLoading } = useListReservations();
  const { data: clients } = useListClients();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  
  const createReservation = useCreateReservation();
  const cancelReservation = useCancelReservation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const classReservations = reservations?.filter(r => r.classId === cls.id && r.status === 'Confirmada') || [];
  
  // Clients not currently enrolled
  const availableClients = clients?.filter(c => !classReservations.some(r => r.clientId === c.id)) || [];

  const handleAddClient = () => {
    if (!selectedClientId) return;
    
    createReservation.mutate({
      data: {
        classId: cls.id,
        clientId: parseInt(selectedClientId),
        date: cls.date
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        toast({ title: "Reserva confirmada" });
        setSelectedClientId("");
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo crear la reserva", variant: "destructive" });
      }
    });
  };

  const handleCancel = (reservationId: number) => {
    if (confirm("¿Cancelar reserva?")) {
      cancelReservation.mutate({ id: reservationId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
          toast({ title: "Reserva cancelada" });
        }
      });
    }
  };

  return (
    <div className="flex flex-col max-h-[500px]">
      <div className="p-4 bg-primary/10 border-b border-primary/10">
        <div className="flex justify-between items-start mb-2">
          <Badge className="bg-primary hover:bg-primary text-primary-foreground">{cls.status}</Badge>
          <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded-md">{cls.time} ({cls.duration}m)</span>
        </div>
        <h3 className="font-semibold text-lg">{cls.name}</h3>
        <p className="text-sm text-primary/80 mt-1">{cls.instructor} • {cls.level}</p>
      </div>

      <div className="p-4 overflow-auto flex-1 bg-card">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold">Inscritos ({cls.enrolled}/{cls.capacity})</h4>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : classReservations.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-xl">
            No hay clientes inscritos.
          </div>
        ) : (
          <div className="space-y-2">
            {classReservations.map(res => (
              <div key={res.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/50 text-sm">
                <span className="font-medium">{res.clientName}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleCancel(res.id)}
                >
                  <UserMinus className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50 bg-muted/20">
        <div className="space-y-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">Agregar a clase</Label>
          <div className="flex gap-2">
            <Select value={selectedClientId} onValueChange={setSelectedClientId} disabled={cls.enrolled >= cls.capacity || cls.status === 'Cancelada'}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Buscar cliente..." />
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
              disabled={!selectedClientId || createReservation.isPending || cls.enrolled >= cls.capacity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
