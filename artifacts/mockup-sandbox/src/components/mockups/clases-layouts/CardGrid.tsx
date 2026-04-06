import React, { useState } from "react";
import { Search, Plus, MoreHorizontal, Clock, User, Layers, Edit, Trash2, Calendar } from "lucide-react";

import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Progress } from "../../ui/progress";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

const INITIAL_CLASSES = [
  { id: 1, time: "08:00", duration: 55, name: "Reformer Básico", instructor: "Ana García", type: "Reformer", level: "Principiante", enrolled: 6, capacity: 8, status: "Activa" },
  { id: 2, time: "10:00", duration: 60, name: "Mat Flow", instructor: "Carlos López", type: "Mat", level: "Intermedio", enrolled: 10, capacity: 12, status: "Activa" },
  { id: 3, time: "12:00", duration: 55, name: "Reformer Avanzado", instructor: "Ana García", type: "Reformer", level: "Avanzado", enrolled: 4, capacity: 6, status: "Activa" },
  { id: 4, time: "11:00", duration: 60, name: "Mat Principiantes", instructor: "Sofía Martínez", type: "Mat", level: "Principiante", enrolled: 7, capacity: 10, status: "Activa" },
  { id: 5, time: "09:00", duration: 60, name: "Clase Privada", instructor: "Carlos López", type: "Privada", level: "Intermedio", enrolled: 1, capacity: 1, status: "Activa" },
  { id: 6, time: "00:00", duration: 60, name: "Shantel amaya", instructor: "Shantel amaya", type: "Privada", level: "Intermedio", enrolled: 0, capacity: 6, status: "Activa" },
];

export function CardGrid() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredClasses = INITIAL_CLASSES.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-slate-900 font-sans pb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clases</h1>
            <p className="text-slate-500 mt-1">Gestiona el catálogo de clases y horarios del estudio.</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 shadow-sm self-start md:self-auto transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Clase
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8">
        {/* Search */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Buscar por clase, instructor o tipo..." 
            className="pl-10 bg-white border-slate-200 shadow-sm rounded-full h-12 text-base focus-visible:ring-purple-600"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClasses.map((cls) => {
            const fillPercentage = (cls.enrolled / cls.capacity) * 100;
            const isFull = cls.enrolled >= cls.capacity;
            
            return (
              <Card key={cls.id} className="rounded-xl border-none shadow-sm hover:shadow-md transition-shadow bg-white overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium rounded-full px-3">
                            {cls.type}
                          </Badge>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 rounded-full">
                            {cls.status}
                          </Badge>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{cls.name}</h2>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 -mr-2 -mt-2">
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="w-4 h-4 mr-2 text-slate-500" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-medium text-slate-700">Ocupación</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {cls.enrolled} <span className="text-slate-400 font-normal">/ {cls.capacity}</span>
                          </span>
                        </div>
                        <Progress 
                          value={fillPercentage} 
                          className="h-2 bg-slate-100" 
                          indicatorColor={isFull ? "bg-red-500" : "bg-purple-600"}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center text-sm text-slate-600">
                        <User className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span className="truncate" title={cls.instructor}>{cls.instructor}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Clock className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span>{cls.time} ({cls.duration}m)</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600 col-span-2">
                        <Layers className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                        <span>Nivel {cls.level}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {filteredClasses.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No se encontraron clases</h3>
            <p className="text-slate-500">Prueba ajustando los términos de búsqueda.</p>
          </div>
        )}
      </main>
    </div>
  );
}
