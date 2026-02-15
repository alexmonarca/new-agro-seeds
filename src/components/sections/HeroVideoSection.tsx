import { Button } from "@/components/ui/button";

type HeroVideoSectionProps = {
  videoSrc?: string;
};

export default function HeroVideoSection({ videoSrc }: HeroVideoSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Vídeo de fundo */}
      {videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" aria-hidden="true" />
      )}

      {/* Camada verde translúcida para legibilidade */}
      <div className="absolute inset-0 bg-primary/70" aria-hidden="true" />

      <div className="relative z-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:py-14">
          <div className="md:w-2/3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/90">
              Tecnologia agrícola de precisão
            </p>
            <h1
              id="hero-title"
              className="mb-4 text-3xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-4xl md:text-5xl"
            >
              Tecnologia Agrícola de Precisão
            </h1>
            <p className="mb-6 max-w-xl text-base text-primary-foreground/90 md:text-lg">
              Soluções completas em agricultura de precisão, piloto automático e sistemas de pulverização para maximizar sua
              produtividade.
            </p>

            <Button size="lg" variant="secondary" className="shadow-md">
              Explorar Catálogo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
