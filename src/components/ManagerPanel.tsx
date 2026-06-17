import React, { useState, useEffect } from "react";
import { Product, StoreSettings } from "../types";
import {
  Crosshair,
  ShieldAlert,
  Save,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  PlusCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Image,
  Tag,
  FileText,
  DollarSign,
  Undo2,
  Briefcase,
  Layers,
  ChevronLeft,
  Lock,
  Plus,
  LogOut
} from "lucide-react";

interface ManagerPanelProps {
  products: Product[];
  categories: string[];
  settings: StoreSettings | null;
  onRefreshData: () => Promise<void>;
  onRefreshSettings: () => Promise<void>;
  onClose: () => void;
}

export const ManagerPanel: React.FC<ManagerPanelProps> = ({
  products,
  categories,
  settings,
  onRefreshData,
  onRefreshSettings,
  onClose
}) => {
  // Authentication states
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem("torn_manager_authorized") === "true";
  });
  const [userNameField, setUserNameField] = useState("");
  const [passwordField, setPasswordField] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const userTrim = userNameField.trim();
    if (
      (userTrim === "Kawan" && passwordField === "@Vzxt13wkj") ||
      (userTrim === "Luiz" && passwordField === "@RedW0rld2341")
    ) {
      setIsAuthorized(true);
      sessionStorage.setItem("torn_manager_authorized", "true");
      sessionStorage.setItem("torn_manager_user", userTrim);
    } else {
      setLoginError("Credenciais de gerente inválidas ou não autorizadas.");
    }
  };

  const handleLogout = () => {
    setIsAuthorized(false);
    sessionStorage.removeItem("torn_manager_authorized");
    sessionStorage.removeItem("torn_manager_user");
    setUserNameField("");
    setPasswordField("");
    setLoginError("");
  };

  // Store Settings state
  const [logoText, setLogoText] = useState(settings?.logoText || "TORN CARABINAS");
  const [logoSubtext, setLogoSubtext] = useState(settings?.logoSubtext || "TIRO ESPORTIVO");
  const [logoUrl, setLogoUrl] = useState(settings?.logoUrl || "");

  // Products state (local copy for easy live filters)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form edit states (for selected product or new product)
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Form Fields
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOriginalPrice, setProdOriginalPrice] = useState(""); // new field for pre-discount tracking
  const [prodDescription, setProdDescription] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodStock, setProdStock] = useState("");
  const [prodCategory, setProdCategory] = useState("Carabinas PCP");
  const [prodBrand, setProdBrand] = useState("");
  const [prodCaliber, setProdCaliber] = useState("");
  const [prodSpeed, setProdSpeed] = useState("");
  const [prodAction, setProdAction] = useState("");
  const [prodWeight, setProdWeight] = useState("");
  const [prodFeatured, setProdFeatured] = useState(false);

  // Operations state
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [operationMsg, setOperationMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  useEffect(() => {
    if (settings) {
      setLogoText(settings.logoText);
      setLogoSubtext(settings.logoSubtext);
      setLogoUrl(settings.logoUrl);
    }
  }, [settings]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        )
      );
    }
  }, [products, searchQuery]);

  const selectProductToEdit = (p: Product) => {
    setSelectedProduct(p);
    setIsEditing(true);
    setIsCreatingNew(false);
    setOperationMsg(null);

    // populate
    setProdName(p.name);
    setProdPrice(p.price.toString());
    setProdOriginalPrice(p.originalPrice ? p.originalPrice.toString() : "");
    setProdDescription(p.description || "");
    setProdImageUrl(p.imageUrl || "");
    setProdStock(p.stock.toString());
    setProdCategory(p.category);
    setProdBrand(p.brand || "");
    setProdCaliber(p.caliber || "");
    setProdSpeed(p.speed || "");
    setProdAction(p.action || "");
    setProdWeight(p.weight || "");
    setProdFeatured(!!p.featured);
  };

  const startCreateProduct = () => {
    setSelectedProduct(null);
    setIsEditing(false);
    setIsCreatingNew(true);
    setOperationMsg(null);

    // reset keys
    setProdName("");
    setProdPrice("");
    setProdOriginalPrice("");
    setProdDescription("");
    setProdImageUrl("");
    setProdStock("10");
    setProdCategory(categories.length > 0 ? categories[0] : "Carabinas PCP");
    setProdBrand("Torn");
    setProdCaliber("5.5mm (.22)");
    setProdSpeed("305 m/s (1000 FPS)");
    setProdAction("PCP");
    setProdWeight("3.1 kg");
    setProdFeatured(false);
  };

  // Save general store settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setOperationMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoText, logoSubtext, logoUrl })
      });

      if (!res.ok) {
        throw new Error("Erro de resposta do servidor ao salvar configurações");
      }

      await onRefreshSettings();
      setOperationMsg({ type: "success", text: "Logo e cabeçalho da loja salvos e atualizados instantaneamente!" });
    } catch (err: any) {
      setOperationMsg({ type: "error", text: `Falha: ${err.message}` });
    } finally {
      setSavingSettings(false);
    }
  };

  // Create or Update products
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      setOperationMsg({ type: "error", text: "Nome e preço do produto são obrigatórios." });
      return;
    }

    setSavingProduct(true);
    setOperationMsg(null);

    const payload = {
      name: prodName,
      price: Number(prodPrice),
      originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : null,
      description: prodDescription,
      imageUrl: prodImageUrl,
      stock: Number(prodStock),
      category: prodCategory,
      brand: prodBrand,
      caliber: prodCaliber,
      speed: prodSpeed,
      action: prodAction,
      weight: prodWeight,
      featured: prodFeatured
    };

    try {
      let res;
      if (isEditing && selectedProduct) {
        // Edit Mode
        res = await fetch(`/api/manager/products/${selectedProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } else {
        // Create Mode
        res = await fetch("/api/manager/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao salvar produto");
      }

      const savedProd = await res.json();
      await onRefreshData();

      setOperationMsg({
        type: "success",
        text: isEditing 
          ? `Produto '${savedProd.name}' atualizado com absoluto sucesso!`
          : `Produto '${savedProd.name}' cadastrado e adicionado ao catálogo!`
      });

      // Reset panels
      setIsEditing(false);
      setIsCreatingNew(false);
      setSelectedProduct(null);
    } catch (err: any) {
      setOperationMsg({ type: "error", text: `Falha: ${err.message}` });
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Tem absoluta certeza que deseja remover o produto "${name}" permanentemente da loja?`)) {
      return;
    }

    setDeletingProduct(id);
    setOperationMsg(null);

    try {
      const res = await fetch(`/api/manager/products/${id}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        throw new Error("Não foi possível excluir o item do servidor");
      }

      await onRefreshData();
      setOperationMsg({ type: "success", text: `Produto '${name}' removido da loja com sucesso!` });
      
      if (selectedProduct?.id === id) {
        setIsEditing(false);
        setSelectedProduct(null);
      }
    } catch (err: any) {
      setOperationMsg({ type: "error", text: `Erro ao deletar: ${err.message}` });
    } finally {
      setDeletingProduct(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCategoryName.trim();
    if (!catName) return;

    if (categories.some(c => c.toLowerCase() === catName.toLowerCase())) {
      setOperationMsg({ type: "error", text: `A categoria "${catName}" já existe.` });
      return;
    }

    setSavingCategory(true);
    setOperationMsg(null);

    try {
      const res = await fetch("/api/manager/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao adicionar categoria");
      }

      setNewCategoryName("");
      setOperationMsg({ type: "success", text: `Categoria "${catName}" adicionada com orgulho balístico!` });
      await onRefreshData();
    } catch (err: any) {
      setOperationMsg({ type: "error", text: err.message });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (catName === "Geral" || catName === "Carabinas PCP" || catName === "Carabinas de Pressão") {
      alert("Categorias fundamentais do sistema não podem ser removidas.");
      return;
    }

    if (!window.confirm(`Tem certeza absoluta de que deseja apagar a categoria "${catName}"? Todos os produtos nela serão movidos para "Geral".`)) {
      return;
    }

    setOperationMsg(null);

    try {
      const res = await fetch(`/api/manager/categories/${encodeURIComponent(catName)}`, {
        method: "DELETE"
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao remover categoria");
      }

      setOperationMsg({ type: "success", text: `Categoria "${catName}" removida. Itens associados reagrupados em Geral.` });
      await onRefreshData();
    } catch (err: any) {
      setOperationMsg({ type: "error", text: err.message });
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 animate-fade-in" id="manager-login-screen">
        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-850 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl shadow-black/80">
          <div className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-650/10 text-red-500 border border-red-500/20 mb-2">
              <Lock size={22} className="animate-pulse" />
            </div>
            <h2 className="text-lg font-black font-display text-white uppercase tracking-wider">
              Autenticação de Gerente
            </h2>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Acesso exclusivo para gerenciamento tático da vitrine. Identifique-se com sua credencial de gerente.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/30 text-rose-400 text-xs font-mono text-center" id="login-error-msg">
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4" id="manager-form-login">
            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                Usuário do Gerente
              </label>
              <input
                type="text"
                value={userNameField}
                onChange={(e) => setUserNameField(e.target.value)}
                placeholder="Insira o nome de usuário (Ex: Kawan)"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-3.5 text-xs text-zinc-100 focus:outline-none focus:border-red-650"
                required
                id="manager-login-username"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                Chave de Acesso (Senha)
              </label>
              <input
                type="password"
                value={passwordField}
                onChange={(e) => setPasswordField(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 px-3.5 text-xs text-zinc-100 focus:outline-none focus:border-red-650 font-mono"
                required
                id="manager-login-password"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-xl transition-all shadow-lg shadow-black/50 hover:shadow-red-900/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              id="manager-login-submit"
            >
              <span>Entrar</span>
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="border-t border-zinc-850/60 pt-4 text-center">
            <button
              onClick={onClose}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono transition-colors cursor-pointer"
            >
              ← Voltar para a Loja TORN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="manager-panel-container">
      {/* Upper info band */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-850 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-red-650/15 border border-red-500/20 text-red-500 rounded text-[9.5px] font-bold uppercase tracking-wider font-mono">
              Painel de Edição Direta
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">AUTENTICADO COMO {(sessionStorage.getItem("torn_manager_user") || "GERENTE").toUpperCase()}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black font-display text-white uppercase tracking-tight">
            Gerenciador Tático da Loja
          </h2>
          <p className="text-xs text-zinc-400">
            Edite em tempo real sem precisar de rituais de login complexos. Suas alterações se refletem instantaneamente no catálogo principal.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 border border-zinc-850 bg-zinc-950 hover:text-red-400 text-xs font-bold font-mono uppercase tracking-wider rounded-xl hover:bg-red-955/10 transition-colors flex items-center gap-1.5 active:scale-95 cursor-pointer"
            id="btn-manager-logout"
            title="Sair do painel e voltar a ser visitante"
          >
            <LogOut size={13} />
            <span>Sair</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-850 bg-zinc-900/60 text-xs font-bold text-zinc-300 hover:text-white uppercase tracking-wider rounded-xl hover:bg-zinc-850 transition-colors flex items-center gap-2 active:scale-95 cursor-pointer"
            id="btn-return-store"
            title="Ver as mudanças aplicadas na loja"
          >
            <ChevronLeft size={14} />
            <span>Visualizar Loja Oficial</span>
          </button>
        </div>
      </div>

      {operationMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-start gap-2.5 font-mono text-xs ${
            operationMsg.type === "success"
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400"
              : "bg-red-950/20 border-red-500/30 text-red-400"
          }`}
          id="manager-feedback-alert"
        >
          {operationMsg.type === "success" ? (
            <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
          ) : (
            <XCircle size={15} className="mt-0.5 flex-shrink-0" />
          )}
          <span>{operationMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- LEFT HAND SECTION: EDIT LOGO & STORE CORE SETTINGS --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 space-y-4">
            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-red-400 font-mono">
                🎨 IDENTIDADE VISUAL & LOGO (TOPO ESQUERDO)
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
                Personalize os dados da marca exibidos no canto superior esquerdo da loja. Deixe a URL em branco se preferir o ícone de mira padrão.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Texto Principal da Logo
                </label>
                <input
                  type="text"
                  value={logoText}
                  onChange={(e) => setLogoText(e.target.value)}
                  placeholder="Ex: TORN CARABINAS"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  Subtexto Balístico
                </label>
                <input
                  type="text"
                  value={logoSubtext}
                  onChange={(e) => setLogoSubtext(e.target.value)}
                  placeholder="Ex: TIRO ESPORTIVO"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                  URL da Imagem da Logo (Opcional)
                </label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="Ex: https://dominio.com/logo.png"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 font-mono"
                />
                <p className="text-[9px] text-zinc-500 mt-1 leading-normal">
                  Insira um link de imagem transparente para substituir o símbolo de mira de ferro.
                </p>
              </div>

              {logoUrl && (
                <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-lg flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <img src={logoUrl} alt="Logo Preview" className="h-8 max-w-[120px] object-contain" referrerPolicy="no-referrer" />
                    <span className="text-[10px] text-zinc-500 font-mono">Visualização da Logo</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full h-10 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors shadow-lg shadow-black/40 flex items-center justify-center gap-2 cursor-pointer"
                id="btn-save-logo-config"
              >
                {savingSettings ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={14} />
                    <span>Atualizar Logo da Loja</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1">
              <ShieldAlert size={14} className="text-amber-500" />
              <span>Dica de Navegação Externa</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Guarde o link desta página (<span className="text-red-400 font-mono">/manager</span> ou adicionando o final <span className="text-red-400 font-mono">?manager=true</span>) no seu navegador para voltar e alterar seus preços e fotos sempre que quiser! Ele permanece oculto de clientes normais.
            </p>
          </div>

          {/* --- CATEGORY CMS MANAGEMENT PANEL --- */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 space-y-4 shadow-xl shadow-black/30">
            <div className="border-b border-zinc-800 pb-3 flex items-center gap-2">
              <span className="p-1.5 rounded bg-red-650/15 text-red-500">
                <Layers size={14} />
              </span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-red-400 font-mono">
                  🏷️ CATEGORIAS DA LOJA
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                  Organização tática instantânea
                </p>
              </div>
            </div>

            {/* List existing categories */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isProtected = cat === "Geral" || cat === "Carabinas PCP" || cat === "Carabinas de Pressão";
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between bg-zinc-950/60 border border-zinc-900 rounded-lg p-2 text-xs font-mono"
                  >
                    <span className="text-zinc-200 pl-1">{cat}</span>
                    {!isProtected ? (
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="text-[10px] uppercase font-bold text-red-500/80 hover:text-red-500 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                        title="Deletar categoria e transferir produtos para Geral"
                      >
                        Excluir
                      </button>
                    ) : (
                      <span className="text-[9px] text-zinc-650 uppercase tracking-wider pr-1 font-sans font-bold text-zinc-500">
                        Padrão
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form to add a new category */}
            <form onSubmit={handleAddCategory} className="pt-2 border-t border-zinc-850/60 space-y-3">
              <div>
                <label className="block text-[9px] uppercase font-mono tracking-wider text-zinc-400 mb-1">
                  Nova Categoria d/0
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Coldres, Lunetas..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-1.5 px-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 font-mono"
                  maxLength={40}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingCategory}
                className="w-full h-9 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-[10.5px] font-bold uppercase tracking-wider text-zinc-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {savingCategory ? (
                  <div className="h-3 w-3 border-2 border-zinc-300 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={13} />
                    <span>Cadastrar Categoria</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* --- RIGHT HAND SECTION: PRODUCTS CMS MANAGEMENT --- */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Editor form panel */}
          {(isEditing || isCreatingNew) ? (
            <div className="bg-zinc-900/40 border-2 border-red-650/30 rounded-2xl p-6 space-y-5 animate-scale-in">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-red-650/10 text-red-500">
                    {isEditing ? <Edit2 size={16} /> : <PlusCircle size={16} />}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-tight">
                      {isEditing ? `Editando: ${prodName}` : "Cadastrar Novo Equipamento Balístico"}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono">
                      {isEditing && selectedProduct ? `ID de Controle: ${selectedProduct.id}` : "Preencha as especificações táticas"}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreatingNew(false);
                    setSelectedProduct(null);
                  }}
                  className="p-1 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:text-white text-zinc-400 text-xs transition-colors cursor-pointer font-mono"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Product Code Names */}
                  <div className="space-y-1.5 md:col-span-1">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      Nome do Produto / Carabina
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={prodName}
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="Ex: Carabina PCP Torn Tactical Edition"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 pl-3 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650"
                        required
                        id="manager-form-prod-name"
                      />
                    </div>
                  </div>

                  {/* Pricing / Value */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      Preço Promocional / Atual (R$)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 text-zinc-500 text-xs font-bold">R$</div>
                      <input
                        type="number"
                        step="0.01"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="Ex: 4899.90"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 font-mono font-bold"
                        required
                        id="manager-form-prod-price"
                      />
                    </div>
                  </div>

                  {/* Preço Original / Sem Desconto */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      Preço Original Sem Desconto (Opcional)
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 text-zinc-500 text-xs font-bold">R$</div>
                      <input
                        type="number"
                        step="0.01"
                        value={prodOriginalPrice}
                        onChange={(e) => setProdOriginalPrice(e.target.value)}
                        placeholder="Ex: 5499.00 (Deixe em branco p/ sem desconto)"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 pl-9 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 font-mono"
                        id="manager-form-prod-original-price"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Image Url */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      Link / URL da Imagem do Produto
                    </label>
                    <div className="relative">
                      <input
                        type="url"
                        value={prodImageUrl}
                        onChange={(e) => setProdImageUrl(e.target.value)}
                        placeholder="Insira a URL direta da imagem (Unsplash, Imgur, etc)"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 pl-3 pr-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Stock Quantity */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                      Quantidade em Estoque
                    </label>
                    <input
                      type="number"
                      value={prodStock}
                      onChange={(e) => setProdStock(e.target.value)}
                      placeholder="Ex: 5"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Description info */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400">
                    Descrição Detalhada do Produto
                  </label>
                  <textarea
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Escreva sobre a precisão, autonomia de disparos, material da coronha ou outros atrativos comerciais..."
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-red-650 placeholder:text-zinc-600 line-normal"
                    required
                  />
                </div>

                {/* Advanced specifications metadata */}
                <div className="bg-zinc-950/60 p-4 border border-zinc-850 rounded-xl space-y-4">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest font-bold block">
                    Especificações Técnicas Avançadas (Opcional)
                  </span>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Categoria</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Marca</label>
                      <input
                        type="text"
                        value={prodBrand}
                        onChange={(e) => setProdBrand(e.target.value)}
                        placeholder="Ex: Artemis, Torn"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Calibre</label>
                      <input
                        type="text"
                        value={prodCaliber}
                        onChange={(e) => setProdCaliber(e.target.value)}
                        placeholder="Ex: 5.5mm (.22)"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Velocidade (FPS)</label>
                      <input
                        type="text"
                        value={prodSpeed}
                        onChange={(e) => setProdSpeed(e.target.value)}
                        placeholder="Ex: 305 m/s"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Ação</label>
                      <input
                        type="text"
                        value={prodAction}
                        onChange={(e) => setProdAction(e.target.value)}
                        placeholder="Ex: PCP, Gás Ram"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] uppercase font-mono text-zinc-500 mb-1">Peso (kg)</label>
                      <input
                        type="text"
                        value={prodWeight}
                        onChange={(e) => setProdWeight(e.target.value)}
                        placeholder="Ex: 3.2 kg"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400 select-none">
                        <input
                          type="checkbox"
                          checked={prodFeatured}
                          onChange={(e) => setProdFeatured(e.target.checked)}
                          className="rounded bg-zinc-900 accent-red-600 border-zinc-700 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                        <span>Destacar Produto na Home</span>
                      </label>
                    </div>
                  </div>
                </div>

                {prodImageUrl && (
                  <div className="p-3 bg-zinc-950 border border-zinc-850 rounded-xl space-y-1.5">
                    <span className="text-[9px] text-zinc-500 font-mono uppercase block">Pré-visualização da Imagem</span>
                    <div className="h-40 w-full overflow-hidden rounded bg-black flex items-center justify-center">
                      <img
                        src={prodImageUrl}
                        alt="Product Photo Preview"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop";
                        }}
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingProduct}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors shadow-lg shadow-black/45 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-save-product-details"
                >
                  {savingProduct ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{isEditing ? "Salvar Alterações do Produto" : "Publicar na Vitrine Oficial"}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : null}

          {/* Catalog grid */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-850 pb-4">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight font-display">
                  Catálogo Atual de Produtos ({filteredProducts.length})
                </h3>
                <p className="text-[10px] text-zinc-500">
                  Clique em um produto abaixo para editar suas imagens, descrições, preços e nomes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={startCreateProduct}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-750 text-[11px] font-bold text-white uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
                  id="btn-add-quick-product"
                >
                  <PlusCircle size={14} />
                  <span>Cadastrar Equipamento</span>
                </button>
              </div>
            </div>

            {/* Live Search Filter */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar por nome, marca ou categoria de carabina..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-lg py-2.5 px-3 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                id="manager-search-box"
              />
            </div>

            {/* List Table of Items */}
            <div className="overflow-x-auto">
              <div className="min-w-full divide-y divide-zinc-850" id="manager-products-list">
                {filteredProducts.length === 0 ? (
                  <div className="py-12 text-center">
                    <span className="text-xs text-zinc-500 font-mono">Nenhum equipamento localizado sob o termo escrito.</span>
                  </div>
                ) : (
                  filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="py-3.5 flex items-center justify-between border-b border-zinc-850/60 last:border-none gap-4 hover:bg-zinc-900/30 px-2 rounded-lg transition-colors"
                      id={`row-product-${p.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded bg-black overflow-hidden flex items-center justify-center shrink-0 border border-zinc-850">
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="h-full w-full object-contain"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop";
                            }}
                          />
                        </div>
                        <div className="space-y-0.5 text-left">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="text-xs font-bold text-white block truncate max-w-[180px] md:max-w-xs">{p.name}</span>
                            {p.featured && (
                              <span className="px-1 text-[8px] bg-red-650/15 border border-red-500/30 text-red-400 font-bold uppercase rounded font-mono">
                                Home
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <span>{p.category}</span>
                            <span>•</span>
                            <span>Qtd: {p.stock}</span>
                            <span>•</span>
                            <span className="text-red-400 font-bold truncate max-w-[100px]">{p.brand}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-red-500 font-mono text-right font-bold">
                          R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => selectProductToEdit(p)}
                            className="h-8 w-8 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-850 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Editar este produto"
                          >
                            <Edit2 size={12} />
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            disabled={deletingProduct === p.id}
                            className="h-8 w-8 rounded-lg bg-red-650/10 hover:bg-red-600 border border-red-500/20 text-red-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                            title="Deletar este produto"
                          >
                            {deletingProduct === p.id ? (
                              <div className="h-3.5 w-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
