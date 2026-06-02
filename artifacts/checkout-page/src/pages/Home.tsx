import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGetCheckoutUrl, getGetCheckoutUrlQueryKey } from "@workspace/api-client-react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export default function Home() {
  const [name, setName] = useState("");
  
  const { data, refetch, isFetching, error, isError } = useGetCheckoutUrl(
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
      <header className="py-8 px-6 lg:px-12 flex justify-between items-center border-b border-border/50">
        <div className="font-serif text-2xl font-bold tracking-tight">Get You Sorted.</div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-secondary/50 blur-[100px] pointer-events-none" />
        
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
          <div className="flex flex-col gap-8 order-2 lg:order-1">
            <div className="space-y-4">
              <h1 className="font-serif text-5xl lg:text-7xl leading-[1.1] font-medium tracking-tight">
                Stop spinning in circles.
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                A sharp, no-nonsense framework to figure out what you actually want out of your career, and how to go get it. 
              </p>
            </div>
            
            <div className="space-y-4 pt-4 border-t border-border/50 max-w-md">
              {[
                "Identify your core professional drivers",
                "Map out realistic next-step transitions",
                "Cut through the decision paralysis",
                "Actionable templates and negotiation scripts"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 text-muted-foreground">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-base">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="bg-card border border-border shadow-2xl shadow-black/5 rounded-2xl p-8 lg:p-10 w-full max-w-md mx-auto relative">
              
              <div className="space-y-2 text-center mb-8">
                <div className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground mb-4">
                  Lifetime Access
                </div>
                <h2 className="font-serif text-3xl font-medium">Join the Course</h2>
                <p className="text-muted-foreground">One payment, yours forever.</p>
              </div>

              <div className="text-center mb-8">
                <span className="text-5xl font-serif font-medium">$149</span>
              </div>

              <form onSubmit={handlePay} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Your Name <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                  />
                </div>

                {isError && (
                  <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">Failed to initiate checkout</p>
                      <p className="opacity-90">{error?.error || "Please try again."}</p>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-base font-medium"
                  disabled={isFetching}
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Preparing checkout...
                    </>
                  ) : (
                    <>
                      Get access <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground pt-2">
                  Secure payment powered by Stripe.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-8 px-6 text-center text-sm text-muted-foreground border-t border-border/50">
        © {new Date().getFullYear()} Get You Sorted. All rights reserved.
      </footer>
    </div>
  );
}
