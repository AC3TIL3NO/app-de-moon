import { useState, useEffect, useCallback } from "react";
import { 
  useListClients, 
  useCreateClient, 
  useDeleteClient,
  useGetClientAttendance,
  getListClientsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Mail, Phone, CalendarCheck, FileText, Trash2, CreditCard } from "lucide-react";
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
import { CreateClientBodyPlan, Client } from "@workspace/api-client-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MembershipStatusCard, ClientMembership, computeMembershipStatus } from "@/components/membership-status-card";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "").replace(/\/pilates-studio$/, "") + "/api";

export default function Clients() {
  const { data: clients, isLoading } = useListClients();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  const filteredClients = clients?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-2">Directorio de clientes y sus planes activos.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl shadow-sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <div className="p-4 border-b border-border/50 flex items-center gap-4 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, email o teléfono..." 
              className="pl-9 bg-card border-border/50 h-10 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : filteredClients?.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              No se encontraron clientes.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {filteredClients?.map((client) => (
                <div 
                  key={client.id} 
                  onClick={() => setSelectedClient(client)}
                  className="flex flex-col p-5 rounded-xl border border-border/50 bg-card hover:bg-accent/30 hover:border-accent cursor-pointer transition-all shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-base truncate pr-2">{client.name}</h3>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Badge variant="outline" className="font-normal border-primary/20 text-primary">{client.plan}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{client.classesRemaining}</span>
                      <span className="text-muted-foreground ml-1">clases restantes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateClientDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      
      {selectedClient && (
        <ClientDetailsPanel 
          client={selectedClient} 
          open={!!selectedClient} 
          onOpenChange={(v) => !v && setSelectedClient(null)} 
        />
      )}
    </div>
  );
}

function useMembershipByClient(clientId: number, enabled: boolean) {
  const [membership, setMembership] = useState<ClientMembership | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${API_BASE}/clients/${clientId}/membership`);
      if (res.status === 404) { setMembership(null); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMembership(data as ClientMembership);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [clientId, enabled]);

  useEffect(() => { fetch_(); }, [fetch_]);
  return { membership, loading, error, refetch: fetch_ };
}

function ClientDetailsPanel({ client, open, onOpenChange }: { client: Client, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { data: attendance, isLoading } = useGetClientAttendance(client.id, { query: { enabled: open } });
  const { membership, loading: membershipLoading } = useMembershipByClient(client.id, open);
  const deleteMutation = useDeleteClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const membershipComputedStatus = membership
    ? computeMembershipStatus(membership)
    : null;

  const handleDelete = () => {
    if (confirm("¿Estás seguro de eliminar este cliente? Esta acción no se puede deshacer.")) {
      deleteMutation.mutate({ id: client.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
          toast({ title: "Cliente eliminado" });
          onOpenChange(false);
        },
        onError: () => {
          toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
        }
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <div className="p-6 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-2xl shrink-0">
              {client.name.charAt(0)}
            </div>
            <div>
              <SheetTitle className="text-2xl">{client.name}</SheetTitle>
              <div className="text-sm text-muted-foreground mt-1">
                Miembro desde {new Date(client.createdAt).toLocaleDateString("es-PA")}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 flex-wrap">
            <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1 text-sm font-medium">
              Plan {client.plan}
            </Badge>
            {membershipComputedStatus && (
              <Badge
                className={`px-3 py-1 text-sm font-medium border ${
                  membershipComputedStatus === "active"
                    ? "bg-green-100 text-green-700 border-green-200"
                    : membershipComputedStatus === "expired"
                    ? "bg-red-100 text-red-700 border-red-200"
                    : "bg-gray-100 text-gray-600 border-gray-200"
                }`}
              >
                {membershipComputedStatus === "active" ? "Activa" : membershipComputedStatus === "expired" ? "Vencida" : "Completada"}
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="membership" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-6 py-0 h-12">
            <TabsTrigger value="membership" className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
              <CreditCard className="h-3.5 w-3.5 mr-1.5" />
              Membresía
            </TabsTrigger>
            <TabsTrigger value="info" className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Información</TabsTrigger>
            <TabsTrigger value="attendance" className="h-12 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">Asistencia</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-auto p-6">
            <TabsContent value="membership" className="m-0 space-y-4">
              {membershipLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-32 w-full rounded-xl" />
                </div>
              ) : membership ? (
                <>
                  <MembershipStatusCard
                    membership={membership}
                    onBuyNewPlan={() => toast({ title: "Ir a Cobros para registrar un nuevo plan." })}
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    Membresía más reciente. Para ver el historial completo, revisa la sección de Cobros.
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <CreditCard className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">Sin membresía activa</p>
                  <p className="text-sm mt-1">Este cliente no tiene membresías registradas.</p>
                  <p className="text-xs mt-3 text-primary">Ve a Cobros para asignar un plan.</p>
                </div>
              )}

              {/* Simple classes remaining fallback */}
              {!membership && client.classesRemaining > 0 && (
                <div className="p-4 rounded-xl border bg-blue-50/50 border-blue-200 text-sm text-blue-700">
                  <span className="font-bold">{client.classesRemaining}</span> clases sueltas disponibles (saldo anterior).
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="m-0 space-y-8">
              <div className="space-y-4">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Contacto</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{client.phone}</span>
                  </div>
                </div>
              </div>

              {client.notes && (
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Notas</h3>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-900">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 mt-0.5 shrink-0" />
                      <p className="leading-relaxed">{client.notes}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-border/50">
                <Button variant="destructive" className="w-full rounded-xl" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Cliente
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="attendance" className="m-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : attendance?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <CalendarCheck className="h-8 w-8 mx-auto mb-3 opacity-20" />
                  <p>No hay historial de asistencia.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attendance?.map(record => (
                    <div key={record.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card">
                      <div>
                        <div className="font-medium text-sm">{record.className}</div>
                        <div className="text-xs text-muted-foreground mt-1">{record.date}</div>
                      </div>
                      <Badge variant={record.attended ? "default" : "destructive"} className="rounded-full px-2.5">
                        {record.attended ? "Asistió" : "No Asistió"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function CreateClientDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    plan: CreateClientBodyPlan.Mensual,
    classesRemaining: "12",
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      data: {
        ...formData,
        classesRemaining: parseInt(formData.classesRemaining)
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        toast({ title: "Cliente creado exitosamente" });
        onOpenChange(false);
        setFormData({
          name: "", email: "", phone: "", plan: CreateClientBodyPlan.Mensual, classesRemaining: "12", notes: ""
        });
      },
      onError: () => {
        toast({ title: "Error", description: "No se pudo crear el cliente", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Nuevo Cliente</DialogTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={formData.plan} onValueChange={v => setFormData({...formData, plan: v as CreateClientBodyPlan})}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(CreateClientBodyPlan).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classes">Clases Restantes</Label>
                <Input 
                  id="classes" type="number" required min="0" value={formData.classesRemaining}
                  onChange={e => setFormData({...formData, classesRemaining: e.target.value})}
                  className="rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Input 
                id="notes" value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
                placeholder="Lesiones, preferencias, etc."
                className="rounded-lg"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-xl">
              {createMutation.isPending ? "Guardando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
