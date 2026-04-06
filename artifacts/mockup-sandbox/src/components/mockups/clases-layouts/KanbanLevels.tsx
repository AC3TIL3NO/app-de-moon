import React, { useState } from "react";
import { Search, Plus, Edit2, Trash2, Clock, User, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const SAMPLE_CLASSES = [
  { id: 1, time: "08:00", duration: 55, name: "Reformer Básico", instructor: "Ana García", type: "Reformer", level: "Principiante", enrolled: 6, capacity: 8, status: "Activa" },
  { id: 2, time: "10:00", duration: 60, name: "Mat Flow", instructor: "Carlos López", type: "Mat", level: "Intermedio", enrolled: 10, capacity: 12, status: "Activa" },
  { id: 3, time: "12:00", duration: 55, name: "Reformer Avanzado", instructor: "Ana García", type: "Reformer", level: "Avanzado", enrolled: 4, capacity: 6, status: "Activa" },
  { id: 4, time: "11:00", duration: 60, name: "Mat Principiantes", instructor: "Sofía Martínez", type: "Mat", level: "Principiante", enrolled: 7, capacity: 10, status: "Activa" },
  { id: 5, time: "09:00", duration: 60, name: "Clase Privada", instructor: "Carlos López", type: "Privada", level: "Intermedio", enrolled: 1, capacity: 1, status: "Activa" },
  { id: 6, time: "00:00", duration: 60, name: "Shantel amaya", instructor: "Shantel amaya", type: "Privada", level: "Intermedio", enrolled: 0, capacity: 6, status: "Activa" },
];

const LEVEL_COLORS = {
  Principiante: {
    bg: "bg-green-50",
    border: "border-green-500",
    text: "text-green-700",
    progress: "bg-green-500",
  },
  Intermedio: {
    bg: "bg-amber-50",
    border: "border-amber-500",
    text: "text-amber-700",
    progress: "bg-amber-500",
  },
  Avanzado: {
    bg: "bg-purple-50",
    border: "border-purple-500",
    text: "text-purple-700",
    progress: "bg-purple-500",
  },
};

type Level = keyof typeof LEVEL_COLORS;

export function KanbanLevels() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredClasses = SAMPLE_CLASSES.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const classesByLevel = {
    Principiante: filteredClasses.filter((c) => c.level === "Principiante"),
    Intermedio: filteredClasses.filter((c) => c.level === "Intermedio"),
    Avanzado: filteredClasses.filter((c) => c.level === "Avanzado"),
  };

  return (
    <div className="min-h-screen bg-neutral-100 font-sans p-6 md:p-8 flex flex-col font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Clases</h1>
          <p className="text-sm text-neutral-500 mt-1">Organización por nivel de habilidad</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Input
              placeholder="Buscar clase o instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>
          <Button className="whitespace-nowrap bg-neutral-900 text-white hover:bg-neutral-800">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Clase
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-6 overflow-x-auto pb-4">
        {(Object.entries(classesByLevel) as [Level, typeof SAMPLE_CLASSES][]).map(([level, classes]) => {
          const colors = LEVEL_COLORS[level];
          
          return (
            <div key={level} className="flex-1 min-w-[320px] max-w-[400px] flex flex-col">
              {/* Column Header */}
              <div className="bg-white rounded-t-xl border-b-4 shadow-sm mb-4 sticky top-0 z-10" style={{ borderBottomColor: `var(--tw-colors-${colors.border.split('-')[1]}-500)` }}>
                <div className={`h-2 w-full rounded-t-xl ${colors.bg}`}></div>
                <div className="p-4 flex justify-between items-center">
                  <h2 className="font-semibold text-neutral-800">{level}</h2>
                  <Badge variant="secondary" className={`${colors.bg} ${colors.text} hover:${colors.bg} border-none`}>
                    {classes.length} clases
                  </Badge>
                </div>
              </div>

              {/* Column Content */}
              <div className="flex-1 flex flex-col gap-3">
                {classes.length === 0 ? (
                  <div className="bg-neutral-50 border border-neutral-200 border-dashed rounded-xl p-8 text-center text-sm text-neutral-500 flex flex-col items-center justify-center h-32">
                    No hay clases
                  </div>
                ) : (
                  classes.map((cls) => (
                    <div
                      key={cls.id}
                      className={`bg-white rounded-xl shadow-sm border border-neutral-200 p-4 border-l-4 hover:shadow-md transition-shadow group relative overflow-hidden`}
                      style={{ borderLeftColor: `var(--tw-colors-${colors.border.split('-')[1]}-500, currentColor)` }}
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${colors.bg}`}></div>
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-neutral-900 line-clamp-1">{cls.name}</h3>
                          <div className="flex items-center text-sm text-neutral-500 mt-1 gap-3">
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {cls.instructor}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-neutral-700">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 my-4">
                        <div className="bg-neutral-50 rounded-lg p-2 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-neutral-400" />
                          <div>
                            <div className="text-xs text-neutral-500 font-medium">{cls.time}</div>
                            <div className="text-[10px] text-neutral-400">{cls.duration} min</div>
                          </div>
                        </div>
                        <div className="bg-neutral-50 rounded-lg p-2 flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full bg-neutral-200 flex items-center justify-center text-[8px]">
                            {cls.type.substring(0, 1)}
                          </div>
                          <div className="text-xs text-neutral-600 font-medium truncate">{cls.type}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-neutral-100">
                        <div className="flex justify-between items-end mb-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                            <Users className="h-3.5 w-3.5 text-neutral-400" />
                            {cls.enrolled} / {cls.capacity} inscritos
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="relative flex h-2 w-2">
                              {cls.status === "Activa" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                              <span className={`relative inline-flex rounded-full h-2 w-2 ${cls.status === "Activa" ? "bg-emerald-500" : "bg-neutral-400"}`}></span>
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-500">
                              {cls.status}
                            </span>
                          </div>
                        </div>
                        <Progress value={(cls.enrolled / cls.capacity) * 100} className={`h-1.5 [&>div]:${colors.progress}`} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
