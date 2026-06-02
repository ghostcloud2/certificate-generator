import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGetCheckoutUrl, getGetCheckoutUrlQueryKey } from "@workspace/api-client-react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, ShieldCheck, Star } from "lucide-react";
import heroBanner from "@assets/image_1780395469864.png";
import certBadge from "@assets/image_1780395357132.png";

const WHAT_YOU_LEARN = [
  "Understand the AI Data Trainer role",
  "Master key AI training vocabulary",
  "Apply rating, ranking & annotation",
  "Label and classify AI errors",
  "Write effective training prompts",
  "Land entry-level AI training jobs",
];

const MODULES = [
  { num: "01", title: "What is AI Data Training?", desc: "Understand the field, the companies, and where you fit in." },
  { num: "02", title: "Core Annotation Skills", desc: "Rating, ranking, and labelling — the bread and butter of the work." },
  { num: "03", title: "AI Training Vocabulary", desc: "Speak the language every hiring manager wants to hear." },
  { num: "04", title: "Prompt Writing for Trainers", desc: "Write high-quality prompts that actually improve models." },
  { num: "05", title: "Error Classification", desc: "Spot and label AI outputs with precision and consistency." },
  { num: "06", title: "Building Your Portfolio", desc: "Package your skills into proof that gets you hired." },
  { num: "07", title: "Getting Your First Contract", desc: "Platforms, applications, and what to say to land the role." },
];

export default function Home() {
  const [name, setName] = useState("");

  const { refetch, isFetching, error, isError } = useGetCheckoutUrl(
    name ? { name } : {},
    { query: { enabled: false, queryKey: getGetCheckoutUrlQueryKey(name ? { name } : {}) } }
  );

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await refetch();
    if (result.data?.checkoutUrl) {
      window.location.href = result.data.checkoutUrl;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">

      {/* Hero */}
      <section className="relative w-full min-h-[480px] flex flex-col items-center justify-center text-center overflow-hidden">
        <img
          src={heroBanner}
          alt="Advanced AI Data Trainer course"
          className="absolute inset-0 w-full h-full object-cover object-center"
          data-testid="img-hero-banner"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 px-6 py-20 max-w-3xl mx-auto">
          <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-3">
            Advanced AI Data Trainer · Mastery Certificate
          </p>
          <h1 className="text-white font-serif text-5xl lg:text-6xl font-bold leading-tight mb-5">
            Advanced AI Data Trainer
          </h1>
          <p className="text-white/85 text-xl leading-relaxed max-w-xl mx-auto">
            Your step-by-step guide to becoming job-ready in one of the fastest-growing fields in tech — no coding required.
          </p>
        </div>
      </section>

      {/* Certificate badge + buy card */}
      <section className="bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left — cert preview */}
          <div className="space-y-6">
            <img
              src={certBadge}
              alt="AIDRA Labs Mastery Certificate"
              className="w-full rounded-xl shadow-lg"
              data-testid="img-cert-badge"
            />
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p>
                Upon completion you receive a verified <strong className="text-foreground">Advanced Mastery Certificate</strong> from AIDRA Labs — powered by Human Intelligence.
              </p>
            </div>
          </div>

          {/* Right — checkout card */}
          <div className="bg-background border border-border rounded-2xl p-8 shadow-xl w-full max-w-md mx-auto lg:mx-0">
            <div className="text-center mb-6 space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1 mb-3">
                <Star className="w-3 h-3" /> Lifetime Access
              </span>
              <h2 className="font-serif text-2xl font-semibold">Get Your Certificate</h2>
              <p className="text-muted-foreground text-sm">One payment. Yours forever.</p>
            </div>

            <div className="text-center mb-6">
              <span className="text-5xl font-serif font-bold" data-testid="text-price">$18.55</span>
              <span className="text-muted-foreground text-sm ml-2">USD</span>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium">
                  Your Name <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  data-testid="input-name"
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
              </div>

              {isError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Failed to initiate checkout</p>
                    <p className="opacity-90">{error?.error ?? "Please try again."}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full h-13 text-base font-semibold"
                disabled={isFetching}
                data-testid="button-checkout"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Preparing checkout...
                  </>
                ) : (
                  <>
                    Enrol now — $18.55 <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment powered by Stripe.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2 className="font-serif text-3xl font-semibold mb-3" data-testid="text-learn-heading">
          What You'll Learn in This Course
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10">
          This 2-hour course will take you from zero to job-ready. Each module builds on the last — by the end, you'll have real skills that companies pay for.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {WHAT_YOU_LEARN.map((item, i) => (
            <div key={i} className="flex items-start gap-3" data-testid={`item-learn-${i}`}>
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-base">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7-Module Journey */}
      <section className="bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-6 py-16">
          <h2 className="font-serif text-3xl font-semibold text-center mb-10" data-testid="text-modules-heading">
            Your 7-Module Journey
          </h2>
          <div className="space-y-4">
            {MODULES.map((mod) => (
              <div
                key={mod.num}
                className="flex gap-5 items-start p-5 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors"
                data-testid={`card-module-${mod.num}`}
              >
                <span className="font-serif text-2xl font-bold text-primary/40 shrink-0 w-8">{mod.num}</span>
                <div>
                  <p className="font-semibold">{mod.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{mod.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-6 text-center bg-background border-t border-border">
        <h2 className="font-serif text-3xl font-semibold mb-3">Ready to get certified?</h2>
        <p className="text-muted-foreground mb-8">Join now for $18.55 and start your AI career today.</p>
        <Button
          size="lg"
          className="text-base font-semibold px-10 h-13"
          onClick={() => document.getElementById("name")?.scrollIntoView({ behavior: "smooth", block: "center" })}
          data-testid="button-cta-bottom"
        >
          Get your certificate <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </section>

      <footer className="py-8 px-6 text-center text-sm text-muted-foreground border-t border-border/50 space-y-2">
        <p>© {new Date().getFullYear()} AIDRA Labs. All rights reserved.</p>
        <a
          href="/certificate"
          className="inline-block text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
          data-testid="link-certificate-preview"
        >
          Already completed the course? View your certificate
        </a>
      </footer>
    </div>
  );
}
