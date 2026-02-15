import { useEffect, useState } from "react";
import newagroLogo from "@/assets/logo-NEWagro-site.png";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

const ServicesPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getUser();
      setIsAuthenticated(!!data.user);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Você saiu da sua conta." });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-4 md:py-5">
          <div className="flex items-center gap-3">
            <img
              src={newagroLogo}
              alt="Logo NEWagro - Soluções em agricultura de precisão"
              className="h-10 w-auto md:h-12"
              loading="lazy"
            />
          </div>

          <nav className="ml-auto hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="/" className="hover:text-foreground">
              Produtos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {!isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                  <a href="/login">Entrar</a>
                </Button>
                <Button asChild size="sm" className="shadow-md">
                  <a href="/login">Registrar</a>
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={handleLogout} className="shadow-none">
                Sair
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:pt-14">
        {/* Serviços em destaque */}
        <section id="servicos" className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Serviços especializados NEWagro
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Da calibração de pulverizadores ao conserto de monitores GPS, oferecemos suporte completo em campo para
              que sua operação não pare.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-foreground">Assistência técnica em campo</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Suporte na sua propriedade em São Borja e região para instalação, diagnóstico e ajustes finos.
              </p>
              <span className="mt-auto text-xs font-medium text-[hsl(var(--brand-green))]">Atendimento sob agendamento</span>
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-foreground">Calibração de pulverizadores</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Calibração profissional focada em reduzir desperdícios e garantir aplicação precisa de insumos.
              </p>
              <span className="mt-auto text-xs font-medium text-[hsl(var(--brand-green))]">Economia e eficiência no campo</span>
            </div>
            <div className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="mb-1 text-sm font-semibold text-foreground">Conserto e manutenção</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Reparos de monitores GPS e displays touchscreen das principais marcas do mercado.
              </p>
              <span className="mt-auto text-xs font-medium text-[hsl(var(--brand-green))]">Laboratório técnico especializado</span>
            </div>
          </div>
        </section>

        {/* Sobre / Contato */}
        <section id="sobre" className="mt-16 grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Sobre a NEWagro</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A NEWagro nasceu com o propósito de aproximar o produtor rural da tecnologia de ponta em agricultura de
              precisão. Com atuação focada na região de São Borja (RS), oferecemos soluções sob medida para cada
              realidade de campo.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Atendimento técnico especializado e linguagem simples.</li>
              <li>• Suporte multimarcas em pilotos automáticos, pulverização e GPS.</li>
              <li>• Foco em produtividade, redução de custos e sustentabilidade.</li>
            </ul>
          </div>

          <div id="contato" className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Fale com a NEWagro</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tire suas dúvidas, solicite um orçamento ou agende uma visita técnica.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="font-medium text-foreground">WhatsApp</dt>
                <dd>
                  <a
                    href="https://wa.me/555596194261"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[hsl(var(--brand-green))] underline-offset-4 hover:underline"
                  >
                    (55) 99619-4261
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Instagram</dt>
                <dd>
                  <a
                    href="https://instagram.com/newagrosb"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[hsl(var(--brand-green))] underline-offset-4 hover:underline"
                  >
                    @newagrosb
                  </a>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-foreground">Localização</dt>
                <dd className="text-muted-foreground">São Borja, Rio Grande do Sul</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} NEWagro. Todos os direitos reservados.
          </p>
          <p>Especialistas em tecnologia para agricultura de precisão.</p>
        </div>
      </footer>
    </div>
  );
};

export default ServicesPage;
