import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CreditCard, Smartphone, CheckCircle2, Copy, ExternalLink, Loader2, AlertCircle, Shield } from "lucide-react";
import { useAuth } from "@clerk/react";
import { useClientContext } from "@/contexts/clientContext";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace("/landing", "") + "/api";
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? "";
const YAPPY_PHONE = "65869949";
const YAPPY_DISPLAY = "+507 6586-9949";

interface Plan {
  name: string;
  numericPrice: number;
  membershipId?: number;
}

interface Props {
  isOpen: boolean;
  plan: Plan | null;
  onClose: () => void;
  onSuccess: (method: string) => void;
}

type Tab = "paguelo" | "paypal" | "yappy";

declare global {
  interface Window {
    paypal?: any;
  }
}

function usePayPalScript(clientId: string) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!clientId) { setError(true); return; }
    if (window.paypal) { setLoaded(true); return; }

    const existing = document.getElementById("paypal-sdk");
    if (existing) {
      existing.addEventListener("load", () => setLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = "paypal-sdk";
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD&components=buttons&disable-funding=credit`;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, [clientId]);

  return { loaded, error };
}

export function PaymentModal({ isOpen, plan, onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<Tab>("paguelo");
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [yappyDone, setYappyDone] = useState(false);
  const [yappyCopied, setYappyCopied] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pagueloError, setPagueloError] = useState<string | null>(null);

  const paypalContainer = useRef<HTMLDivElement>(null);
  const buttonsInstance = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { getToken } = useAuth();
  const { client, refetch } = useClientContext();
  const { loaded: sdkLoaded, error: sdkError } = usePayPalScript(PAYPAL_CLIENT_ID);

  useEffect(() => {
    if (!isOpen) {
      setTab("paguelo");
      setPaypalReady(false);
      setPaypalError(null);
      setYappyDone(false);
      setProcessing(false);
      setPagueloError(null);
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || tab !== "paypal" || !sdkLoaded || !plan || !paypalContainer.current) return;

    setPaypalReady(false);
    setPaypalError(null);

    if (buttonsInstance.current) {
      try { buttonsInstance.current.close(); } catch (_) {}
      buttonsInstance.current = null;
    }
    if (paypalContainer.current) paypalContainer.current.innerHTML = "";

    const buttons = window.paypal?.Buttons({
      style: {
        layout: "vertical",
        color: "black",
        shape: "rect",
        label: "pay",
        height: 48,
      },
      createOrder: async () => {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/payments/paypal/create-order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            clientId: client?.id,
            membershipId: plan.membershipId ?? null,
            concept: `Membresía ${plan.name} — Moon Pilates Studio`,
            amount: plan.numericPrice,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.orderId) throw new Error(data.error ?? "Error al crear orden");
        return data.orderId;
      },
      onApprove: async (data: { orderID: string }) => {
        setProcessing(true);
        try {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/payments/paypal/capture-order`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              orderId: data.orderID,
              clientId: client?.id,
              membershipId: plan.membershipId ?? null,
            }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error ?? "Error al confirmar pago");
          refetch?.();
          onSuccess("PayPal");
          onClose();
        } catch (err: any) {
          setPaypalError(err.message ?? "Error al procesar el pago");
        } finally {
          setProcessing(false);
        }
      },
      onError: (err: any) => {
        console.error("[PayPal]", err);
        setPaypalError("Hubo un problema con PayPal. Intenta de nuevo o elige otro método.");
      },
    });

    if (buttons?.isEligible()) {
      buttons.render(paypalContainer.current).then(() => setPaypalReady(true));
      buttonsInstance.current = buttons;
    } else {
      setPaypalError("PayPal no está disponible en este momento.");
    }

    return () => {
      try { buttonsInstance.current?.close(); } catch (_) {}
      buttonsInstance.current = null;
    };
  }, [isOpen, tab, sdkLoaded, plan]);

  const handlePagueloFacil = async () => {
    if (!client || !plan) return;
    setProcessing(true);
    setPagueloError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/payments/paguelo-facil/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId: client.id,
          membershipId: plan.membershipId ?? null,
          concept: `Membresia ${plan.name} Moon Pilates Studio`,
          amount: plan.numericPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al iniciar el pago");

      const { checkoutUrl, paymentId } = data as { checkoutUrl: string; paymentId: number };

      window.open(checkoutUrl, "_blank", "noopener,noreferrer");

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`${API_BASE}/payments/paguelo-facil/status/${paymentId}`);
          const statusData = await statusRes.json();
          if (statusData.status === "paid") {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            refetch?.();
            onSuccess("PagaloFácil");
            onClose();
          } else if (statusData.status === "failed") {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setPagueloError("El pago fue rechazado. Intenta de nuevo.");
          }
        } catch { }
      }, 3000);

      setTimeout(() => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }, 10 * 60 * 1000);

    } catch (err: any) {
      setPagueloError(err.message ?? "Error al conectar con PagaloFácil");
    } finally {
      setProcessing(false);
    }
  };

  const handleYappyConfirm = async () => {
    if (!client || !plan) return;
    setProcessing(true);
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/payments/yappy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          clientId: client.id,
          membershipId: plan.membershipId ?? null,
          concept: `Membresía ${plan.name} — Moon Pilates Studio`,
          amount: plan.numericPrice,
        }),
      });
      setYappyDone(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(YAPPY_PHONE).then(() => {
      setYappyCopied(true);
      setTimeout(() => setYappyCopied(false), 2000);
    });
  };

  if (!plan) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "paguelo", label: "Tarjeta", icon: <Shield className="h-4 w-4" /> },
    { id: "paypal", label: "PayPal", icon: <CreditCard className="h-4 w-4" /> },
    { id: "yappy", label: "Yappy", icon: <Smartphone className="h-4 w-4" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold tracking-widest uppercase text-[#C49A1E]">
                  Completar pago
                </span>
                <button
                  onClick={onClose}
                  className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <h2 className="text-xl font-black text-gray-900">{plan.name}</h2>
              <div className="flex items-end gap-1 mt-1">
                <span className="text-3xl font-black text-gray-900">B/. {plan.numericPrice.toFixed(2)}</span>
                <span className="text-sm text-gray-400 pb-1">/mes</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-semibold transition-colors border-b-2 ${
                    tab === t.id
                      ? "border-[#C49A1E] text-[#C49A1E] bg-amber-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-6">

              {/* PagaloFácil tab */}
              {tab === "paguelo" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 text-center">
                    Paga con tarjeta Visa, Mastercard o Clave en la plataforma segura de PagaloFácil.
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    {[
                      { label: "Visa", bg: "#1a1f71", color: "#fff" },
                      { label: "MC", bg: "#eb001b", color: "#fff" },
                      { label: "Clave", bg: "#00a651", color: "#fff" },
                    ].map(c => (
                      <div
                        key={c.label}
                        className="h-7 px-2.5 rounded-md flex items-center text-xs font-black"
                        style={{ background: c.bg, color: c.color }}
                      >
                        {c.label}
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#C49A1E]/8 border border-[#C49A1E]/20 rounded-2xl p-4 text-center">
                    <Shield className="h-8 w-8 text-[#C49A1E] mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-800">Pago 100% seguro</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Serás redirigido a PagaloFácil, la pasarela de pagos #1 de Panamá.
                      Tu información bancaria nunca es compartida con nosotros.
                    </p>
                  </div>

                  {pagueloError && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-700">{pagueloError}</p>
                      <button
                        onClick={() => setPagueloError(null)}
                        className="mt-2 text-xs text-red-600 underline"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  )}

                  {processing && (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-[#C49A1E]" />
                      <span className="text-sm text-gray-600">Abriendo PagaloFácil...</span>
                    </div>
                  )}

                  {!processing && !pagueloError && (
                    <>
                      <button
                        onClick={handlePagueloFacil}
                        className="w-full h-12 rounded-2xl font-bold text-sm text-white transition-colors flex items-center justify-center gap-2"
                        style={{ background: "#C49A1E" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#b08a18")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#C49A1E")}
                      >
                        <Shield className="h-4 w-4" />
                        Pagar B/. {plan.numericPrice.toFixed(2)} con PagaloFácil
                      </button>
                      <p className="text-xs text-gray-400 text-center">
                        Se abrirá una nueva ventana. Regresa aquí cuando termines.
                      </p>
                    </>
                  )}

                  {processing && pollRef.current && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500 mx-auto mb-2" />
                      <p className="text-sm text-amber-700 font-medium">Esperando confirmación de pago...</p>
                      <p className="text-xs text-amber-600 mt-1">
                        Completa el pago en la ventana de PagaloFácil. Esta pantalla se actualizará sola.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* PayPal tab */}
              {tab === "paypal" && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 text-center">
                    Paga con tu tarjeta Visa o Mastercard, o con tu cuenta PayPal. 100% seguro.
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    {[
                      { label: "Visa", bg: "#1a1f71", color: "#fff" },
                      { label: "MC", bg: "#eb001b", color: "#fff" },
                      { label: "PayPal", bg: "#003087", color: "#009cde" },
                    ].map(c => (
                      <div
                        key={c.label}
                        className="h-7 px-2.5 rounded-md flex items-center text-xs font-black"
                        style={{ background: c.bg, color: c.color }}
                      >
                        {c.label}
                      </div>
                    ))}
                  </div>

                  {sdkError || (!PAYPAL_CLIENT_ID) ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                      <AlertCircle className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-sm text-amber-700 font-medium">
                        Pagos con PayPal temporalmente no disponibles.
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Usa PagaloFácil o Yappy.
                      </p>
                    </div>
                  ) : paypalError ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                      <AlertCircle className="h-5 w-5 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-700">{paypalError}</p>
                      <button
                        onClick={() => { setPaypalError(null); setPaypalReady(false); }}
                        className="mt-2 text-xs text-red-600 underline"
                      >
                        Intentar de nuevo
                      </button>
                    </div>
                  ) : null}

                  {processing && (
                    <div className="flex items-center justify-center gap-2 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-[#C49A1E]" />
                      <span className="text-sm text-gray-600">Procesando pago...</span>
                    </div>
                  )}

                  <div
                    ref={paypalContainer}
                    className={`min-h-[52px] ${!sdkLoaded || sdkError || !PAYPAL_CLIENT_ID ? "hidden" : ""}`}
                  />

                  {!sdkLoaded && !sdkError && PAYPAL_CLIENT_ID && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      <span className="text-sm text-gray-400">Cargando métodos de pago...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Yappy tab */}
              {tab === "yappy" && (
                <div className="space-y-4">
                  {yappyDone ? (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                      <h3 className="font-bold text-gray-900 text-lg">Listo</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Tu solicitud fue registrada. El equipo de Moon Pilates confirmará tu pago por WhatsApp o email en pocas horas.
                      </p>
                      <button
                        onClick={onClose}
                        className="mt-5 w-full h-12 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-colors"
                      >
                        Cerrar
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
                        <div className="h-14 w-14 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                          <Smartphone className="h-7 w-7 text-white" />
                        </div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Envía B/. {plan.numericPrice.toFixed(2)} por Yappy a:
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <span className="text-2xl font-black text-green-700">{YAPPY_DISPLAY}</span>
                          <button
                            onClick={copyPhone}
                            className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center hover:bg-green-200 transition-colors"
                          >
                            {yappyCopied
                              ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                              : <Copy className="h-4 w-4 text-green-600" />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Moon Pilates Studio</p>
                      </div>

                      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Instrucciones</p>
                        {[
                          "Abre tu app Yappy en tu celular",
                          `Envía B/. ${plan.numericPrice.toFixed(2)} al número ${YAPPY_DISPLAY}`,
                          `En el concepto escribe: ${plan.name}`,
                          'Presiona "Ya envié el Yappy" y espera confirmación',
                        ].map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <span className="h-5 w-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <p className="text-sm text-gray-600">{step}</p>
                          </div>
                        ))}
                      </div>

                      <a
                        href={`https://wa.me/50765869949?text=${encodeURIComponent(`Hola! Acabo de hacer un Yappy de B/. ${plan.numericPrice.toFixed(2)} por la membresía ${plan.name}.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full h-11 rounded-2xl border border-green-200 text-green-700 text-sm font-semibold hover:bg-green-50 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Notificar por WhatsApp
                      </a>

                      <button
                        onClick={handleYappyConfirm}
                        disabled={processing}
                        className="w-full h-12 bg-green-600 text-white rounded-2xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {processing
                          ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando...</>
                          : "Ya envié el Yappy"}
                      </button>
                    </>
                  )}
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
