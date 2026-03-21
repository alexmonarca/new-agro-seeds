import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ProductImage = {
  url: string;
  path: string;
  alt?: string;
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  alt?: string;
};

type ProductRow = {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  price: number | null;
  stock: number | null;
  images: ProductImage[] | null;
  specifications: Record<string, unknown> | null;
  is_active: boolean;
  sort_order: number;
  item_type: "product" | "service";
  created_at: string;
  updated_at: string;
};

type ProductDraft = Omit<
  ProductRow,
  "id" | "created_at" | "updated_at" | "images" | "specifications"
> & {
  id?: number;
  images?: ProductImage[];
  specificationsText?: string;
  productCode?: string;
};

const BUCKET = "product-images";

function parseJsonObject(input: string): Record<string, unknown> | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function formatPriceBRL(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(price);
}

async function ensureAuthedAndAdmin(): Promise<{ userId: string } | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  if (!data.user) return null;

  // Server-side truth: RPC "has_role" (security definer) + RLS
  const roleRes = await supabase.rpc("has_role", {
    _user_id: data.user.id,
    _role: "admin",
  });

  if (roleRes.error) {
    // Ajuda a diagnosticar rapidamente quando a função/RLS não estiverem como esperado
    console.error("RPC has_role falhou:", roleRes.error);
    return null;
  }

  if (!roleRes.data) return null;

  return { userId: data.user.id };
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

function readProductCode(specifications: Record<string, unknown> | null | undefined): string {
  if (!specifications || typeof specifications !== "object") return "";
  const fromSnake = specifications.product_code;
  if (typeof fromSnake === "string") return fromSnake;
  const fromLabel = specifications["Cód. produto"];
  if (typeof fromLabel === "string") return fromLabel;
  return "";
}

function mergeProductCodeInSpecifications(
  specifications: Record<string, unknown> | null,
  productCode: string,
): Record<string, unknown> | null {
  const base = specifications && typeof specifications === "object" ? { ...specifications } : {};
  const trimmedCode = productCode.trim();

  if (trimmedCode) {
    base.product_code = trimmedCode;
  } else {
    delete base.product_code;
    delete base["Cód. produto"];
  }

  return Object.keys(base).length > 0 ? base : null;
}

