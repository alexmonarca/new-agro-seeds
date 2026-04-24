import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ProductImage = {
  url: string;
  path: string;
  alt?: string;
};

type FavoriteRow = {
  id: number;
  product_id: number;
  created_at: string | null;
  products: {
    id: number;
    name: string;
    category: string | null;
    item_type: "product" | "service";
    price: number | null;
    images: ProductImage[] | null;
  } | null;
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

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) {
        navigate("/login");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("favorites")
          .select(
            "id,product_id,created_at,products(id,name,category,item_type,price,images)",
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!mounted) return;
        if (error) throw error;

        const rows = (data ?? []) as any[];
        const normalized = rows.map(
          (row) =>
            ({
              id: row.id,
              product_id: row.product_id,
              created_at: row.created_at,
              products: row.products
                ? {
                    ...row.products,
                    images: normalizeImages(row.products.images),
                  }
                : null,
            }) as FavoriteRow,
        );

        setFavorites(normalized.filter((x) => !!x.products));
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Não foi possível carregar seus favoritos.");
        setLoading(false);
      }
    };

    void run();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Voltar
            </Button>
            <Link to="/" className="text-sm font-medium text-foreground hover:underline">
              Loja
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8 sm:px-8 lg:px-12">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Meus Favoritos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Produtos que você marcou para consultar depois.</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
                <Skeleton className="aspect-[4/3] w-full" />
                <div className="space-y-2 p-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Não foi possível carregar seus favoritos</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : favorites.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
            Você ainda não favoritou nenhum produto.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((fav) => {
              const item = fav.products;
              if (!item) return null;

              const cover = item.images?.[0]?.url ?? null;
              const coverAlt = item.images?.[0]?.alt ?? item.name;

              return (
                <Card key={fav.id} className="overflow-hidden shadow-sm">
                  <Link to={`/produto/${item.id}`} className="block" aria-label={`Ver detalhes de ${item.name}`}>
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
                  </Link>

                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      <Link to={`/produto/${item.id}`} className="hover:underline">
                        {item.name}
                      </Link>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{item.category ?? "Sem categoria"}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {item.item_type === "service" ? "Serviço" : "Produto"}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {item.price == null ? "Sob consulta" : formatPriceBRL(item.price)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}