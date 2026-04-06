import { useState } from "react";
import { 
  useListClasses, 
  useCreateClass, 
  useDeleteClass, 
  useListInstructors,
  getListClassesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CreateClassBodyLevel, CreateClassBodyType } from "@workspace/api-client-react";

export default function Classes() {
  const { data: classes, isLoading } = useListClasses();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const filteredClasses = classes?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Clases</h1>
          <p className="text-muted-foreground mt-2">Gestiona las clases y horarios del estudio.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Nueva Clase
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <div className="p-4 border-b border-border/50 flex items-center gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o instructor..." 
              className="pl-9 bg-card border-border/50 h-10 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : filteredClasses?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No se encontraron clases.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {filteredClasses?.map((cls) => (
                <ClassRow key={cls.id} cls={cls} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateClassDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function ClassRow({ cls }: { cls: PilatesClass }) {
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
        }
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 hover:bg-accent/50 transition-colors gap-4">
      <div className="flex items-center gap-4 sm:gap-6 min-w-0">
        <div className="w-16 shrink-0 text-center sm:text-left">
          <div className="text-base font-medium">{cls.time}</div>
          <div className="text-sm text-muted-foreground">{cls.duration} min</div>
        </div>
        
        <div className="hidden sm:block h-12 w-[1px] bg-border/50" />
        
        <div className="min-w-0 flex-1">
          <div className="font-medium text-base truncate">{cls.name}</div>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
            <span>{cls.instructor}</span>
            <span className="hidden sm:inline">•</span>
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">{cls.type}</span>
            <span className="bg-secondary/20 text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-medium">{cls.level}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-6 shrink-0 border-t sm:border-0 border-border/50 pt-4 sm:pt-0">
        <div className="text-right">
          <div className="text-sm font-medium">{cls.enrolled} / {cls.capacity}</div>
          <div className="text-xs text-muted-foreground">Inscritos</div>
        </div>
        
        <Badge variant="secondary" className={`
          w-24 justify-center
          ${cls.status === 'Activa' ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}
          ${cls.status === 'Completa' ? 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' : ''}
          ${cls.status === 'Cancelada' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : ''}
        `}>
          {cls.status}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl">
            <DropdownMenuItem className="cursor-pointer">
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive cursor-pointer">
              <Trash2 className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function CreateClassDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data: instructors } = useListInstructors();
  const createMutation = useCreateClass();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    instructorId: "",
    time: "",
    duration: "60",
    capacity: "10",
    level: CreateClassBodyLevel.Principiante,
    type: CreateClassBodyType.Reformer,
    dayOfWeek: "Lunes",
    date: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.instructorId) {
      toast({ title: "Error", description: "Selecciona un instructor", variant: "destructive" });
      return;
    }

    createMutation.mutate({
      data: {
        ...formData,
        instructorId: parseInt(formData.instructorId),
        duration: parseInt(formData.duration),
        capacity: parseInt(formData.capacity)
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClassesQueryKey() });
        toast({ title: "Clase creada exitosamente" });
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo crear la clase", variant: "destructive" });
      }
    });
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
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ej: Reformer Básico"
                className="rounded-lg"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Instructor</Label>
                <Select value={formData.instructorId} onValueChange={v => setFormData({...formData, instructorId: v})}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors?.map(inst => (
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
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">Hora</Label>
                <Input 
                  id="time" 
                  type="time" 
                  required 
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (min)</Label>
                <Input 
                  id="duration" 
                  type="number" 
                  required 
                  min="15"
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value})}
                  className="rounded-lg"
                />
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
                  onChange={e => setFormData({...formData, capacity: e.target.value})}
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select value={formData.level} onValueChange={v => setFormData({...formData, level: v as CreateClassBodyLevel})}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CreateClassBodyLevel).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v as CreateClassBodyType})}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CreateClassBodyType).map(v => (
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
