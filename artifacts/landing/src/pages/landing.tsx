import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck2,
  Users,
  CreditCard,
  BarChart3,
  Bell,
  Shield,
  CheckCircle,
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  Star,
  Zap,
  Building2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const FEATURES = [
  {
    icon: CalendarCheck2,
    title: "Gestión de Clases",
    desc: "Crea, edita y gestiona clases de pilates con facilidad. Control total de horarios, instructores y capacidad.",
  },
  {
    icon: Users,
    title: "Base de Clientes",
    desc: "Ficha completa por cliente con historial de asistencia, membresías activas y notas personalizadas.",
  },
  {
    icon: CreditCard,
    title: "Pagos con Stripe",
    desc: "Cobra membresías online de forma segura. Los clientes pagan en segundos con tarjeta o bizum.",
  },
  {
    icon: Bell,
    title: "Recordatorios WhatsApp",
    desc: "Reduce ausencias enviando recordatorios automáticos por WhatsApp 24h antes de cada clase.",
  },
  {
    icon: BarChart3,
    title: "Reportes y Analítica",
    desc: "Visualiza ingresos, nuevos clientes, ocupación y tendencias. Toma decisiones con datos reales.",
  },
  {
    icon: Shield,
    title: "Roles y Permisos",
    desc: "Accesos diferenciados para administradores, recepcionistas e instructores. Seguro por diseño.",
  },
];

const PLANS = [
  {
    name: "Básico",
    price: "49",
    period: "mes",
    desc: "Ideal para estudios pequeños que empiezan.",
    features: [
      "Hasta 100 clientes",
      "Gestión de clases",
      "Calendario semanal",
      "1 usuario",
      "Soporte por email",
    ],
    highlight: false,
    cta: "Empezar gratis",
  },
  {
    name: "Profesional",
    price: "99",
    period: "mes",
    desc: "Para estudios en crecimiento con más necesidades.",
    features: [
      "Hasta 500 clientes",
      "Todo en Básico",
      "Pagos con Stripe",
      "Recordatorios WhatsApp",
      "Reportes avanzados",
      "5 usuarios",
      "Soporte prioritario",
    ],
    highlight: true,
    cta: "Empezar prueba gratis",
  },
  {
    name: "Estudio",
    price: "199",
    period: "mes",
    desc: "Para múltiples estudios o cadenas de pilates.",
    features: [
      "Clientes ilimitados",
      "Todo en Profesional",
      "Multi-estudio",
      "API acceso",
      "Usuarios ilimitados",
      "Onboarding dedicado",
      "SLA 99.9%",
    ],
    highlight: false,
    cta: "Hablar con ventas",
  },
];

const TESTIMONIALS = [
  {
    name: "Laura Martínez",
    role: "Directora, Pilates Madrid",
    quote: "Desde que usamos la plataforma, redujimos un 60% las ausencias gracias a los recordatorios automáticos. Increíble.",
    stars: 5,
  },
  {
    name: "Carlos Vega",
    role: "Instructor, Studio Zen",
    quote: "La gestión de clases es súper intuitiva. Mis recepcionistas aprendieron a usarla en menos de una hora.",
    stars: 5,
  },
  {
    name: "Ana Rodríguez",
    role: "CEO, Pilates Chain BCN",
    quote: "Los reportes de ingresos y ocupación nos ayudaron a tomar decisiones que duplicaron nuestros beneficios.",
    stars: 5,
  },
];

