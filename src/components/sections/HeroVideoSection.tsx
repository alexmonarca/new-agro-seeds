import { Button } from "@/components/ui/button";

type HeroVideoSectionProps = {
  /** Caminho para MP4 em /public, ex: "/videos/newagro-hero.mp4" */
  videoSrc?: string;
  /** URL do YouTube (watch/shorts/youtu.be) */
  youtubeUrl?: string;
};

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);

    // https://youtu.be/VIDEO_ID
    if (u.hostname === "youtu.be") return u.pathname.replace("/", "").trim() || null;

    // https://www.youtube.com/watch?v=VIDEO_ID
    const v = u.searchParams.get("v");
    if (v) return v;

    // https://www.youtube.com/shorts/VIDEO_ID
    const shorts = u.pathname.match(/\/shorts\/([^/?#]+)/i)?.[1];
    if (shorts) return shorts;

    // https://www.youtube.com/embed/VIDEO_ID
    const embed = u.pathname.match(/\/embed\/([^/?#]+)/i)?.[1];
    if (embed) return embed;

    return null;
  } catch {
    return null;
  }
}

export default function HeroVideoSection({ videoSrc, youtubeUrl }: HeroVideoSectionProps) {
  const youtubeId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;
  const youtubeEmbedSrc = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`
    : null;

  return (
    <section className="relative overflow-hidden">
      {/* Mídia de fundo (cover, sem bordas) */}
      <div className="absolute inset-0" aria-hidden="true">
        {youtubeEmbedSrc ? (
          <iframe
            className={
              "absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 " +
              // No mobile, ampliamos bem mais para cortar as bordas (letterbox) do vídeo.
              "scale-[2.35] xs:scale-[2.5] sm:scale-[2.2] md:scale-[2.05] lg:scale-[2.15] " +
              // Mantém cobrindo a área mesmo em proporções extremas.
              "min-h-full min-w-full"
            }
            src={youtubeEmbedSrc}
            title="Vídeo de fundo"
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            frameBorder={0}
          />
        ) : videoSrc ? (
          <video
            className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 object-cover scale-125 sm:scale-140 md:scale-150 lg:scale-[1.6]"
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
      </div>

      {/* Camada verde translúcida para legibilidade */}
      <div className="absolute inset-0 bg-primary/70" aria-hidden="true" />

      <div className="relative z-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:px-8 md:flex-row md:items-center md:py-14 lg:px-12">
          <div className="md:w-2/3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary-foreground/90">
              MAXIMIZE SUA PRODUTIVIDADE
            </p>
            <h1
              id="hero-title"
              className="mb-4 text-3xl font-bold leading-tight tracking-tight text-primary-foreground sm:text-4xl md:text-5xl"
            >
              Agricultura Inteligente, Resultados Reais
            </h1>
            <p className="mb-6 max-w-xl text-base text-primary-foreground/90 md:text-lg">
              Piloto automático, GPS de precisão e sistemas de pulverização que reduzem custos e aumentam sua produção.
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
