import React, { useState } from "react";
import { Search, Plus, MoreHorizontal, Edit2, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const sampleData = [
  { id: 1, time: "08:00", duration: 55, name: "Reformer Básico", instructor: "Ana García", type: "Reformer", level: "Principiante", enrolled: 6, capacity: 8, status: "Activa" },
  { id: 2, time: "10:00", duration: 60, name: "Mat Flow", instructor: "Carlos López", type: "Mat", level: "Intermedio", enrolled: 10, capacity: 12, status: "Activa" },
  { id: 4, time: "11:00", duration: 60, name: "Mat Principiantes", instructor: "Sofía Martínez", type: "Mat", level: "Principiante", enrolled: 7, capacity: 10, status: "Activa" },
  { id: 3, time: "12:00", duration: 55, name: "Reformer Avanzado", instructor: "Ana García", type: "Reformer", level: "Avanzado", enrolled: 4, capacity: 6, status: "Activa" },
  { id: 5, time: "09:00", duration: 60, name: "Clase Privada", instructor: "Carlos López", type: "Privada", level: "Intermedio", enrolled: 1, capacity: 1, status: "Activa" },
  { id: 6, time: "00:00", duration: 60, name: "Shantel amaya", instructor: "Shantel amaya", type: "Privada", level: "Intermedio", enrolled: 0, capacity: 6, status: "Activa" },
].sort((a, b) => a.time.localeCompare(b.time));

const typeColors: Record<string, string> = {
  Reformer: "bg-purple-500",
  Mat: "bg-teal-500",
  Privada: "bg-amber-500",
};

const typeBadgeColors: Record<string, string> = {
  Reformer: "bg-purple-100 text-purple-700 hover:bg-purple-100/80",
  Mat: "bg-teal-100 text-teal-700 hover:bg-teal-100/80",
  Privada: "bg-amber-100 text-amber-700 hover:bg-amber-100/80",
};

export function ScheduleStrips() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = sampleData.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.instructor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Horario de Clases</h1>
            <p className="text-sm text-slate-500 mt-1">Gestiona las sesiones programadas para hoy.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar clase o instructor..."
                className="pl-9 bg-slate-50 border-slate-200 focus-visible:ring-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Clase
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-8 px-6">
        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {filteredData.length > 0 ? (
            filteredData.map((cls, index) => {
              const isEven = index % 2 === 0;
              const isFull = cls.enrolled >= cls.capacity;
              
              return (
                <div
                  key={cls.id}
                  className={`group flex flex-col sm:flex-row sm:items-center p-0 ${
                    isEven ? "bg-white" : "bg-slate-50/50"
                  } border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors`}
                >
                  {/* Time Block (Left Anchor) */}
                  <div className="flex items-stretch w-full sm:w-auto">
                    {/* Color Accent Strip */}
                    <div className={`w-1.5 shrink-0 ${typeColors[cls.type] || "bg-slate-300"}`} />
                    
                    {/* Time Label */}
                    <div className="py-5 px-6 sm:w-32 shrink-0 flex flex-col justify-center">
                      <span className="text-3xl font-extrabold tracking-tighter text-slate-900 leading-none">
                        {cls.time}
                      </span>
                      <span className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-wider">
                        {cls.duration} MIN
                      </span>
                    </div>
                  </div>

                  {/* Core Details (Middle) */}
                  <div className="flex-1 py-4 px-6 sm:px-4 flex flex-col justify-center gap-1.5 border-t sm:border-t-0 border-slate-100 ml-1.5 sm:ml-0">
                    <h3 className="text-lg font-semibold text-slate-900 leading-snug">
                      {cls.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 uppercase">
                          {cls.instructor.charAt(0)}
                        </div>
                        {cls.instructor}
                      </span>
                      <span className="text-slate-300 text-xs">•</span>
                      <Badge variant="secondary" className={`${typeBadgeColors[cls.type]} font-medium border-0 shadow-none`}>
                        {cls.type}
                      </Badge>
                      <Badge variant="outline" className="text-slate-500 border-slate-200 font-normal">
                        {cls.level}
                      </Badge>
                    </div>
                  </div>

                  {/* Meta & Actions (Right) */}
                  <div className="flex items-center gap-6 py-4 px-6 sm:pl-4 justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 ml-1.5 sm:ml-0 bg-slate-50/30 sm:bg-transparent">
                    
                    {/* Capacity Indicator */}
                    <div className="flex items-center gap-3 min-w-[120px]">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Users className="h-4 w-4 text-slate-400" />
                        <span className={`${isFull ? 'text-rose-600' : 'text-slate-600'}`}>
                          {cls.enrolled}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-500">{cls.capacity}</span>
                      </div>
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                        <div 
                          className={`h-full rounded-full ${isFull ? 'bg-rose-500' : 'bg-slate-900'}`} 
                          style={{ width: `${Math.min((cls.enrolled / cls.capacity) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="hidden md:block min-w-[90px] text-right">
                      <Badge 
                        variant="outline" 
                        className={`
                          ${cls.status === 'Activa' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : ''}
                          ${cls.status === 'Completa' ? 'border-slate-200 text-slate-700 bg-slate-50' : ''}
                          ${cls.status === 'Cancelada' ? 'border-rose-200 text-rose-700 bg-rose-50' : ''}
                        `}
                      >
                        {isFull && cls.status === 'Activa' ? 'Completa' : cls.status}
                      </Badge>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-200/50">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit2 className="mr-2 h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Cancelar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No se encontraron clases</h3>
              <p className="text-slate-500 mt-1 max-w-sm">
                No hay clases que coincidan con tu búsqueda. Intenta con otros términos.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => setSearchQuery("")}
              >
                Limpiar búsqueda
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
