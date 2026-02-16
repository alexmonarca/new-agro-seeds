import { Button } from "@/components/ui/button";

type HeroVideoSectionProps = {
  /** URL de vídeo do YouTube (ex: https://www.youtube.com/watch?v=...) */
  youtubeUrl?: string;
  /** Fonte mp4 opcional (ex: /videos/newagro-hero.mp4) */
  videoSrc?: string;
};

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);

    if (u.hostname === "youtu.be") {
      return u.pathname.replace("/", "") || null;
    }

    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;

      // /embed/{id} ou /shorts/{id}
      const parts = u.pathname.split("/").filter(Boolean);
      const embedIndex = parts.indexOf("embed");
      if (embedIndex >= 0 && parts[embedIndex + 1]) return parts[embedIndex + 1];

      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex >= 0 && parts[shortsIndex + 1]) return parts[shortsIndex + 1];
    }

    return null;
  } catch {
    return null;
  }
}

export default function HeroVideoSection({ youtubeUrl, videoSrc }: HeroVideoSectionProps) {
  const youtubeId = youtubeUrl ? getYouTubeId(youtubeUrl) : null;
  const youtubeEmbedSrc = youtubeId
    ? `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3`
    : null;

  return (
    <section className="relative overflow-hidden">
      {/* Vídeo de fundo */}
      {youtubeEmbedSrc ? (
        <iframe
          className="absolute inset-0 h-full w-full origin-center scale-110 object-cover"
          src={youtubeEmbedSrc}
          title="Vídeo institucional NEWagro"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          aria-hidden="true"
        />
      ) : videoSrc ? (
        <video
          className="absolute inset-0 h-full w-full origin-center scale-110 object-cover"
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
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-10 sm:px-8 md:flex-row md:items-center md:py-14 lg:px-12">
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
