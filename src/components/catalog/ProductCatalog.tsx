import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type CatalogItemType = "product" | "service";

export type CatalogItem = {
  id: string | number;
  name: string;
  category: string;
  item_type: CatalogItemType;
  price: number | null;
  images?: unknown;
  is_active?: boolean;
  sort_order?: number;
};

type ProductImage = {
  url: string;
  path: string;
  alt?: string;
};

function normalizeImages(images: unknown): ProductImage[] {
  if (!images || !Array.isArray(images)) return [];
  return images
    .map((x) => {
      if (!x || typeof x !== "object") return null;
      const obj = x as any;
      if (typeof obj.url !== "string" || typeof obj.path !== "string") return null;
      const alt = typeof obj.alt === "string" ? obj.alt : undefined;
      return { url: obj.url, path: obj.path, alt } satisfies ProductImage;
    })
    .filter(Boolean) as ProductImage[];
}

function formatPriceBRL(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(price);
}

type ProductCatalogProps = {
  search: string;
  category: string; // "all" | category
  onCategories?: (categories: string[]) => void;
};

export default function ProductCatalog({ search, category, onCategories }: ProductCatalogProps) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Evita re-fetch por causa de identity changes do callback
  const onCategoriesRef = useRef<ProductCatalogProps["onCategories"]>(onCategories);
  onCategoriesRef.current = onCategories;

  useEffect(() => {
    let mounted = true;
    let timeout: number | undefined;

    const run = async () => {
      // Não limpamos itens aqui para evitar "piscar"
      setLoading(true);
      setError(null);

      // Watchdog: evita ficar preso em "Carregando..." caso a requisição trave
      timeout = window.setTimeout(() => {
        if (!mounted) return;
        setError("Tempo excedido ao carregar o catálogo. Tente recarregar a página.");
        setLoading(false);
      }, 12000);

      try {
        const { data, error } = await supabase
          .from("products")
          .select("id,name,category,item_type,price,images,is_active,sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true })
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (!mounted) return;

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        const safe = (data ?? []) as CatalogItem[];
        setItems(safe);
        setLoading(false);

        const cats = Array.from(
          new Set(
            safe
              .map((x) => (x.category ?? "").trim())
              .filter(Boolean)
              .sort((a, b) => a.localeCompare(b, "pt-BR")),
          ),
        );
        onCategoriesRef.current?.(cats);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Erro inesperado ao carregar o catálogo.");
        setLoading(false);
      } finally {
        if (timeout) window.clearTimeout(timeout);
      }
    };

    run();

    return () => {
      mounted = false;
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((x) => {
      const matchCategory = category === "all" ? true : x.category?.toLowerCase() === category.toLowerCase();
      const matchSearch = !q ? true : x.name?.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [items, search, category]);

  // Primeiro carregamento sem dados ainda
  if (loading && items.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground">
        Carregando catálogo…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
        <p className="font-medium">Não foi possível carregar o catálogo.</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Nenhum produto encontrado
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-xs text-muted-foreground">Atualizando catálogo…</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const imgs = normalizeImages(item.images);
          const cover = imgs[0]?.url ?? null;
          const coverAlt = imgs[0]?.alt ?? item.name;

          return (
            <Card key={item.id} className="overflow-hidden shadow-sm">
              <a href={`/produto/${item.id}`} className="block" aria-label={`Ver detalhes de ${item.name}`}>
                {cover ? (
                  <img
                    src={cover}
                    alt={coverAlt}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-muted text-xs text-muted-foreground">
                    Sem imagem
                  </div>
                )}
              </a>

              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  <a href={`/produto/${item.id}`} className="hover:underline">
                    {item.name}
                  </a>
                </CardTitle>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">{item.item_type === "service" ? "Serviço" : "Produto"}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {item.price == null ? "Sob consulta" : formatPriceBRL(item.price)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
