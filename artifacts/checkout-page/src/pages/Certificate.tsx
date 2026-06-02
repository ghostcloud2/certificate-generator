import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, CheckCircle2, Download, Loader2, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import certBadge from "@assets/image_1780395357132.png";

const CONFETTI_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#f43f5e",
];

function ConfettiPiece({ index }: { index: number }) {
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const left = `${Math.random() * 100}%`;
  const delay = Math.random() * 1.2;
  const duration = 2.5 + Math.random() * 2;
  const size = 6 + Math.random() * 8;
  const rotate = Math.random() * 360;

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
      {pieces.map((i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </div>
  );
}

const ACHIEVEMENTS = [
  { label: "Modules Completed", value: "7 / 7" },
  { label: "Skills Unlocked", value: "6 Core Skills" },
  { label: "Certification", value: "Mastery Level" },
];

export default function Certificate() {
  const [showConfetti, setShowConfetti] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const handleDownload = async () => {
    setIsDownloading(true);
    await new Promise((r) => setTimeout(r, 2200));
    setIsDownloading(false);
    setDownloaded(true);

    // Trigger actual image download
    const link = document.createElement("a");
    link.href = certBadge;
    link.download = "AIDRA-Labs-Mastery-Certificate.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-start overflow-x-hidden">
      <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

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

        {/* Hero congratulations */}
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
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 text-center"
              data-testid={`card-achievement-${i}`}
            >
              <Star className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="font-bold text-lg">{a.value}</p>
              <p className="text-sm text-muted-foreground">{a.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Certificate preview + download */}
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
              data-testid="img-certificate"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Verified badge overlay */}
            <div className="absolute bottom-5 right-5 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-xs font-bold text-gray-800">Verified Certificate</span>
            </div>
          </div>

          {/* Download section */}
          <div className="p-8 space-y-6">
            <div className="space-y-1.5">
              <label htmlFor="cert-name" className="text-sm font-medium">
                Your name on the certificate <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <input
                id="cert-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                data-testid="input-cert-name"
                className="flex h-11 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                size="lg"
                className="text-base font-semibold h-13 px-8 min-w-[220px]"
                onClick={handleDownload}
                disabled={isDownloading || downloaded}
                data-testid="button-download-certificate"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Preparing your certificate...
                  </>
                ) : downloaded ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2 text-green-400" />
                    Certificate downloaded!
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Certificate
                  </>
                )}
              </Button>

              {downloaded && (
                <motion.p
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  Check your Downloads folder.
                </motion.p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Issued by AIDRA Labs — Powered by Human Intelligence. This certificate is verifiable and yours to keep.
            </p>
          </div>
        </motion.div>

        {/* What's next */}
        <motion.div
          className="w-full space-y-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="font-serif text-2xl font-semibold text-center">What's next?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: "01",
                title: "Add it to LinkedIn",
                desc: "Post your certificate to LinkedIn and signal to recruiters you're job-ready.",
              },
              {
                icon: "02",
                title: "Apply to platforms",
                desc: "Sign up to Scale AI, Remotasks, and Appen — your skills are exactly what they look for.",
              },
              {
                icon: "03",
                title: "Share the win",
                desc: "Tell someone. You earned a real credential in a field that's hiring right now.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-xl p-6 space-y-2"
                data-testid={`card-next-${i}`}
              >
                <span className="font-serif text-2xl font-bold text-primary/40">{item.icon}</span>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </main>

      <footer className="w-full border-t border-border/50 py-8 px-6 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AIDRA Labs. All rights reserved.
      </footer>
    </div>
  );
}
