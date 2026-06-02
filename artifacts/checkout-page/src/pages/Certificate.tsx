import { useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Loader2 } from "lucide-react";
import { useGetCheckoutUrl } from "@workspace/api-client-react";

export default function Certificate() {
  const { data, isError, refetch } = useGetCheckoutUrl(
    {},
    { query: { enabled: true } }
  );

  useEffect(() => {
    if (data?.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    }
  }, [data]);

  const handleRetry = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
      <div className="w-full h-1.5 bg-gradient-to-r from-violet-500 via-primary to-indigo-500 absolute top-0" />

      <motion.div
        className="flex flex-col items-center gap-6 text-center px-6"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="font-serif text-xl font-bold tracking-tight flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-primary" />
          AIDRA Labs
        </div>

        {isError ? (
          <>
            <p className="text-muted-foreground">Something went wrong loading checkout.</p>
            <button
              onClick={handleRetry}
              className="text-primary underline underline-offset-2 text-sm hover:opacity-70 transition-opacity"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="space-y-1">
              <p className="font-semibold text-lg">Taking you to checkout…</p>
              <p className="text-sm text-muted-foreground">
                You'll be redirected to Stripe in a moment.
              </p>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
