import { useState, useEffect, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  CalendarCheck2,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Star,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  MapPin,
  Mail,
  Instagram,
  Facebook,
  Users,
  Clock,
  Shield,
  Zap,
  Heart,
  UserCircle2,
} from "lucide-react";
import heroBg from "@assets/40b756_86a22044bf6b4d728b69b627f57b50ec~mv2_1775503320084.avif";
import studioBg from "@assets/40b756_4f1dc1bd9ca941efa4af8c07e580dd1b~mv2_1775503621543.avif";
import logoBlack from "@assets/Moon_Pilates_Studio_Logo_TEXTO_NEGRO_1775503679484.png";
import studioVideo1 from "@assets/SaveClip.App_AQPAckGAJnE1YTcWTONhSiHHlu6nlJ_D6F5PKxkAx3PK0NqsY_1775523267244.mp4";
import studioVideo2 from "@assets/SaveClip.App_AQPxkzPBIp53uUbHiaI0ROdTmasQyIvq6OrYuRNUFT4AmYBkf_1775523272265.mp4";
import { useUser } from "@clerk/react";
import { BookingModal } from "@/components/BookingModal";
import { PaymentModal } from "@/components/PaymentModal";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const BOOKING_STEPS = [
  {
    icon: CalendarCheck2,
    number: "01",
    title: "Elige tu clase",
    desc: "Selecciona el tipo de clase y horario que mejor se adapte a tu rutina.",
  },
  {
    icon: MessageCircle,
    number: "02",
    title: "Contáctanos",
    desc: "Escríbenos por WhatsApp o correo y te asesoramos sin compromiso.",
  },
  {
    icon: CheckCircle2,
    number: "03",
    title: "Confirma tu cupo",
    desc: "Asegura tu lugar con el pago de tu clase o membresía mensual.",
  },
  {
    icon: Sparkles,
    number: "04",
    title: "Disfruta tu clase",
    desc: "Llega, descansa y déjate llevar. El resto es nuestro trabajo.",
  },
];

