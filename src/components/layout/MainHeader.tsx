import newagroLogo from "@/assets/logo-NEWagro-site.png";
import { Button } from "@/components/ui/button";

type MainHeaderProps = {
  isAuthenticated: boolean;
  onLogout: () => void;
};

export default function MainHeader({ isAuthenticated, onLogout }: MainHeaderProps) {
  return (
    <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 md:py-5">
        <a href="/" className="flex items-center gap-3" aria-label="Ir para a página inicial">
          <img
            src={newagroLogo}
            alt="Logo NEWagro - Soluções em agricultura de precisão"
            className="h-10 w-auto md:h-12"
            loading="lazy"
          />
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="/" className="hover:text-foreground">
            Produtos
          </a>
          <a href="/servicos" className="hover:text-foreground">
            Serviços
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
            <Button size="sm" variant="outline" onClick={onLogout} className="shadow-none">
              Sair
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