const FAQS = [
  {
    q: "¿Necesito conocimientos técnicos para usarlo?",
    a: "No. La plataforma está diseñada para que cualquier persona pueda usarla desde el primer día, sin experiencia técnica.",
  },
  {
    q: "¿Puedo probar la plataforma gratis?",
    a: "Sí, ofrecemos 14 días de prueba gratuita en el plan Profesional, sin necesidad de tarjeta de crédito.",
  },
  {
    q: "¿Cómo funcionan los recordatorios por WhatsApp?",
    a: "La plataforma envía automáticamente un mensaje personalizado por WhatsApp a cada cliente 24 horas antes de su clase reservada.",
  },
  {
    q: "¿Puedo gestionar varios estudios con una sola cuenta?",
    a: "Sí, en el plan Estudio puedes gestionar múltiples locales con datos independientes desde un solo panel.",
  },
  {
    q: "¿Los datos de mis clientes están seguros?",
    a: "Absolutamente. Todos los datos se almacenan con cifrado, cumplimos el RGPD y los pagos van a través de Stripe, certificado PCI DSS.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-[15px] font-medium text-gray-900">{q}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-6 pb-5 text-[15px] text-gray-600 leading-relaxed">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="text-lg font-semibold text-gray-900">Pilates Studio</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Funcionalidades</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Precios</a>
            <a href="#testimonials" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Testimonios</a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <a
              href="/pilates-studio/login"
              className="text-sm text-gray-700 font-medium hover:text-gray-900 transition-colors px-4 py-2 rounded-xl hover:bg-gray-100"
            >
              Iniciar sesión
            </a>
            <a
              href="#pricing"
              className="text-sm bg-violet-600 text-white font-medium px-4 py-2 rounded-xl hover:bg-violet-700 transition-colors shadow-sm"
            >
              Empezar gratis
            </a>
          </div>
          <button
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
            onClick={() => setMobileMenuOpen(v => !v)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 bg-white"
            >
              <div className="px-6 py-4 space-y-1">
                {["Funcionalidades", "Precios", "Testimonios", "FAQ"].map(item => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    className="block py-3 text-sm text-gray-700 font-medium hover:text-violet-600 transition-colors border-b border-gray-100 last:border-0"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item}
                  </a>
                ))}
                <div className="pt-4 pb-2 flex flex-col gap-2">
                  <a href="/pilates-studio/login" className="text-center py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    Iniciar sesión
                  </a>
                  <a href="#pricing" className="text-center py-3 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors">
                    Empezar gratis
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-violet-50/50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8"
          >
            <Zap className="h-3.5 w-3.5" />
            Nuevo: Recordatorios automáticos por WhatsApp
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] tracking-tight max-w-4xl mx-auto"
          >
            La plataforma todo-en-uno para tu{" "}
            <span className="text-violet-600">estudio de pilates</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mt-7 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
          >
            Gestiona clases, clientes, membresías y pagos en un solo lugar. Reduce ausencias con WhatsApp y crece con datos reales.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#pricing"
              className="flex items-center gap-2 bg-violet-600 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-violet-700 transition-all shadow-lg shadow-violet-200 text-base"
            >
              Empezar gratis 14 días
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/pilates-studio/login"
              className="flex items-center gap-2 text-gray-700 font-semibold px-8 py-4 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-200 text-base"
            >
              Ver demo en vivo
            </a>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500"
          >
            {["Sin tarjeta de crédito", "Cancela cuando quieras", "Soporte incluido"].map(item => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-violet-500" />
                {item}
              </div>
            ))}
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white z-10 h-full pointer-events-none" style={{ top: "60%" }} />
            <div className="mx-auto max-w-5xl bg-white rounded-3xl shadow-2xl shadow-gray-200/80 border border-gray-200/60 overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-lg px-3 py-1 text-xs text-gray-400 mx-4">
                  app.pilatesstudio.com/dashboard
                </div>
              </div>
              <div className="p-8 bg-gradient-to-br from-gray-50 to-white min-h-[340px] flex items-start gap-6">
                <div className="w-48 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-2">
                  {["Dashboard", "Clases", "Clientes", "Calendario", "Reportes"].map((item, i) => (
                    <div
                      key={item}
                      className={`px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
                        i === 0 ? "bg-violet-100 text-violet-700" : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-violet-500" : "bg-gray-300"}`} />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Clases hoy", value: "8", color: "text-violet-600" },
                      { label: "Clientes activos", value: "124", color: "text-emerald-600" },
                      { label: "Ingresos mes", value: "€4.890", color: "text-blue-600" },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 h-36 flex items-center justify-center">
                    <div className="flex items-end gap-2 h-20">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div
                          key={i}
                          className="w-8 rounded-t-lg bg-violet-200"
                          style={{ height: `${h}%`, opacity: i === 5 ? 1 : 0.6 }}
                        >
                          {i === 5 && <div className="w-full h-full rounded-t-lg bg-violet-600" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              <Building2 className="h-3.5 w-3.5" />
              Funcionalidades
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Todo lo que necesita tu estudio
            </h2>
            <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
              Una plataforma completa pensada específicamente para estudios de pilates.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="group p-7 rounded-3xl border border-gray-100 hover:border-violet-100 hover:bg-violet-50/30 transition-all duration-300 bg-white"
              >
                <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-5 group-hover:bg-violet-200 transition-colors">
                  <feat.icon className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-[15px] text-gray-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-28 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              <CreditCard className="h-3.5 w-3.5" />
              Precios transparentes
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Simple. Sin sorpresas.
            </h2>
            <p className="mt-5 text-lg text-gray-500 max-w-xl mx-auto">
              Elige el plan que se adapta a tu estudio. Cambia cuando quieras.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 items-center">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className={`relative rounded-3xl p-8 ${
                  plan.highlight
                    ? "bg-violet-600 text-white shadow-2xl shadow-violet-200 scale-[1.02]"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full">
                    MAS POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <div className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-violet-200" : "text-violet-600"}`}>
                    {plan.name}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-bold tracking-tight ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                      €{plan.price}
                    </span>
                    <span className={`pb-1 text-sm ${plan.highlight ? "text-violet-200" : "text-gray-400"}`}>
                      /{plan.period}
                    </span>
                  </div>
                  <p className={`mt-2 text-sm ${plan.highlight ? "text-violet-200" : "text-gray-500"}`}>
                    {plan.desc}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-3 text-[15px]">
                      <CheckCircle className={`h-4.5 w-4.5 shrink-0 ${plan.highlight ? "text-violet-200" : "text-violet-500"}`} />
                      <span className={plan.highlight ? "text-white" : "text-gray-700"}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#"
                  className={`block text-center py-3.5 rounded-2xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? "bg-white text-violet-700 hover:bg-violet-50"
                      : "bg-violet-600 text-white hover:bg-violet-700"
                  }`}
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Estudios que ya confían en nosotros
            </h2>
            <p className="mt-5 text-lg text-gray-500">
              Más de 200 estudios de pilates en toda España.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="p-7 rounded-3xl bg-gray-50 border border-gray-100"
              >
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[15px] text-gray-700 leading-relaxed mb-6">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-28 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
              Preguntas frecuentes
            </h2>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            {FAQS.map(faq => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-28 px-6 bg-violet-600 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-white blur-2xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Empieza hoy, gratis.
            </h2>
            <p className="mt-5 text-xl text-violet-200 max-w-xl mx-auto">
              14 días de prueba completa. Sin tarjeta. Sin compromisos.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#pricing"
                className="flex items-center justify-center gap-2 bg-white text-violet-700 font-semibold px-8 py-4 rounded-2xl hover:bg-violet-50 transition-colors text-base shadow-lg"
              >
                Empezar prueba gratis
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="/pilates-studio/login"
                className="flex items-center justify-center gap-2 bg-violet-700 text-white font-semibold px-8 py-4 rounded-2xl hover:bg-violet-800 transition-colors text-base border border-violet-500"
              >
                Ver demo
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-sm">
              P
            </div>
            <span className="text-white font-semibold">Pilates Studio</span>
          </div>
          <p className="text-sm">© 2026 Pilates Studio SaaS. Todos los derechos reservados.</p>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
