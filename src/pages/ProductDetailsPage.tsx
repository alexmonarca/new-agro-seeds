import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

  const heroImage = product?.images?.[0]?.url ?? null;
  const heroAlt = product?.images?.[0]?.alt ?? product?.name ?? "Imagem do produto";

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

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8 sm:px-8 lg:px-12">
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
      </main>
    </div>
  );
}
