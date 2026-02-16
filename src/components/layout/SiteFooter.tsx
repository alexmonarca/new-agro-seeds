import { Button } from "@/components/ui/button";

export default function SiteFooter() {
  return (
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
            <Button
              asChild
              className="rounded-full bg-white px-5 py-2 text-sm font-medium text-[hsl(var(--brand-green))] shadow-md hover:bg-white/90"
            >
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
                <li>
                  <a href="/servicos" className="hover:underline">
                    Serviços
                  </a>
                </li>
                <li>
                  <a href="/servicos#sobre" className="hover:underline">
                    Sobre
                  </a>
                </li>
                <li>
                  <a href="/servicos#contato" className="hover:underline">
                    Contato
                  </a>
                </li>
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
  );
}
