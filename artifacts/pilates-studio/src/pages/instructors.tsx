import { useState } from "react";
import { 
  useListInstructors, 
  useCreateInstructor,
  getListInstructorsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, Heart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Instructors() {
  const { data: instructors, isLoading } = useListInstructors();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Instructores</h1>
          <p className="text-muted-foreground mt-2">Equipo de profesionales del estudio.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Instructor
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[220px] w-full rounded-2xl" />)}
        </div>
      ) : instructors?.length === 0 ? (
        <Card className="border-dashed shadow-none bg-transparent">
          <CardContent className="py-16 text-center text-muted-foreground flex flex-col items-center">
            <Heart className="h-8 w-8 mb-4 opacity-20" />
            <p>Aún no hay instructores registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instructors?.map((instructor) => (
            <Card key={instructor.id} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow group">
              <div className="h-24 bg-gradient-to-r from-primary/20 to-secondary/20" />
              <div className="px-6 pb-6 relative">
                <div className="absolute -top-10 left-6 h-20 w-20 rounded-2xl bg-card border-4 border-card shadow-sm flex items-center justify-center text-2xl font-semibold text-primary overflow-hidden">
                  <div className="absolute inset-0 bg-primary/10" />
                  {instructor.name.charAt(0)}
                </div>
                
                <div className="mt-12 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{instructor.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {instructor.specialties.map(spec => (
                        <Badge key={spec} variant="secondary" className="bg-muted text-muted-foreground text-[10px] font-medium py-0 h-5">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2.5 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{instructor.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{instructor.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateInstructorDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function CreateInstructorDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateInstructor();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialties: "" // comma separated for input
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialties: formData.specialties.split(',').map(s => s.trim()).filter(Boolean)
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInstructorsQueryKey() });
        toast({ title: "Instructor creado exitosamente" });
        onOpenChange(false);
        setFormData({ name: "", email: "", phone: "", specialties: "" });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo crear", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo Instructor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input 
                id="name" required value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="rounded-lg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input 
                id="email" type="email" required value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input 
                id="phone" required value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="rounded-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specs">Especialidades</Label>
              <Input 
                id="specs" required value={formData.specialties}
                onChange={e => setFormData({...formData, specialties: e.target.value})}
                placeholder="Reformer, Mat, Pre-natal (separadas por coma)"
                className="rounded-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-xl">
              {createMutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
