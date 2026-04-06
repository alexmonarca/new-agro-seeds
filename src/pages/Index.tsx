import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import ProductCatalog from "@/components/catalog/ProductCatalog";
import MainHeader from "@/components/layout/MainHeader";
import HeroVideoSection from "@/components/sections/HeroVideoSection";
import HomeHeroSlider from "@/components/sections/HomeHeroSlider";
const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const { toast } = useToast();
  const authRequestIdRef = useRef(0);

  const handleCategories = useCallback((cats: string[]) => {
    setAvailableCategories(cats);
  }, []);

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
        console.error("RPC has_role falhou (Index):", roleRes.error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(!!roleRes.data);
    };

    const bootstrap = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        return;
      }

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
      console.error("Falha ao sair:", error);
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

      <div role="main">
        <HeroVideoSection youtubeUrl="https://www.youtube.com/watch?v=OrP8m0HZWCY" className="h-[480px]" />

        <HomeHeroSlider />

        {/* Barra de busca e filtro de categorias */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-4 sm:px-8 md:flex-row md:items-center lg:px-12">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                🔍
              </span>
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-green))] focus-visible:ring-offset-2"
              />
            </div>
            <div className="md:w-56">
              <select
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground shadow-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-green))] focus-visible:ring-offset-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Conteúdo principal: apenas catálogo de produtos */}
        <section id="catalogo" className="mx-auto mt-10 max-w-5xl space-y-4 px-6 pb-16 sm:px-8 lg:px-12">
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Catálogo de Produtos</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Confira abaixo os principais pilotos automáticos, GPS agrícolas, sensores e soluções em pulverização com suporte
            especializado NEWagro.
          </p>

          <ProductCatalog search={search} category={category} onCategories={handleCategories} />
        </section>
      </div>

      <footer>
        {/* faixa verde de suporte */}
        <section className="footer-support mt-auto">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-10 text-center sm:px-8 md:py-12 lg:px-12">
            <h2 className="text-2xl font-semibold md:text-3xl">Precisa de Suporte Técnico?</h2>
            <p className="max-w-2xl text-sm md:text-base">
              Entre em contato conosco para assistência especializada em agricultura de precisão.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://wa.me/555596194261"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-medium text-[hsl(var(--brand-green))] shadow-md"
              >
                <span>📞</span>
                <span>(55) 99619-4261</span>
              </a>
              <Button asChild className="rounded-full bg-white px-5 py-2 text-sm font-medium text-[hsl(var(--brand-green))] shadow-md hover:bg-white/90">
                <a href="mailto:newagroasb@gmail.com">Enviar Email</a>
              </Button>
            </div>
          </div>
        </section>

        {/* rodapé escuro com colunas */}
        <section className="footer-main border-t border-border text-xs text-muted-foreground">
          <div className="mx-auto max-w-5xl px-6 py-8 sm:px-8 lg:px-12">
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">NEWagro</h3>
                <p className="mt-2 text-xs text-muted-foreground">Soluções em agricultura de precisão</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Produtos</h3>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>Piloto Automático</li>
                  <li>Pulverizadores</li>
                  <li>GPS Agrícola</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Empresa</h3>
                <ul className="mt-2 space-y-1 text-xs">
                  <li><a href="/servicos" className="hover:underline">Serviços</a></li>
                  <li><a href="/servicos#sobre" className="hover:underline">Sobre</a></li>
                  <li><a href="/servicos#contato" className="hover:underline">Contato</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Contato</h3>
                <ul className="mt-2 space-y-1 text-xs">
                  <li>WhatsApp: (55) 99619-4261</li>
                  <li>São Borja - RS</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-border pt-4 text-[11px] md:flex-row">
              <a
                href="https://instagram.com/newagrosb"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-foreground hover:underline"
              >
                <span aria-hidden>📷</span>
                <span>Instagram</span>
              </a>
              <p>© {new Date().getFullYear()} NEWagro. Todos os direitos reservados.</p>
            </div>
          </div>
        </section>
      </footer>
    </div>
  );
};

export default Index;
