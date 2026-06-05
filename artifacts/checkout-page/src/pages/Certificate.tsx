import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, ArrowRight, CheckCircle2, Sparkles, Star, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGetCheckoutUrl } from "@workspace/api-client-react";
import certBadge from "@assets/image_1780395357132.png";

const SESSION_KEY = "aidra_checkout_url";
const BOUNCE_DELAY_MS = 2000;

const CONFETTI_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e",
];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = `${(index * 13.7) % 100}%`;
  const delay = (index * 0.015) % 1.2;
  const duration = 2.5 + (index % 5) * 0.4;
  const size = 6 + (index % 4) * 2;
  const rotate = (index * 47) % 360;
  return (
    <motion.div
      className="absolute top-0 rounded-sm pointer-events-none"
      style={{ left, width: size, height: size * 0.5, backgroundColor: color, rotate }}
      initial={{ y: -20, opacity: 1 }}
      animate={{ y: "110vh", opacity: [1, 1, 0], rotate: rotate + 720 }}
      transition={{ duration, delay, ease: "easeIn" }}
    />
  );
}

function Confetti() {
  const pieces = Array.from({ length: 80 }, (_, i) => i);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-50">
      {pieces.map((i) => <ConfettiPiece key={i} index={i} />)}
    </div>
  );
}

const ACHIEVEMENTS = [
  { label: "Modules Completed", value: "7 / 7" },
  { label: "Skills Unlocked", value: "6 Core Skills" },
  { label: "Certification", value: "Mastery Level" },
];

function BounceBackBanner({
  checkoutUrl,
  onDismiss,
}: {
  checkoutUrl: string;
  onDismiss: () => void;
}) {
  const [countdown, setCountdown] = useState(Math.ceil(BOUNCE_DELAY_MS / 1000));
  const redirectedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => Math.max(0, c - 1));
    }, 1000);

    const timer = setTimeout(() => {
      if (!redirectedRef.current) {
        redirectedRef.current = true;
        sessionStorage.removeItem(SESSION_KEY);
        window.location.href = checkoutUrl;
      }
    }, BOUNCE_DELAY_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [checkoutUrl]);

  const handleDismiss = () => {
    redirectedRef.current = true;
    sessionStorage.removeItem(SESSION_KEY);
    onDismiss();
  };

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 z-50 w-full max-w-md"
      style={{ x: "-50%" }}
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
    >
      <div className="mx-4 bg-foreground text-background rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4">
        <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">Taking you back to checkout</p>
          <p className="text-xs opacity-70 mt-0.5">
            Redirecting in {countdown}s…{" "}
            <button
              className="underline underline-offset-2 hover:no-underline"
              onClick={handleDismiss}
            >
              Stay here
            </button>
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function Certificate() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [bouncedUrl, setBouncedUrl] = useState<string | null>(null);

  const { data, isLoading, isError } = useGetCheckoutUrl(undefined, {
    query: { staleTime: 20 * 60 * 1000 },
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setBouncedUrl(saved);
  }, []);

  const handleDownload = () => {
    if (!data?.checkoutUrl) return;
    sessionStorage.setItem(SESSION_KEY, data.checkoutUrl);
    setRedirecting(true);
    window.location.href = data.checkoutUrl;
  };

  const buttonDisabled = isLoading || redirecting || !data?.checkoutUrl;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start overflow-x-hidden">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

      <AnimatePresence>
        {bouncedUrl && (
          <BounceBackBanner
            checkoutUrl={bouncedUrl}
            onDismiss={() => setBouncedUrl(null)}
          />
        )}
      </AnimatePresence>

      {/* Top accent bar */}
      <div className="w-full h-1.5 bg-gradient-to-r from-violet-500 via-primary to-indigo-500" />

      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
        <div className="font-serif text-xl font-bold tracking-tight flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          AIDRA Labs
        </div>
        <span className="text-xs text-muted-foreground font-medium tracking-widest uppercase">
          Mastery Certificate
        </span>
      </header>

      <main className="w-full max-w-4xl mx-auto px-6 pb-20 flex flex-col items-center gap-14">

        {/* Hero */}
        <motion.div
          className="text-center space-y-4 pt-4"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Sparkles className="w-4 h-4" />
            Course Complete
          </motion.div>

          <h1 className="font-serif text-5xl lg:text-6xl font-bold leading-tight">
            You did it.
          </h1>
          <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Your <strong className="text-foreground">Advanced AI Data Trainer</strong> Mastery Certificate is ready. This is real — you put in the work.
          </p>
        </motion.div>

        {/* Achievement stats */}
        <motion.div
          className="w-full grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {ACHIEVEMENTS.map((a, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 text-center">
              <Star className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="font-bold text-lg">{a.value}</p>
              <p className="text-sm text-muted-foreground">{a.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Certificate preview + purchase */}
        <motion.div
          className="w-full bg-card border border-border rounded-2xl overflow-hidden shadow-2xl shadow-black/10"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.45, duration: 0.5 }}
        >
          {/* Certificate image */}
          <div className="relative">
            <img
              src={certBadge}
              alt="AIDRA Labs Advanced AI Data Trainer Mastery Certificate"
              className="w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-gray-800">Verified Certificate</span>
            </div>
          </div>

          {/* Purchase section */}
          <div className="p-8 space-y-5">
            <div>
              <p className="font-semibold text-lg">Download your certificate</p>
              <p className="text-sm text-muted-foreground mt-1">
                One payment of <strong className="text-foreground">$18.55</strong> — yours to keep forever. Add it to LinkedIn, share it with employers, and start applying today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                size="lg"
                className="text-base font-semibold h-13 px-8 min-w-[240px]"
                onClick={handleDownload}
                disabled={buttonDisabled}
                data-testid="button-download-certificate"
              >
                {redirecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Redirecting…
                  </>
                ) : isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading…
                  </>
                ) : isError ? (
                  "Unavailable — try again later"
                ) : (
                  <>
                    Download now — $18.55 <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Secure payment powered by Stripe. Issued by AIDRA Labs — Powered by Human Intelligence.
            </p>
          </div>
        </motion.div>

      </main>

      <footer className="w-full border-t border-border/50 py-8 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AIDRA Labs. All rights reserved.
      </footer>
    </div>
  );
}
