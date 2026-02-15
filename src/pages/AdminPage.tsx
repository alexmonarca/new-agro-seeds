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

  if (roleRes.error) return null;
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
    setDraft(toDraft());
    setOpen(true);
  };

  const startEdit = (p: ProductRow) => {
    setDraft(toDraft(p));
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);

    const specs = parseJsonObject(draft.specificationsText ?? "");
    if ((draft.specificationsText ?? "").trim() && !specs) {
      setSaving(false);
      toast({ variant: "destructive", title: "JSON inválido", description: "O campo de especificações precisa ser um objeto JSON." });
      return;
    }

    const payload: any = {
      name: draft.name.trim(),
      description: (draft.description ?? "").trim() || null,
      category: (draft.category ?? "").trim() || null,
      item_type: draft.item_type,
      price: draft.price === null || draft.price === undefined || Number.isNaN(draft.price) ? null : Number(draft.price),
      stock: draft.stock === null || draft.stock === undefined || Number.isNaN(draft.stock) ? null : Number(draft.stock),
      is_active: !!draft.is_active,
      sort_order: Number.isFinite(draft.sort_order) ? Number(draft.sort_order) : 0,
      specifications: specs,
      images: draft.images ?? [],
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
        if (data?.id) setDraft((d) => ({ ...d, id: data.id }));
      }

      setOpen(false);
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
    if (!draft.id) {
      toast({ variant: "destructive", title: "Salve primeiro", description: "Crie/salve o produto antes de enviar imagens." });
      return;
    }

    const current = draft.images ?? [];
    const next: ProductImage[] = [...current];

    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "bin";
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-");
        const path = `products/${draft.id}/${crypto.randomUUID()}.${ext}-${safeName}`;

        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });
        if (upErr) throw upErr;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        if (!data?.publicUrl) throw new Error("Não foi possível obter a URL pública da imagem.");

        next.push({ url: data.publicUrl, path, alt: file.name });
      }

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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome ou categoria…" />
          <Button onClick={startCreate} className="shrink-0">Novo item</Button>
        </div>
      </header>

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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span className="sr-only">Abrir editor</span>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Editar item" : "Novo item"}</DialogTitle>
            <DialogDescription>Preencha os campos e salve. Para enviar fotos, salve o item primeiro.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome</label>
              <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Input value={draft.category ?? ""} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))} />
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
                <label className="text-sm font-medium">Estoque</label>
                <Input
                  type="number"
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

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Fotos</label>
              <Input type="file" accept="image/*" multiple onChange={(e) => uploadImages(e.target.files)} />

              {(draft.images?.length ?? 0) > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {draft.images!.map((img) => (
                    <div key={img.path} className="rounded-md border border-border p-2">
                      <img src={img.url} alt={img.alt || draft.name} className="h-24 w-full rounded object-cover" loading="lazy" />
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
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma foto ainda.</p>
              )}
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