function toDraft(p?: ProductRow): ProductDraft {
  if (!p) {
    return {
      name: "",
      description: "",
      category: "",
      price: null,
      stock: 0,
      is_active: true,
      sort_order: 0,
      item_type: "product",
      images: [],
      specificationsText: "{}",
      productCode: "",
    };
  }

  return {
    id: p.id,
    name: p.name ?? "",
    description: p.description ?? "",
    category: p.category ?? "",
    price: p.price,
    stock: p.stock ?? 0,
    is_active: !!p.is_active,
    sort_order: Number.isFinite(p.sort_order) ? p.sort_order : 0,
    item_type: p.item_type ?? "product",
    images: normalizeImages(p.images),
    specificationsText: JSON.stringify(p.specifications ?? {}, null, 2),
    productCode: readProductCode(p.specifications),
  };
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>(() => toDraft());
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);

  const revokePendingPreviews = () => {
    setPendingImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return [];
    });
  };

  const normalizePersistedImages = (images?: ProductImage[]) =>
    (images ?? []).filter((img) => !img.path.startsWith("local-"));

  const categoryOptions = useMemo(() => {
    const all = [...rows.map((r) => (r.category ?? "").trim()), ...customCategories, (draft.category ?? "").trim()]
      .filter(Boolean);
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [rows, customCategories, draft.category]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((r) => (r.name ?? "").toLowerCase().includes(query) || (r.category ?? "").toLowerCase().includes(query));
  }, [rows, q]);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,description,category,price,stock,images,specifications,created_at,updated_at,item_type,is_active,sort_order",
      )
      .order("sort_order", { ascending: true })
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      setLoading(false);
      toast({ variant: "destructive", title: "Erro ao carregar produtos", description: error.message });
      return;
    }

    const safe = (data ?? []) as any[];
    const normalized: ProductRow[] = safe.map((r) => ({
      ...r,
      is_active: r.is_active ?? true,
      sort_order: r.sort_order ?? 0,
      images: normalizeImages(r.images),
      specifications: r.specifications ?? null,
    }));

    setRows(normalized);
    setLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setChecking(true);
      const ok = await ensureAuthedAndAdmin();
      if (!mounted) return;

      if (!ok) {
        toast({ variant: "destructive", title: "Acesso negado", description: "Faça login com um usuário administrador." });
        navigate("/login");
        return;
      }

      setChecking(false);
      await load();
    };

    run();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCreate = () => {
    revokePendingPreviews();
    setDraft(toDraft());
    setOpen(true);
  };

  const startEdit = (p: ProductRow) => {
    revokePendingPreviews();
    setDraft(toDraft(p));
    setOpen(true);
  };

  const uploadFilesToBucket = async (productId: number, files: File[]) => {
    const uploaded: ProductImage[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() || "bin";
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
      const path = `products/${productId}/${crypto.randomUUID()}.${ext}-${safeName}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      if (!data?.publicUrl) throw new Error("Não foi possível obter a URL pública da imagem.");

      uploaded.push({ url: data.publicUrl, path, alt: file.name });
    }

    return uploaded;
  };

  const save = async () => {
    setSaving(true);

    const specs = parseJsonObject(draft.specificationsText ?? "");
    if ((draft.specificationsText ?? "").trim() && !specs) {
      setSaving(false);
      toast({ variant: "destructive", title: "JSON inválido", description: "O campo de especificações precisa ser um objeto JSON." });
      return;
    }

    const mergedSpecs = mergeProductCodeInSpecifications(specs, draft.productCode ?? "");
    const persistedImages = normalizePersistedImages(draft.images);

    const payload: any = {
      name: draft.name.trim(),
      description: (draft.description ?? "").trim() || null,
      category: (draft.category ?? "").trim() || null,
      item_type: draft.item_type,
      price: draft.price === null || draft.price === undefined || Number.isNaN(draft.price) ? null : Number(draft.price),
      stock: draft.stock === null || draft.stock === undefined || Number.isNaN(draft.stock) ? null : Number(draft.stock),
      is_active: !!draft.is_active,
      sort_order: Number.isFinite(draft.sort_order) ? Number(draft.sort_order) : 0,
      specifications: mergedSpecs,
      images: persistedImages,
    };

    try {
      if (draft.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", draft.id);
        if (error) throw error;
        toast({ title: "Produto atualizado" });
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        toast({ title: "Produto criado" });

        if (data?.id && pendingImages.length > 0) {
          const uploaded = await uploadFilesToBucket(
            data.id,
            pendingImages.map((img) => img.file),
          );
          const finalImages = [...persistedImages, ...uploaded];
          const { error: updateImagesError } = await supabase
            .from("products")
            .update({ images: finalImages })
            .eq("id", data.id);
          if (updateImagesError) throw updateImagesError;
        }

        if (data?.id) setDraft((d) => ({ ...d, id: data.id }));
      }

      setOpen(false);
      revokePendingPreviews();
      await load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: e?.message ?? "Não foi possível salvar." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: ProductRow) => {
    const ok = window.confirm(`Excluir "${p.name}"?`);
    if (!ok) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", p.id);
      if (error) throw error;
      toast({ title: "Produto excluído" });
      await load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: e?.message ?? "Não foi possível excluir." });
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const selectedFiles = Array.from(files);

    if (!draft.id) {
      const localImages: ProductImage[] = selectedFiles.map((file) => {
        const id = `local-${crypto.randomUUID()}`;
        const previewUrl = URL.createObjectURL(file);

        setPendingImages((prev) => [...prev, { id, file, previewUrl, alt: file.name }]);

        return { url: previewUrl, path: id, alt: file.name };
      });

      setDraft((d) => ({ ...d, images: [...(d.images ?? []), ...localImages] }));
      toast({ title: "Pré-visualização pronta", description: "As imagens serão enviadas quando você salvar o novo produto." });
      return;
    }

    const current = draft.images ?? [];
    const next: ProductImage[] = [...current];

    try {
      const uploaded = await uploadFilesToBucket(draft.id, selectedFiles);
      next.push(...uploaded);

      setDraft((d) => ({ ...d, images: next }));
      const { error } = await supabase.from("products").update({ images: next }).eq("id", draft.id);
      if (error) throw error;

      toast({ title: "Imagens enviadas" });
      await load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro no upload", description: e?.message ?? "Não foi possível enviar." });
    }
  };

  const deleteImage = async (img: ProductImage) => {
    if (img.path.startsWith("local-")) {
      setPendingImages((prev) => {
        const target = prev.find((x) => x.id === img.path);
        if (target) URL.revokeObjectURL(target.previewUrl);
        return prev.filter((x) => x.id !== img.path);
      });
      setDraft((d) => ({ ...d, images: (d.images ?? []).filter((x) => x.path !== img.path) }));
      toast({ title: "Imagem removida" });
      return;
    }

    if (!draft.id) return;

    try {
      const remaining = (draft.images ?? []).filter((x) => x.path !== img.path);

      // Remove from bucket (requires admin policy)
      const { error: rmErr } = await supabase.storage.from(BUCKET).remove([img.path]);
      if (rmErr) throw rmErr;

      const { error } = await supabase.from("products").update({ images: remaining }).eq("id", draft.id);
      if (error) throw error;

      setDraft((d) => ({ ...d, images: remaining }));
      toast({ title: "Imagem removida" });
      await load();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro ao remover imagem", description: e?.message ?? "Não foi possível remover." });
    }
  };

  if (checking) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-muted-foreground sm:px-8 lg:px-12">
        Verificando acesso…
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10 sm:px-8 lg:px-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Painel administrador</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie produtos/serviços, fotos e especificações.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline" onClick={() => navigate("/")}
            className="shrink-0"
          >
            Voltar para a loja
          </Button>
        </div>
      </header>

      <Tabs defaultValue="itens" className="w-full">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="itens">Itens</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
            <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
            <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          </TabsList>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou categoria…" />
            <Button onClick={startCreate} className="shrink-0">Novo item</Button>
          </div>
        </div>

        <TabsContent value="itens" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Itens cadastrados</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="py-6 text-sm text-muted-foreground">Carregando…</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.category ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.item_type === "service" ? "Serviço" : "Produto"}</TableCell>
                        <TableCell>{p.price == null ? "Sob consulta" : formatPriceBRL(p.price)}</TableCell>
                        <TableCell>
                          <span className={p.is_active ? "text-foreground" : "text-muted-foreground"}>
                            {p.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell>{p.sort_order}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                              Editar
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => remove(p)}>
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Placeholder: aqui vão as configurações de pagamento (ex: PagBank/PagSeguro) quando formos integrar.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Placeholder: relatórios de visitas e vendas (quando tivermos tracking + tabela de pedidos).
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Placeholder: listagem de usuários e status de compra/favoritos (depende de tabelas de orders/favorites).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) revokePendingPreviews();
        }}
      >
        <DialogTrigger asChild>
          <span className="sr-only">Abrir editor</span>
        </DialogTrigger>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar item" : "Novo item"}</DialogTitle>
            <DialogDescription>Preencha os campos e salve. Para enviar fotos, salve o item primeiro.</DialogDescription>
          </DialogHeader>

          <div className="grid max-h-[calc(92vh-190px)] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Fotos</label>
              <Input type="file" accept="image/*" multiple onChange={(e) => uploadImages(e.target.files)} />

              {(draft.images?.length ?? 0) > 0 ? (
                <>
                  <div className="overflow-hidden rounded-md border border-border">
                    <img
                      src={draft.images?.[0]?.url}
                      alt={draft.images?.[0]?.alt || draft.name || "Imagem principal"}
                      className="h-52 w-full object-cover md:h-64"
                      loading="lazy"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {draft.images!.map((img) => (
                      <div key={img.path} className="rounded-md border border-border p-2">
                        <img src={img.url} alt={img.alt || draft.name} className="h-20 w-full rounded object-cover" loading="lazy" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => deleteImage(img)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma foto ainda.</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={(draft.category ?? "").trim()}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              >
                <option value="">Selecione uma categoria</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Adicionar/editar nome da categoria"
                  value={draft.category ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const value = (draft.category ?? "").trim();
                    if (!value) return;
                    setCustomCategories((prev) => (prev.includes(value) ? prev : [...prev, value]));
                  }}
                >
                  Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Escolha no dropdown ou digite para criar/editar uma categoria.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={draft.item_type}
                onChange={(e) => setDraft((d) => ({ ...d, item_type: e.target.value as any }))}
              >
                <option value="product">Produto</option>
                <option value="service">Serviço</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={draft.price ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value === "" ? null : Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantidade / unidades</label>
                <Input
                  type="number"
                  min="0"
                  value={draft.stock ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, stock: e.target.value === "" ? null : Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={draft.is_active ? "active" : "inactive"}
                  onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.value === "active" }))}
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Ordem</label>
                <Input
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft((d) => ({ ...d, sort_order: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cód. produto</label>
              <Input
                value={draft.productCode ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, productCode: e.target.value }))}
                placeholder="Ex.: TR-001"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={draft.description ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Especificações (JSON)</label>
              <Textarea
                value={draft.specificationsText ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, specificationsText: e.target.value }))}
                rows={6}
                placeholder='{"type":"..."}'
              />
              <p className="text-xs text-muted-foreground">Formato: objeto JSON (não array).</p>
            </div>

          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={save} disabled={saving || !draft.name.trim()}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
