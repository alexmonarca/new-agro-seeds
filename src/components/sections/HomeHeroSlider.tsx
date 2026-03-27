import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const slides = [
  { src: "/1.png", alt: "Produto em destaque NEWagro 1" },
  { src: "/2.png", alt: "Produto em destaque NEWagro 2" },
  { src: "/3.png", alt: "Produto em destaque NEWagro 3" },
  { src: "/4.png", alt: "Produto em destaque NEWagro 4" },
  { src: "/5.png", alt: "Produto em destaque NEWagro 5" },
];

export default function HomeHeroSlider() {
  return (
    <section className="relative overflow-hidden px-4 py-3 sm:px-6 sm:py-4 lg:px-10">
      <div className="mx-auto h-[220px] w-full max-w-[1920px] sm:h-[300px] lg:h-[480px]">
      <Carousel opts={{ loop: true }} className="h-full w-full">
        <CarouselContent className="h-full">
          {slides.map((slide) => (
            <CarouselItem key={slide.src} className="h-full pl-0">
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

        <CarouselPrevious className="left-4 z-20 border-border/70 bg-background/70 text-foreground hover:bg-background" />
        <CarouselNext className="right-4 z-20 border-border/70 bg-background/70 text-foreground hover:bg-background" />
      </Carousel>
      </div>
    </section>
  );
}