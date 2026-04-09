import { motion, AnimatePresence } from "framer-motion";
import { X, ScrollText, Clock, Calendar, RotateCcw, AlertTriangle, CreditCard, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const POLICIES = [
  {
    icon: Calendar,
    title: "Reservaciones",
    color: "text-[#C49A1E]",
    bg: "bg-amber-50",
    border: "border-amber-100",
    items: [
      "Las clases deben reservarse con anticipación por los canales oficiales de Moon Pilates Studio.",
      "La reserva queda confirmada una vez asignado el cupo.",
    ],
  },
  {
    icon: X,
    title: "Cancelaciones",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    items: [
      "Las cancelaciones deben realizarse con al menos 4 horas de anticipación.",
      "Fuera de este plazo, la clase se considera tomada, sin reposición ni reembolso.",
    ],
  },
  {
    icon: Clock,
    title: "Tiempo de tolerancia",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    items: [
      "La tolerancia máxima es de 10 minutos, sin excepciones.",
      "Si llegas fuera de tiempo se tomará como clase asistida.",
    ],
  },
  {
    icon: RotateCcw,
    title: "Reagenda",
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    items: [
      "Las clases solo pueden reagendarse si se solicita con al menos 4 horas de anticipación.",
      "Fuera de este plazo, la clase se pierde.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Faltas",
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    items: [
      "La inasistencia sin cancelación previa será considerada falta.",
      "La clase se perderá automáticamente, sin derecho a recuperación.",
    ],
  },
  {
    icon: CreditCard,
    title: "Planes y clases",
    color: "text-gray-700",
    bg: "bg-gray-50",
    border: "border-gray-100",
    items: [
      "Los planes y clases son individuales, intransferibles y no reembolsables.",
      "Tienen vigencia definida y las clases no utilizadas se pierden.",
    ],
  },
];

export function PoliciesModal({ isOpen, onClose }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#C49A1E]/10 flex items-center justify-center">
                  <ScrollText className="h-5 w-5 text-[#C49A1E]" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900">Nuestras Políticas</h2>
                  <p className="text-xs text-gray-400">Moon Pilates Studio · Panamá</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              {POLICIES.map((policy) => (
                <div
                  key={policy.title}
                  className={`rounded-2xl border p-4 ${policy.bg} ${policy.border}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <policy.icon className={`h-4 w-4 ${policy.color}`} />
                    <span className={`text-sm font-bold ${policy.color}`}>{policy.title}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {policy.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 shrink-0" />
                        <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="bg-[#C49A1E]/5 border border-[#C49A1E]/20 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-500">
                  Al reservar o realizar un pago confirmas que has leído y aceptado estas políticas.
                  Moon Pilates Studio se reserva el derecho de modificarlas con previo aviso.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-3 shrink-0 border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full h-12 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Entendido
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