const CLASSES = [
  {
    title: "Reformer Básico",
    price: "B/.25",
    desc: "Ideal para comenzar. Aprende la técnica con movimientos controlados y seguros.",
    badge: "Principiante",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Reformer Intermedio",
    price: "B/.30",
    desc: "Más fuerza y control. Secuencias progresivas para cuerpos en desarrollo.",
    badge: "Intermedio",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    title: "Reformer Avanzado",
    price: "B/.35",
    desc: "Intensidad y técnica. Para quienes buscan el máximo desafío.",
    badge: "Avanzado",
    badgeColor: "bg-rose-100 text-rose-700",
  },
  {
    title: "Pilates Integral",
    price: "B/.40",
    desc: "Trabajo completo del cuerpo con accesorios: magic circle, fitballs, bandas.",
    badge: "Completo",
    badgeColor: "bg-violet-100 text-violet-700",
  },
  {
    title: "Clase Privada",
    price: "B/.25",
    desc: "Atención 100% personalizada. Tu ritmo, tus metas, tu instructor dedicado.",
    badge: "Privada",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

interface ApiPlan {
  id: number;
  name: string;
  description?: string;
  price: number;
  totalClasses: number;
  durationDays: number;
  active: boolean;
}

interface PlanCard {
  id: number;
  name: string;
  subtitle: string;
  price: string;
  numericPrice: number;
  ideal: string;
  features: string[];
  highlight: boolean;
  cta: string;
}

function apiPlanToCard(p: ApiPlan): PlanCard {
  const unlimited = p.totalClasses >= 999;
  return {
    id: p.id,
    name: p.name,
    subtitle: unlimited ? "Clases ilimitadas" : `${p.totalClasses} clases al mes`,
    price: `B/.${p.price}`,
    numericPrice: p.price,
    ideal: unlimited ? "Incluye prioridad de reserva" : `Ideal para ${p.totalClasses <= 8 ? "2 clases por semana" : "progreso constante"}`,
    features: (p.description ?? "").split("\n").filter(Boolean),
    highlight: p.name === "Moon Flow",
    cta: "Comprar paquete",
  };
}

const BENEFITS = [
  { icon: Star, title: "Reserva prioritaria", desc: "Asegura tu lugar antes que nadie en los horarios más populares." },
  { icon: Users, title: "Atención personalizada", desc: "Cada clase está diseñada considerando tu nivel y objetivos." },
  { icon: Shield, title: "Privadas y grupales", desc: "Elige el formato que mejor se adapte a tu estilo de entrenamiento." },
  { icon: Clock, title: "Seguimiento de progreso", desc: "Monitoreamos tu evolución para ajustar la intensidad semana a semana." },
  { icon: MessageCircle, title: "WhatsApp directo", desc: "Comunicación directa con tu instructor para dudas y cambios." },
  { icon: Heart, title: "Comunidad Moon", desc: "Forma parte de una comunidad que se apoya y crece junta." },
];

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace("/landing", "") + "/api";

const FAQ_ITEMS = [
  {
    q: "¿Necesito experiencia previa para tomar clases?",
    a: "No. Ofrecemos clases para todos los niveles. Si es tu primera vez, te recomendamos empezar con Reformer Básico o una clase privada para que nuestras instructoras te guíen desde cero de forma segura.",
  },
  {
    q: "¿Cuántas personas hay por clase?",
    a: "Nuestras clases grupales tienen un máximo de 6 personas para garantizar atención personalizada. También ofrecemos sesiones privadas con dedicación exclusiva.",
  },
  {
    q: "¿Cuáles son los horarios disponibles?",
    a: "Lunes a viernes de 10:00 AM a 7:00 PM, y sábados de 10:00 AM a 2:00 PM. Puedes ver el horario completo y reservar tu cupo directamente en nuestra plataforma.",
  },
  {
    q: "¿Cómo puedo pagar mi membresía?",
    a: "Aceptamos tarjeta de crédito/débito (Visa, Mastercard), PayPal, Yappy y efectivo en estudio. Puedes pagar en línea al seleccionar tu plan desde la sección de Membresías.",
  },
  {
    q: "¿Puedo cancelar o reprogramar una clase?",
    a: "Sí. Puedes cancelar o reprogramar tu reserva con al menos 12 horas de anticipación sin penalidad. Para cambios de último momento, contáctanos por WhatsApp.",
  },
  {
    q: "¿Tienen clases de prueba?",
    a: "Ofrecemos primera clase gratis para nuevos clientes. Escríbenos por WhatsApp o Instagram para coordinar tu visita sin compromiso.",
  },
  {
    q: "¿Dónde están ubicados?",
    a: "Estamos en Atrio Mall, Costa del Este, Piso 2, Local C-16, Panamá. Contamos con estacionamiento disponible en el mall.",
  },
  {
    q: "¿Las membresías tienen fecha de vencimiento?",
    a: "Sí. Cada plan tiene una vigencia establecida. Moon Start vence en 30 días, Moon Flow en 30 días y los paquetes trimestrales/anuales tienen su vigencia correspondiente. Al vencer, puedes renovar desde la plataforma o en estudio.",
  },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => (
        <motion.div
          key={i}
          initial={false}
          className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900 text-sm sm:text-base">{item.q}</span>
            <motion.div
              animate={{ rotate: open === i ? 180 : 0 }}
              transition={{ duration: 0.25 }}
              className="shrink-0"
            >
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="px-6 pb-5 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                  {item.a}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

function CardIcons({ dark = false }: { dark?: boolean }) {
  const bg = dark ? "#374151" : "#f3f4f6";
  const op = dark ? "opacity-70" : "opacity-60";
  return (
    <div className={`flex items-center justify-center gap-2 mt-3 ${op}`}>
      <svg viewBox="0 0 50 32" className="h-5 w-auto" fill="none">
        <rect width="50" height="32" rx="4" fill={bg}/>
        <text x="25" y="21" textAnchor="middle" fontSize="9" fontWeight="bold" fill={dark ? "#60a5fa" : "#1d4ed8"}>VISA</text>
      </svg>
      <svg viewBox="0 0 50 32" className="h-5 w-auto" fill="none">
        <rect width="50" height="32" rx="4" fill={bg}/>
        <circle cx="20" cy="16" r="9" fill="#eb001b" opacity="0.9"/>
        <circle cx="30" cy="16" r="9" fill="#f79e1b" opacity="0.9"/>
        <path d="M25 9.4a9 9 0 0 1 0 13.2A9 9 0 0 1 25 9.4z" fill="#ff5f00"/>
      </svg>
      <svg viewBox="0 0 50 32" className="h-5 w-auto" fill="none">
        <rect width="50" height="32" rx="4" fill={dark ? "#166534" : "#dcfce7"}/>
        <text x="25" y="21" textAnchor="middle" fontSize="7" fontWeight="bold" fill={dark ? "#86efac" : "#15803d"}>Yappy</text>
      </svg>
      <svg viewBox="0 0 50 32" className="h-5 w-auto" fill="none">
        <rect width="50" height="32" rx="4" fill={bg}/>
        <text x="25" y="21" textAnchor="middle" fontSize="7" fontWeight="bold" fill={dark ? "#9ca3af" : "#6b7280"}>Efectivo</text>
      </svg>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [preselectedClass, setPreselectedClass] = useState<{ name: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCard | null>(null);
  const [plans, setPlans] = useState<PlanCard[]>([]);
  const { user, isSignedIn } = useUser();
  const [, navigate] = useLocation();
  const handleSignIn = () => navigate("/sign-in");

  useEffect(() => {
    fetch(`${API_BASE}/memberships`)
      .then((r) => r.json())
      .then((data: ApiPlan[]) => {
        if (Array.isArray(data)) setPlans(data.filter((p) => p.active).map(apiPlanToCard));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      showToast("Pago procesado con exito. Tu membresia fue activada.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("payment") === "cancelled") {
      showToast("Pago cancelado. Puedes intentarlo de nuevo cuando quieras.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handleReservar = (className?: string) => {
    if (isSignedIn) {
      setPreselectedClass(className ? { name: className } : null);
      setBookingOpen(true);
    } else {
      handleSignIn();
    }
  };

  const handleComprarPaquete = (plan: PlanCard) => {
    if (!isSignedIn) {
      handleSignIn();
      return;
    }
    setSelectedPlan(plan);
    setPaymentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans antialiased overflow-x-hidden">

      {/* NAVBAR */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <div className="flex items-center">
            <img
              src={logoBlack}
              alt="Moon Pilates Studio"
              className={`h-10 w-auto object-contain transition-all duration-500 ${scrolled ? "brightness-0" : "brightness-0 invert"}`}
              style={{ maxWidth: 180 }}
            />
          </div>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Inicio", id: "hero" },
              { label: "Clases", id: "classes" },
              { label: "Membresías", id: "memberships" },
              { label: "Nosotros", id: "about" },
              { label: "Contacto", id: "contact" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`text-sm font-medium transition-colors hover:text-violet-500 ${
                  scrolled ? "text-gray-700" : "text-white/80 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <>
                <motion.button
                  onClick={() => navigate("/dashboard")}
                  whileHover={{ scale: 1.03 }}
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors ${scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white/80 hover:bg-white/10"}`}
                >
                  <UserCircle2 className="h-4 w-4" />
                  {user?.firstName || user?.fullName?.split(" ")[0] || "Mi cuenta"}
                </motion.button>
                <motion.button
                  onClick={() => handleReservar()}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
                >
                  Reservar clase
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  onClick={handleSignIn}
                  whileHover={{ scale: 1.03 }}
                  className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${scrolled ? "text-gray-700 hover:bg-gray-100" : "text-white/80 hover:bg-white/10"}`}
                >
                  Iniciar sesión
                </motion.button>
                <motion.button
                  onClick={() => handleReservar()}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-violet-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
                >
                  Reservar clase
                </motion.button>
              </>
            )}
          </div>

          <button
            className={`md:hidden p-2 rounded-xl transition-colors ${scrolled ? "text-gray-600 hover:bg-gray-100" : "text-white hover:bg-white/10"}`}
            onClick={() => setMobileOpen(v => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100"
            >
              <div className="px-6 py-4 space-y-1">
                {["Inicio", "Clases", "Membresías", "Nosotros", "Contacto"].map((item, i) => (
                  <button
                    key={item}
                    onClick={() => scrollTo(["hero", "classes", "memberships", "about", "contact"][i])}
                    className="block w-full text-left py-3 text-sm text-gray-700 font-medium border-b border-gray-50 last:border-0 hover:text-violet-600 transition-colors"
                  >
                    {item}
                  </button>
                ))}
                <button
                  onClick={() => { setMobileOpen(false); handleReservar(); }}
                  className="mt-3 w-full bg-violet-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-violet-700 transition-colors"
                >
                  Reservar clase
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="Moon Pilates Studio" className="w-full h-full object-cover object-center scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-12 items-center w-full">
          <div>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/25 text-white text-sm font-medium px-4 py-2 rounded-full mb-8"
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              Pilates Reformer · Privadas · Grupales
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight"
            >
              Moon Pilates
              <br />
              <span className="text-violet-300">Studio</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-6 text-xl text-white/80 font-light max-w-lg leading-relaxed"
            >
              Somos movimiento consciente para cuerpo y mente.
            </motion.p>

            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-4 text-base text-white/65 max-w-md leading-relaxed"
            >
              Clases de Pilates Reformer, privadas y grupales, diseñadas para fortalecer tu cuerpo, mejorar tu postura y conectar contigo.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4}
              className="mt-10 flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                onClick={() => handleReservar()}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-900/30 text-base"
              >
                Quiero empezar hoy
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <motion.button
                onClick={() => scrollTo("memberships")}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-white/25 transition-colors text-base"
              >
                Ver membresías
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              className="mt-12 flex items-center gap-8"
            >
              {[
                { num: "+200", label: "Clientes activos" },
                { num: "5", label: "Años de experiencia" },
                { num: "98%", label: "Satisfacción" },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-white">{stat.num}</div>
                  <div className="text-xs text-white/55 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <div className="hidden lg:flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl w-[340px]">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold">M</div>
                  <div>
                    <div className="text-white font-semibold text-sm">Moon Pilates Studio</div>
                    <div className="text-white/50 text-xs">Gestión inteligente</div>
                  </div>
                </div>
                <div className="space-y-2.5 mb-5">
                  {[
                    { label: "Clases hoy", value: "8", color: "text-violet-300" },
                    { label: "Clientes activos", value: "124", color: "text-emerald-300" },
                    { label: "Ocupación", value: "94%", color: "text-amber-300" },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-2.5">
                      <span className="text-white/65 text-xs">{s.label}</span>
                      <span className={`font-bold text-sm ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  {[0.4, 0.65, 0.5, 0.8, 0.6, 0.9, 0.7].map((h, i) => (
                    <div key={i} className="flex-1 bg-white/15 rounded-t-md" style={{ height: `${h * 48}px` }}>
                      {i === 5 && <div className="w-full h-full bg-violet-400 rounded-t-md" />}
                    </div>
                  ))}
                </div>
                <div className="text-center text-white/40 text-[10px] mt-2">Asistencia semanal</div>
              </div>

              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-gray-700">Cupo confirmado</span>
              </motion.div>

              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-4 -left-4 bg-violet-600 rounded-2xl shadow-xl px-4 py-3"
              >
                <div className="text-white text-xs font-semibold">Próxima clase</div>
                <div className="text-violet-200 text-xs mt-0.5">Reformer · 9:00 AM</div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
          <motion.button
            onClick={() => scrollTo("steps")}
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-white/50 hover:text-white/80 transition-colors"
          >
            <ChevronDown className="h-8 w-8" />
          </motion.button>
        </div>
      </section>

      {/* HOW TO BOOK */}
      <section id="steps" className="py-28 px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              <Zap className="h-3.5 w-3.5" />
              Simple y rápido
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Cómo reservar tu clase
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-lg mx-auto">
              En 4 pasos sencillos estarás en tu primera clase de pilates.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BOOKING_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                whileHover={{ y: -8, boxShadow: "0 20px 40px -12px rgba(124,58,237,0.15)" }}
                className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 transition-shadow cursor-default"
              >
                <div className="text-5xl font-black text-violet-100 mb-4 leading-none">{step.number}</div>
                <div className="h-11 w-11 bg-violet-100 rounded-2xl flex items-center justify-center mb-4">
                  <step.icon className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-28 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-stone-100 text-stone-600 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Sobre nosotros
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight mb-6">
              Movimiento con
              <br />
              <span className="text-violet-600">propósito</span>
            </h2>
            <p className="text-[17px] text-gray-600 leading-relaxed mb-5">
              En Moon Pilates Studio trabajamos principalmente con Pilates Reformer, integrando fuerza, control y fluidez a través de resistencia progresiva y movimiento guiado.
            </p>
            <p className="text-[17px] text-gray-600 leading-relaxed mb-8">
              Complementamos la práctica con Chair, Magic Circle, fitballs, bandas, sliders y otros accesorios para crear una experiencia completa y personalizada.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              {["Privadas", "Semi privadas", "Grupales"].map(badge => (
                <span key={badge} className="bg-violet-50 border border-violet-100 text-violet-700 text-sm font-semibold px-5 py-2 rounded-full">
                  {badge}
                </span>
              ))}
            </div>
            <button
              onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-7 py-3.5 rounded-2xl hover:bg-gray-800 transition-colors text-sm"
            >
              Conoce al equipo
              <ArrowRight className="h-4 w-4" />
            </button>
          </AnimatedSection>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
              <img src={studioBg} alt="Moon Pilates Studio" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-violet-900/30 to-transparent rounded-3xl" />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-5 w-48">
              <div className="text-3xl font-black text-gray-900">+200</div>
              <div className="text-sm text-gray-500 mt-1">Clientes que confían en nosotros</div>
            </div>
            <div className="absolute -top-6 -right-6 bg-violet-600 rounded-2xl shadow-xl p-4 text-white text-center w-36">
              <div className="text-2xl font-black">5</div>
              <div className="text-xs text-violet-200 mt-1">Años transformando vidas</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CLASSES */}
      <section id="classes" className="py-28 px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Tipos de clases
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Encuentra tu clase perfecta
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-lg mx-auto">
              Desde principiantes hasta avanzados. Siempre guiados por expertos.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CLASSES.map((cls, i) => (
              <motion.div
                key={cls.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                whileHover={{ scale: 1.025, y: -4 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group transition-all duration-300"
              >
                <div className="h-44 bg-gradient-to-br from-violet-50 to-stone-100 relative overflow-hidden">
                  <img src={i % 2 === 0 ? heroBg : studioBg} alt={cls.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-85 transition-opacity duration-500 group-hover:scale-105 transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${cls.badgeColor}`}>
                      {cls.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-1.5">
                    <span className="font-black text-violet-700 text-lg">{cls.price}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{cls.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-5">{cls.desc}</p>
                  <button
                    onClick={() => handleReservar(cls.title)}
                    className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-violet-600 transition-colors"
                  >
                    Reservar
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STUDIO VIDEOS */}
      <section className="py-24 px-6 bg-gray-950 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              Moon en acción
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
              Vive la experiencia Moon
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-lg mx-auto">
              Así se siente entrenar con nosotros. Clases diseñadas para cada nivel.
            </p>
          </AnimatedSection>

          <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            {[studioVideo1, studioVideo2].map((src, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="relative w-full sm:w-72 md:w-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/60 border border-white/10"
                style={{ aspectRatio: "9/16" }}
              >
                <video
                  src={src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* MEMBERSHIPS */}
      <section id="memberships" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              Membresías
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Elige tu plan Moon
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-lg mx-auto">
              Compromiso flexible, resultados reales. Cancela cuando quieras.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                whileHover={{ y: plan.highlight ? -4 : -6 }}
                className={`relative rounded-3xl p-8 transition-all duration-300 ${
                  plan.highlight
                    ? "bg-gray-900 text-white shadow-2xl shadow-gray-900/20 ring-2 ring-violet-600 md:-mt-4 md:mb-4"
                    : "bg-stone-50 border border-gray-100"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-lg shadow-violet-200">
                    MAS POPULAR
                  </div>
                )}

                <div className="mb-8">
                  <div className={`text-xs font-bold tracking-widest uppercase mb-2 ${plan.highlight ? "text-violet-400" : "text-violet-600"}`}>
                    {plan.name}
                  </div>
                  <div className="text-sm font-medium text-gray-400 mb-3">{plan.subtitle}</div>
                  <div className="flex items-end gap-1.5">
                    <span className={`text-5xl font-black tracking-tight ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                      {plan.price}
                    </span>
                    <span className={`pb-1.5 text-sm ${plan.highlight ? "text-gray-400" : "text-gray-400"}`}>/mes</span>
                  </div>
                  <p className={`mt-3 text-sm ${plan.highlight ? "text-gray-400" : "text-gray-500"}`}>
                    {plan.ideal}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-center gap-3 text-[15px]">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                        plan.highlight ? "bg-violet-600" : "bg-violet-100"
                      }`}>
                        <CheckCircle2 className={`h-3 w-3 ${plan.highlight ? "text-white" : "text-violet-600"}`} />
                      </div>
                      <span className={plan.highlight ? "text-gray-300" : "text-gray-700"}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleComprarPaquete(plan)}
                  className={`w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    plan.highlight
                      ? "bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-900/20"
                      : "bg-gray-900 text-white hover:bg-violet-600"
                  }`}
                >
                  {plan.cta}
                </motion.button>
                <CardIcons dark={plan.highlight} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-28 px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Por qué elegir Moon
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-lg mx-auto">
              Más que un estudio — una experiencia diseñada para ti.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {BENEFITS.map((b, i) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all"
              >
                <div className="h-10 w-10 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <b.icon className="h-5 w-5 text-violet-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-28 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-600 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Lo que dicen nuestras clientas
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Resultados reales
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-lg mx-auto">
              Historias de transformación de nuestra comunidad Moon.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "María Fernández",
                role: "Miembro desde 2024",
                text: "Llegué con dolor de espalda crónico después de dos embarazos. A los dos meses de clases privadas sentí un cambio enorme en mi postura y en mi core. Moon Pilates cambió mi vida.",
                stars: 5,
                initials: "MF",
                color: "bg-violet-100 text-violet-700",
              },
              {
                name: "Sofía Ramos",
                role: "Moon Flow · 6 meses",
                text: "Las instructoras son increíbles. Te conocen por tu nombre, recuerdan tus limitaciones y siempre están ajustando los ejercicios para que avances sin lesionarte. No existe otro lugar así en Panamá.",
                stars: 5,
                initials: "SR",
                color: "bg-emerald-100 text-emerald-700",
                highlight: true,
              },
              {
                name: "Luciana Torres",
                role: "Clases privadas",
                text: "Vine por la recomendación de una amiga y desde la primera clase supe que era el lugar. El ambiente es relajado, limpio y muy profesional. Ya llevo 8 meses y no pienso parar.",
                stars: 5,
                initials: "LT",
                color: "bg-amber-100 text-amber-700",
              },
              {
                name: "Andrea Castillo",
                role: "Reformer Básico",
                text: "Nunca había hecho pilates. Llegué nerviosa pero las instructoras fueron superpaciantes. En tres semanas ya notaba diferencia. El horario de mañanas es perfecto para mí.",
                stars: 5,
                initials: "AC",
                color: "bg-rose-100 text-rose-700",
              },
              {
                name: "Valentina Cruz",
                role: "Miembro Moon Star",
                text: "Me lesioné la rodilla y mi fisioterapeuta me recomendó pilates. Moon fue la mejor decisión. Recuperé fuerza, mejoré mi movilidad y además perdí 6 kilos en 4 meses.",
                stars: 5,
                initials: "VC",
                color: "bg-blue-100 text-blue-700",
              },
              {
                name: "Camila Moreno",
                role: "Pilates Integral",
                text: "El estudio es hermoso, la ubicación es cómoda y el equipo siempre está disponible para ayudarte. Mi favorito es la clase de los sábados — es el mejor plan para el fin de semana.",
                stars: 5,
                initials: "CM",
                color: "bg-fuchsia-100 text-fuchsia-700",
              },
            ].map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                custom={i * 0.5}
                className={`rounded-2xl p-6 border transition-all ${
                  t.highlight
                    ? "bg-violet-600 border-violet-700 shadow-xl shadow-violet-200"
                    : "bg-white border-gray-100 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, s) => (
                    <Star key={s} className={`h-4 w-4 fill-current ${t.highlight ? "text-violet-200" : "text-amber-400"}`} />
                  ))}
                </div>
                <p className={`text-sm leading-relaxed mb-6 ${t.highlight ? "text-violet-100" : "text-gray-600"}`}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${t.highlight ? "bg-white/20 text-white" : t.color}`}>
                    {t.initials}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${t.highlight ? "text-white" : "text-gray-900"}`}>{t.name}</div>
                    <div className={`text-xs ${t.highlight ? "text-violet-200" : "text-gray-400"}`}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-28 px-6 bg-stone-50">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-stone-200 text-stone-600 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Preguntas frecuentes
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900">
              Resolvemos tus dudas
            </h2>
          </AnimatedSection>
          <FaqSection />
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-stone-100 text-stone-600 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Ubicación y contacto
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-8">
              Encuéntranos
            </h2>

            <div className="space-y-5 mb-8">
              <div className="flex items-start gap-4 p-5 bg-stone-50 rounded-2xl border border-gray-100">
                <div className="h-10 w-10 bg-violet-100 rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-0.5">Dirección</div>
                  <div className="text-sm text-gray-500">Atrio Mall, Costa del Este</div>
                  <div className="text-sm text-gray-500">Piso 2, Local C-16 · Panamá</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-stone-50 rounded-2xl border border-gray-100">
                <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-0.5">WhatsApp</div>
                  <div className="text-sm text-gray-500">+507 6586-9949</div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 bg-stone-50 rounded-2xl border border-gray-100">
                <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-0.5">Correo</div>
                  <div className="text-sm text-gray-500">moonpilatesstudiopty@gmail.com</div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.a
                href="https://maps.google.com/?q=Atrio+Mall+Costa+del+Este+Panama"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-gray-900 text-white font-semibold px-5 py-3 rounded-xl hover:bg-gray-800 transition-colors text-sm"
              >
                <MapPin className="h-4 w-4" />
                Google Maps
              </motion.a>
              <motion.a
                href="https://wa.me/50765869949"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-emerald-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-emerald-700 transition-colors text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </motion.a>
            </div>
          </AnimatedSection>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="bg-stone-50 rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="h-64 bg-gradient-to-br from-violet-100 to-stone-200 relative flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-stone-100" />
                <div className="relative z-10 text-center">
                  <MapPin className="h-12 w-12 text-violet-400 mx-auto mb-3" />
                  <div className="font-semibold text-gray-700">Atrio Mall, Costa del Este</div>
                  <div className="text-sm text-gray-500">Piso 2, Local C-16</div>
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-violet-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                    <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                    Abierto ahora
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Lunes – Viernes</span>
                  <span className="font-semibold text-gray-900">7:00 AM – 8:00 PM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Sábados</span>
                  <span className="font-semibold text-gray-900">8:00 AM – 2:00 PM</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Domingos</span>
                  <span className="font-semibold text-gray-400">Cerrado</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="py-24 px-6 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-violet-500 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-violet-300 blur-2xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <AnimatedSection>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Tu cuerpo te lo va a agradecer
            </h2>
            <p className="mt-5 text-xl text-gray-400 max-w-xl mx-auto">
              Primera clase gratis para nuevos clientes. Sin compromiso.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <motion.a
                href="https://wa.me/50765869949"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 bg-violet-600 text-white font-bold px-9 py-4 rounded-2xl hover:bg-violet-500 transition-colors text-base shadow-lg shadow-violet-900/30"
              >
                Quiero mi clase gratis
                <ArrowRight className="h-4 w-4" />
              </motion.a>
              <motion.button
                onClick={() => document.getElementById("memberships")?.scrollIntoView({ behavior: "smooth" })}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-9 py-4 rounded-2xl hover:bg-white/15 transition-colors text-base border border-white/20"
              >
                Ver planes
              </motion.button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 text-gray-500 py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <img
                  src={logoBlack}
                  alt="Moon Pilates Studio"
                  className="h-9 w-auto object-contain brightness-0 invert"
                  style={{ maxWidth: 180 }}
                />
              </div>
              <div className="text-xs text-gray-500 mb-4">Movimiento consciente para cuerpo y mente</div>
              <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                Especialistas en Pilates Reformer. Clases privadas y grupales en Costa del Este, Panamá.
              </p>
              <div className="flex gap-3 mt-5">
                {[Instagram, Facebook].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="h-9 w-9 rounded-xl bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-violet-600 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-white font-semibold text-sm mb-4">Links</div>
              <ul className="space-y-2.5">
                {["Inicio", "Clases", "Membresías", "Nosotros", "Contacto"].map(l => (
                  <li key={l}>
                    <button
                      onClick={() => document.getElementById(["hero", "classes", "memberships", "about", "contact"][["Inicio", "Clases", "Membresías", "Nosotros", "Contacto"].indexOf(l)])?.scrollIntoView({ behavior: "smooth" })}
                      className="text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      {l}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-white font-semibold text-sm mb-4">Contacto</div>
              <ul className="space-y-2.5 text-sm text-gray-500">
                <li>+507 6586-9949</li>
                <li className="break-all">moonpilatesstudiopty@gmail.com</li>
                <li>Atrio Mall, Costa del Este</li>
                <li>Piso 2, Local C-16 · Panamá</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p>© 2026 Moon Pilates Studio. Todos los derechos reservados.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Booking Modal */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        preselectedClass={preselectedClass}
        onNeedAuth={() => { setBookingOpen(false); handleSignIn(); }}
        onSuccess={() => {
          setBookingOpen(false);
          showToast("Reserva confirmada. Te esperamos en Moon Pilates Studio.");
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        plan={selectedPlan}
        onClose={() => { setPaymentModalOpen(false); setSelectedPlan(null); }}
        onSuccess={(method) => {
          if (method === "PayPal") {
            showToast("Pago confirmado. Tu membresía fue activada.");
          } else if (method === "Yappy") {
            showToast("Solicitud registrada. Confirmaremos tu Yappy pronto.");
          }
        }}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-gray-900 text-white text-sm font-semibold px-5 py-3.5 rounded-2xl shadow-2xl"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
