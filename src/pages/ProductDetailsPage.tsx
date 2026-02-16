import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import SiteFooter from "@/components/layout/SiteFooter";

type ProductImage = {
  url: string;
  path: string;
  alt?: string;
};

type ProductRow = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  item_type: "product" | "service";
  price: number | null;
  images: ProductImage[] | null;
  is_active: boolean;
};

function formatPriceBRL(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(price);
}

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

export default function ProductDetailsPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const productId = useMemo(() => {
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  }, [id]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<ProductRow | null>(null);

  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);
  const [related, setRelated] = useState<ProductRow[]>([]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (productId == null) {
        setLoading(false);
        setError("Produto inválido.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("products")
          .select("id,name,description,category,item_type,price,images,is_active")
          .eq("id", productId)
          .maybeSingle();

        if (!mounted) return;

        if (error) throw error;
        if (!data) {
          setProduct(null);
          setError("Produto não encontrado.");
          setLoading(false);
          return;
        }

        const normalized: ProductRow = {
          ...(data as any),
          images: normalizeImages((data as any).images),
          is_active: (data as any).is_active ?? true,
        };

        setProduct(normalized);
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message ?? "Não foi possível carregar o produto.");
        setLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [productId]);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (productId == null) return;

      setRelatedLoading(true);
      setRelatedError(null);

      try {
        const { data, error } = await supabase
          .from("products")
          .select("id,name,description,category,item_type,price,images,is_active")
          .eq("is_active", true)
          .neq("id", productId)
          .order("name", { ascending: true })
          .limit(6);

        if (!mounted) return;
        if (error) throw error;

        const rows = (data ?? []) as any[];
        const normalized = rows.map(
          (row) =>
            ({
              ...(row as any),
              images: normalizeImages((row as any).images),
              is_active: (row as any).is_active ?? true,
            }) as ProductRow,
        );

        setRelated(normalized);
        setRelatedLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setRelatedError(e?.message ?? "Não foi possível carregar outros produtos.");
        setRelatedLoading(false);
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [productId]);

  const heroImage = product?.images?.[0]?.url ?? null;
  const heroAlt = product?.images?.[0]?.alt ?? product?.name ?? "Imagem do produto";

  const hasRelatedSection = !loading && !error && !!product;

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

          <Button asChild variant="ghost">
            <Link to="/admin">Painel admin</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-10 px-6 py-8 sm:px-8 lg:px-12">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Não foi possível abrir o produto</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">{error}</p>
              <div className="mt-4">
                <Button onClick={() => navigate("/")}>Voltar para o catálogo</Button>
              </div>
            </CardContent>
          </Card>
        ) : !product ? null : (
          <section className="grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={heroAlt}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-muted text-sm text-muted-foreground">
                  Sem imagem
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{product.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {product.category ?? "Sem categoria"} • {product.item_type === "service" ? "Serviço" : "Produto"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm text-muted-foreground">Preço</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {product.price == null ? "Sob consulta" : formatPriceBRL(product.price)}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">Descrição</p>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {product.description?.trim() ? product.description : "(Sem descrição cadastrada ainda)"}
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // UI-only
                    alert("(Visualização) Favoritar será implementado depois.");
                  }}
                >
                  Favoritar
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    // UI-only
                    alert("(Visualização) Comprar/Pagamento (PagBank) será implementado depois.");
                  }}
                >
                  Comprar
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Nota: esta tela é apenas para visualização; favoritos e pagamentos serão integrados depois.
              </p>
            </div>
          </section>
        )}

        {hasRelatedSection ? (
          <section aria-label="Outros produtos" className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">Outros produtos da loja</h2>
                <p className="mt-1 text-sm text-muted-foreground">Veja mais itens disponíveis no catálogo.</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/">Ver catálogo</Link>
              </Button>
            </div>

            {relatedLoading ? (
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
            ) : relatedError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground">
                <p className="font-medium">Não foi possível carregar outros produtos.</p>
                <p className="mt-1 text-xs text-muted-foreground">{relatedError}</p>
              </div>
            ) : related.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Sem outros produtos para mostrar agora.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => {
                  const cover = item.images?.[0]?.url ?? null;
                  const coverAlt = item.images?.[0]?.alt ?? item.name;

                  return (
                    <Card key={item.id} className="overflow-hidden shadow-sm">
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
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
