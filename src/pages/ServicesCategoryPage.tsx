import { useEffect, useRef, useState } from "react";
import MainHeader from "@/components/layout/MainHeader";
import HomeHeroSlider from "@/components/sections/HomeHeroSlider";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const ServicesCategoryPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const authRequestIdRef = useRef(0);

  useEffect(() => {
    const syncAuth = async (user?: { id: string } | null) => {
      const requestId = ++authRequestIdRef.current;
      const authed = !!user;
      setIsAuthenticated(authed);

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const roleRes = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      if (requestId !== authRequestIdRef.current) return;

      if (roleRes.error) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(!!roleRes.data);
    };

    const bootstrap = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await syncAuth(session?.user ? { id: session.user.id } : null);
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuth(session?.user ? { id: session.user.id } : null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) throw error;
      setIsAuthenticated(false);
      setIsAdmin(false);
      toast({ title: "Você saiu da sua conta." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Não foi possível sair",
        description: error?.message ?? "Tente novamente.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MainHeader isAuthenticated={isAuthenticated} isAdmin={isAdmin} onLogout={handleLogout} />

      <main>
        <header>
          <HomeHeroSlider />
          <section className="mx-auto max-w-5xl px-6 pb-10 pt-2 sm:px-8 lg:px-12">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Nós instalamos para você!</h1>
            <p className="mt-3 max-w-3xl text-sm text-muted-foreground md:text-base">
              Compre conosco e economize também seu tempo contando com nossos serviços de instalação técnica profissional
            </p>
          </section>
        </header>
      </main>
    </div>
  );
};

export default ServicesCategoryPage;