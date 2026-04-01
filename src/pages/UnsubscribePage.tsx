import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MailX, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (res.ok && data.valid) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex flex-col items-center gap-3">
            {status === "loading" && <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />}
            {status === "valid" && <MailX className="h-10 w-10 text-accent" />}
            {status === "success" && <CheckCircle className="h-10 w-10 text-accent" />}
            {status === "already" && <CheckCircle className="h-10 w-10 text-muted-foreground" />}
            {(status === "invalid" || status === "error") && <AlertCircle className="h-10 w-10 text-destructive" />}
            <span className="text-xl">
              {status === "loading" && "Provera..."}
              {status === "valid" && "Odjava od mejlova"}
              {status === "success" && "Uspešno ste se odjavili"}
              {status === "already" && "Već ste odjavljeni"}
              {status === "invalid" && "Nevažeći link"}
              {status === "error" && "Greška"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "valid" && (
            <>
              <p className="text-muted-foreground">
                Da li ste sigurni da želite da se odjavite od mejl obaveštenja?
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
                {processing ? "Odjavljujem..." : "Potvrdi odjavu"}
              </Button>
            </>
          )}
          {status === "success" && (
            <p className="text-muted-foreground">
              Nećete više primati mejl obaveštenja od nas.
            </p>
          )}
          {status === "already" && (
            <p className="text-muted-foreground">
              Već ste se odjavili od naših mejl obaveštenja.
            </p>
          )}
          {status === "invalid" && (
            <p className="text-muted-foreground">
              Ovaj link za odjavu je nevažeći ili je istekao.
            </p>
          )}
          {status === "error" && (
            <p className="text-muted-foreground">
              Došlo je do greške. Pokušajte ponovo kasnije.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
