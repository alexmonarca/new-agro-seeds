import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

const slides = [
  { src: "/1.png", alt: "Produto em destaque NEWagro 1" },
  { src: "/2.png", alt: "Produto em destaque NEWagro 2" },
  { src: "/3.png", alt: "Produto em destaque NEWagro 3" },
  { src: "/4.png", alt: "Produto em destaque NEWagro 4" },
  { src: "/5.png", alt: "Produto em destaque NEWagro 5" },
];

export default function HomeHeroSlider() {
  return (
    <section className="relative h-[480px] overflow-hidden" aria-labelledby="hero-title">
      <Carousel opts={{ loop: true }} className="h-full w-full">
        <CarouselContent className="h-full">
          {slides.map((slide) => (
            <CarouselItem key={slide.src} className="h-[480px] pl-0">
              <img
                src={slide.src}
                alt={slide.alt}
                className="h-full w-full object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="absolute inset-0 bg-primary/70" aria-hidden="true" />

        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="mx-auto flex h-full max-w-5xl flex-col justify-center gap-6 px-6 py-10 sm:px-8 md:flex-row md:items-center lg:px-12">
            <div className="pointer-events-auto md:w-2/3">
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
                Piloto automático, GPS de precisão e sistemas de pulverização que reduzem custos e aumentam sua
                produção.
              </p>

              <Button asChild size="lg" variant="secondary" className="shadow-md">
                <a href="#catalogo">Explorar Catálogo</a>
              </Button>
            </div>
          </div>
        </div>

        <CarouselPrevious className="left-4 z-20 border-border/70 bg-background/70 text-foreground hover:bg-background" />
        <CarouselNext className="right-4 z-20 border-border/70 bg-background/70 text-foreground hover:bg-background" />
      </Carousel>
    </section>
  );
}