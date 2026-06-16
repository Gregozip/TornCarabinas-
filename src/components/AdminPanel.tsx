import React, { useState, useEffect } from "react";
import { Product, BlogPost } from "../types";
import {
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  Package,
  AlertTriangle,
  FileText,
  Save,
  CheckCircle,
  X,
  Sparkles,
  DollarSign,
  FolderOpen,
  History,
  Shield,
  Upload,
  Bold,
  Italic,
  Heading,
  List,
  Code2
} from "lucide-react";

interface AdminPanelProps {
  products: Product[];
  blogPosts: BlogPost[];
  onRefreshData: () => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  products,
  blogPosts,
  onRefreshData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isStep2FA, setIsStep2FA] = useState(false);
  const [code2FA, setCode2FA] = useState("");
  const [token, setToken] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"catalog" | "categories" | "blog" | "audit" | "settings">("catalog");
  
  // Custom rotating authenticator simulation parameters
  const [authenticatorCode, setAuthenticatorCode] = useState("489301");
  const [timeRemaining, setTimeRemaining] = useState(30);

  // Dynamic CMS Category lists & Audit logs
  const [categories, setCategories] = useState<string[]>([
    "Carabinas PCP",
    "Carabinas de Pressão",
    "Pistolas CO2",
    "Acessórios e Ópticas",
    "Munições e Chumbinhos",
    "Alvos e Estande"
  ]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Inline editing states for products (prices & stocks)
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [editingStocks, setEditingStocks] = useState<Record<string, number>>({});
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});
  const [successItems, setSuccessItems] = useState<Record<string, boolean>>({});
  const [showQuickEdit, setShowQuickEdit] = useState(false);

  // Form states for adding new product
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "",
    category: "Carabinas PCP",
    price: "",
    stock: "",
    imageUrl: "",
    caliber: "5.5mm (.22)",
    speed: "",
    action: "PCP",
    weight: "",
    description: "",
    featured: false,
  });

  // Form states for adding new blog post
  const [showBlogForm, setShowBlogForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    category: "Novidades",
    excerpt: "",
    content: "",
    author: "Administrador",
    imageUrl: "",
    readTime: "4 min de leitura",
    scheduledDate: "", // publication scheduling support
  });

  const [formStatus, setFormStatus] = useState({ type: "", message: "" });

  // Generate Rotating Authenticator TOTP token every 30 seconds
  useEffect(() => {
    const generateCode = () => {
      const now = new Date();
      const interval = Math.floor(now.getTime() / 30000); 
      const codeVal = (interval * 317) % 900000 + 100000;
      setAuthenticatorCode(codeVal.toString());
      setTimeRemaining(30 - (Math.floor(now.getTime() / 1000) % 30));
    };

    generateCode();
    const intervalTimer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          generateCode();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, []);

  // Reset error when typing
  useEffect(() => {
    if (usernameInput || passwordInput || code2FA) setErrorMessage("");
  }, [usernameInput, passwordInput, code2FA]);

  // Read saved session token in browser
  useEffect(() => {
    const savedToken = sessionStorage.getItem("admin_session_token");
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch admin resources when authenticated
  const fetchAdminCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Erro can't load categories", err);
    }
  };

  const fetchAuditLogs = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/audit-logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch (err) {
      console.error("Erro can't load audits", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAdminCategories();
      fetchAuditLogs();
    }
  }, [isAuthenticated, token]);

  // Handle Authentication Step 1: Validate Credentials
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.step2FA) {
          setIsStep2FA(true); // Advanced 2-step security verification!
        } else {
          setToken(data.token);
          sessionStorage.setItem("admin_session_token", data.token);
          setIsAuthenticated(true);
        }
      } else {
        setErrorMessage(data.error || "Acesso negado. Credenciais comerciais incorretas.");
      }
    } catch (err) {
      setErrorMessage("Erro ao conectar ao servidor de segurança.");
    }
  };

  // Handle Authentication Step 2: Validate 2FA Secure Code
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const res = await fetch("/api/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput, code2FA: code2FA.replace(/\s/g, "") }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setToken(data.token);
        sessionStorage.setItem("admin_session_token", data.token);
        setIsAuthenticated(true);
        setIsStep2FA(false);
      } else {
        setErrorMessage(data.error || "Token de dois fatores incorreto ou expirado.");
      }
    } catch (err) {
      setErrorMessage("Erro de comunicação de criptografia.");
    }
  };

  // Disconnect admin session
  const handleLogout = () => {
    sessionStorage.removeItem("admin_session_token");
    setToken("");
    setIsAuthenticated(false);
    setIsStep2FA(false);
    setUsernameInput("");
    setPasswordInput("");
    setCode2FA("");
  };

  // Manage Categories: Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
        setNewCategoryName("");
        await onRefreshData();
        await fetchAuditLogs();
        alert("Nova categoria de tiro cadastrada com sucesso!");
      } else {
        const errData = await res.json();
        alert(errData.error || "Falha ao adicionar categoria.");
      }
    } catch (err) {
      alert("Falha de rede.");
    }
  };

  // Manage Categories: Delete Category
  const handleDeleteCategory = async (catName: string) => {
    if (!confirm(`Confirma a exclusão da categoria '${catName}'? Os equipamentos associados terão a categoria redefinida para 'Geral'.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(catName)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
        await onRefreshData();
        await fetchAuditLogs();
        alert("Categoria removida com sucesso.");
      } else {
        const errData = await res.json();
        alert(errData.error || "Incapaz de excluir categoria.");
      }
    } catch (err) {
      alert("Erro ao remover.");
    }
  };

  // Blog text insertion helper for Markdown editing
  const handleInsertText = (formatting: string) => {
    const textarea = document.getElementById("blog-textarea") as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let replacement = "";
    switch (formatting) {
      case "bold":
        replacement = `**${selectedText || "texto em negrito"}**`;
        break;
      case "italic":
        replacement = `*${selectedText || "texto em itálico"}*`;
        break;
      case "h3":
        replacement = `### ${selectedText || "Insira Subtítulo"}`;
        break;
      case "list":
        replacement = `\n* ${selectedText || "Tópico técnico"}`;
        break;
      case "code":
        replacement = `\`${selectedText || "v = 290 m/s"}\``;
        break;
      default:
        return;
    }
    
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    setNewPost({ ...newPost, content: newValue });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 2, start + 2 + (selectedText ? selectedText.length : 12));
    }, 50);
  };

  // Handle Dynamic Stock/Price Update (Dynamic and secure as requested)
  const handleUpdatePriceOrStock = async (productId: string) => {
    const updatedPrice = editingPrices[productId];
    const updatedStock = editingStocks[productId];

    if (updatedPrice === undefined && updatedStock === undefined) {
      return; // nothing changed
    }

    setLoadingItems((prev) => ({ ...prev, [productId]: true }));
    const updates: Record<string, any> = {};
    if (updatedPrice !== undefined) updates.price = Number(updatedPrice);
    if (updatedStock !== undefined) updates.stock = Number(updatedStock);

    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        await onRefreshData();
        await fetchAuditLogs();
        setSuccessItems((prev) => ({ ...prev, [productId]: true }));
        setTimeout(() => {
          setSuccessItems((prev) => ({ ...prev, [productId]: false }));
        }, 2000);
      } else {
        const errData = await res.json();
        alert(`Erro de Atualização: ${errData.error || "Operação não autorizada"}`);
      }
    } catch (err) {
      alert("Falha de rede ao tentar atualizar estoque.");
    } finally {
      setLoadingItems((prev) => ({ ...prev, [productId]: false }));
    }
  };

  // Handle Product Deletion
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir permanentemente o produto: "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await onRefreshData();
        await fetchAuditLogs();
      } else {
        alert("Erro ao excluir produto. Verifique suas credenciais.");
      }
    } catch (err) {
      alert("Erro ao enviar comando de exclusão.");
    }
  };

  // Create Product Form Submit
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProduct),
      });

      if (res.ok) {
        await onRefreshData();
        await fetchAuditLogs();
        setFormStatus({ type: "success", message: "Produto cadastrado com absoluto sucesso!" });
        setNewProduct({
          name: "",
          brand: "",
          category: categories[0] || "Carabinas PCP",
          price: "",
          stock: "",
          imageUrl: "",
          caliber: "5.5mm (.22)",
          speed: "",
          action: "PCP",
          weight: "",
          description: "",
          featured: false,
        });
        setTimeout(() => setShowProductForm(false), 1500);
      } else {
        const errorData = await res.json();
        setFormStatus({ type: "error", message: errorData.error || "Falha ao cadastrar." });
      }
    } catch (err) {
      setFormStatus({ type: "error", message: "Erro de comunicação." });
    }
  };

  // Create Blog Post Submit
  const handleCreateBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newPost),
      });

      if (res.ok) {
        await onRefreshData();
        await fetchAuditLogs();
        setFormStatus({ type: "success", message: "Artigo publicado no blog com sucesso!" });
        setNewPost({
          title: "",
          category: "Novidades",
          excerpt: "",
          content: "",
          author: "Administrador",
          imageUrl: "",
          readTime: "4 min de leitura",
          scheduledDate: "",
        });
        setTimeout(() => setShowBlogForm(false), 1500);
      } else {
        const errorData = await res.json();
        setFormStatus({ type: "error", message: errorData.error || "Falha ao publicar." });
      }
    } catch (err) {
      setFormStatus({ type: "error", message: "Erro de comunicação." });
    }
  };

  // Delete Blog Post
  const handleDeleteBlogPost = async (id: string, title: string) => {
    if (!confirm(`Quer mesmo excluir o artigo: "${title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await onRefreshData();
        await fetchAuditLogs();
      } else {
        alert("Falha ao deletar artigo.");
      }
    } catch (err) {
      alert("Falha de comunicação.");
    }
  };

  // Analytics helper calculations
  const totalStockValue = products.reduce((acc, curr) => acc + curr.price * curr.stock, 0);
  const lowStockCount = products.filter((p) => p.stock <= 2).length;

  // --- RENDERING IF NOT AUTHENTICATED ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-zinc-900/60 p-8 rounded-xl border border-zinc-800 shadow-2xl relative">
          <div className="absolute top-0 right-0 h-40 w-40 bg-orange-500/5 blur-3xl rounded-full" />
          
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 mb-4 animate-pulse">
              <Shield size={22} />
            </div>
            <h2 className="text-xl font-bold text-white font-display uppercase tracking-widest leading-none">
              Portal Restrito Torn Carabinas
            </h2>
            <p className="mt-2 text-[11px] text-zinc-400 font-sans max-w-sm mx-auto">
              Sincronização dinâmica de estoques, preços e controle editorial com criptografia de ponta.
            </p>
          </div>

          {!isStep2FA ? (
            /* PASSO 1: Credenciais */
            <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              <div className="rounded space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 font-mono uppercase tracking-widest mb-1.5">
                    Nome de Operador (Usuário)
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Ex: KawanH"
                    className="appearance-none rounded relative block w-full px-3 py-2.5 border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-orange-500 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 font-mono uppercase tracking-widest mb-1.5">
                    Senha Secreta
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="appearance-none rounded relative block w-full px-3 py-2.5 border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-orange-500 text-sm font-mono"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="rounded bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-400 text-center font-mono">
                  {errorMessage}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="group relative w-full h-11 flex justify-center items-center py-2.5 px-4 font-mono text-xs font-bold uppercase tracking-widest rounded text-black bg-orange-500 hover:bg-orange-600 transition-all duration-200 cursor-pointer shadow-lg shadow-orange-950/20 active:translate-y-px"
                >
                  <Lock size={12} className="mr-1.5" />
                  <span>Autenticar e Avançar</span>
                </button>
              </div>
            </form>
          ) : (
            /* PASSO 2: Autenticação de Dois Fatores (2FA) */
            <form className="mt-8 space-y-6" onSubmit={handleVerify2FA}>
              <div className="rounded space-y-4">
                <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-orange-400 animate-ping" /> Dispositivo 2FA Conectado
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">Toca em: {timeRemaining}s</span>
                  </div>
                  
                  <div className="text-center py-1">
                    <div className="text-2xl font-black font-mono tracking-widest text-orange-400 select-all">
                      {authenticatorCode.slice(0, 3)} {authenticatorCode.slice(3)}
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5 block">Simulação de Código OTP no App Corporal</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-450 font-mono uppercase tracking-widest mb-1.5">
                    Digite o código de 6 dígitos acima
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={7}
                    pattern="[0-9]*"
                    value={code2FA}
                    onChange={(e) => setCode2FA(e.target.value)}
                    placeholder="000 000"
                    className="appearance-none rounded relative block w-full px-3 py-2.5 border border-zinc-805 bg-zinc-950 text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-orange-500 text-center text-lg tracking-widest font-mono"
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="rounded bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-400 text-center font-mono">
                  {errorMessage}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsStep2FA(false)}
                  className="w-1/3 h-11 bg-zinc-900 border border-zinc-800 rounded text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-wider hover:bg-zinc-850 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="w-2/3 h-11 flex justify-center items-center font-mono text-xs font-bold uppercase tracking-widest rounded text-black bg-orange-500 hover:bg-orange-605 hover:bg-orange-600 transition-all duration-200 cursor-pointer shadow-lg active:translate-y-px"
                >
                  <span>Verificar Token</span>
                </button>
              </div>
            </form>
          )}

          <div className="text-center font-mono text-[9px] text-zinc-650 pt-4 border-t border-zinc-850">
            Credenciais padrão: Operador <code className="text-orange-400 font-bold">KawanH</code>, Senha <code className="text-orange-400 font-bold">@Vzxt13wkj</code> e Código <code className="text-orange-400 font-bold">Gerado Acima</code>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDERING AUTHENTICATED PANEL ---
  return (
    <div className="space-y-8 animate-fade-in text-left">
      
      {/* Dashboard Top header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950/40 p-6 rounded-xl border border-zinc-850">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-widest font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Conexão Criptografada Ativa (2FA)
          </span>
          <h2 className="text-lg md:text-xl font-bold text-white font-display uppercase tracking-widest mt-1 leading-none">
            Painel Torn Carabinas Editor
          </h2>
          <p className="text-[11px] text-zinc-500 mt-1.5 font-mono">
            Modificações de auditórias são salvas de forma persistente e dinâmica em <code className="text-orange-400 font-mono">db.json</code>.
          </p>
        </div>
        
        <div className="flex items-center gap-2 font-mono">
          <button
            onClick={async () => {
              await onRefreshData();
              alert("Banco de dados principal re-verificado e sincronizado com sucesso.");
            }}
            className="h-9 px-4 rounded border border-zinc-800 bg-zinc-900 text-[10px] font-bold uppercase tracking-wider text-zinc-300 hover:text-white hover:border-orange-500/40 hover:bg-zinc-850 flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={12} />
            <span>Sincronizar</span>
          </button>
          
          <button
            onClick={handleLogout}
            className="h-9 px-4 rounded bg-zinc-900 hover:bg-red-955/20 border border-red-900/30 text-[10px] font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lock size={12} />
            <span>Desconectar</span>
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-zinc-950/20 border border-zinc-850 p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-widest block">Catálogo de Armas</span>
            <span className="text-xl font-bold font-display text-white">{products.length}</span>
            <span className="text-[10px] text-zinc-450 block font-mono">Equipamentos ativos</span>
          </div>
          <div className="h-10 w-10 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 flex items-center justify-center">
            <Package size={16} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-zinc-950/20 border border-zinc-850 p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-widest block">Patrimônio Balístico</span>
            <span className="text-base font-bold font-display text-orange-400">
              R$ {totalStockValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-zinc-450 block font-mono">Financeiro em estoque</span>
          </div>
          <div className="h-10 w-10 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 flex items-center justify-center">
            <TrendingUp size={16} />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-zinc-950/20 border border-zinc-850 p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-widest block">Alerta de Estoques</span>
            <span className="text-xl font-bold font-display text-amber-500">{lowStockCount}</span>
            <span className="text-[10px] text-zinc-450 block font-mono">Menos de 3 unidades</span>
          </div>
          <div className={`h-10 w-10 rounded flex items-center justify-center ${lowStockCount > 0 ? "bg-amber-500/10 border border-amber-500/30 text-amber-400":"bg-zinc-800 text-zinc-505"}`}>
            <AlertTriangle size={16} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-zinc-950/20 border border-zinc-850 p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-widest block">Artigos no CMS</span>
            <span className="text-xl font-bold font-display text-white">{blogPosts.length}</span>
            <span className="text-[10px] text-zinc-450 block font-mono">Guias instrucionais</span>
          </div>
          <div className="h-10 w-10 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 flex items-center justify-center">
            <FileText size={16} />
          </div>
        </div>
      </div>

      {/* Tabs list - Dynamic 5 segments layout */}
      <div className="flex flex-wrap border-b border-zinc-850 font-mono text-[10px]">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-3 border-b-2 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === "catalog"
              ? "border-orange-550 text-orange-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Editar Preço & Estoque ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-3 border-b-2 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === "categories"
              ? "border-orange-550 text-orange-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1">
            <FolderOpen size={11} />
            Categorias ({categories.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("blog")}
          className={`px-4 py-3 border-b-2 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === "blog"
              ? "border-orange-550 text-orange-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Blog Integrado ({blogPosts.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("audit");
            fetchAuditLogs();
          }}
          className={`px-4 py-3 border-b-2 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === "audit"
              ? "border-orange-550 text-orange-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          <span className="flex items-center gap-1 text-zinc-300">
            <History size={11} className="text-orange-550" />
            Registro de Auditoria ({auditLogs.length})
          </span>
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-3 border-b-2 font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
            activeTab === "settings"
              ? "border-orange-550 text-orange-400"
              : "border-transparent text-zinc-400 hover:text-white"
          }`}
        >
          Segurança do Core
        </button>
      </div>

      {/* --- TAB CONTENT: CATALOG --- */}
      {activeTab === "catalog" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-zinc-100 font-display uppercase tracking-wider">
                Catálogo de Carabinas & Equipamentos
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                Valores de preços e estoques protegidos. Ative a edição rápida para alterá-los.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowQuickEdit(!showQuickEdit)}
                className={`h-10 px-3.5 rounded border text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                  showQuickEdit
                    ? "bg-orange-950/30 border-orange-500/40 text-orange-400 hover:bg-orange-950/50"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850"
                }`}
              >
                {showQuickEdit ? (
                  <>
                    <Lock size={12} className="text-orange-500 animate-pulse" />
                    <span>Bloquear Edição</span>
                  </>
                ) : (
                  <>
                    <Save size={12} className="text-zinc-500" />
                    <span>Editar Preço/Estoque</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="h-10 px-4 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer"
              >
                <Plus size={15} />
                <span>Novo Equipamento</span>
              </button>
            </div>
          </div>

          {/* New Product Form Collapse */}
          {showProductForm && (
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                <h4 className="text-xs font-bold text-orange-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                  <Sparkles size={13} />
                  <span>Cadastrar Novo Equipamento</span>
                </h4>
                <button onClick={() => setShowProductForm(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Nome do Equipamento *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carabina PCP Beeman Commander"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-805 bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Fabricante / Marca *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Beeman, Rossi, Gamo, Hatsan"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Categoria Vinculada *</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500 font-mono"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Preço Consumidor (R$) *</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="Ex: 4890.00"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Estoque Inicial de Unidades *</label>
                    <input
                      type="number"
                      required
                      placeholder="Ex: 5"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Calibre do Equipamento</label>
                    <input
                      type="text"
                      placeholder="Ex: 5.5mm (.22) ou N/A"
                      value={newProduct.caliber}
                      onChange={(e) => setNewProduct({ ...newProduct, caliber: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Velocidade de Disparo (FPS/ms)</label>
                    <input
                      type="text"
                      placeholder="Ex: 290 m/s (950 FPS)"
                      value={newProduct.speed}
                      onChange={(e) => setNewProduct({ ...newProduct, speed: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Mecanismo / Tipo de Propulsão</label>
                    <input
                      type="text"
                      placeholder="Ex: PCP, Spring (Mola), CO2, Gás Ram"
                      value={newProduct.action}
                      onChange={(e) => setNewProduct({ ...newProduct, action: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Peso Geral</label>
                    <input
                      type="text"
                      placeholder="Ex: 3.2 kg"
                      value={newProduct.weight}
                      onChange={(e) => setNewProduct({ ...newProduct, weight: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">URL Imagem do Produto (Opcional)</label>
                    <input
                      type="url"
                      placeholder="Deixe em branco para usar padrão tático"
                      value={newProduct.imageUrl}
                      onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Descrição / Detalhes Adicionais</label>
                  <textarea
                    rows={4}
                    placeholder="Escreva sobre as qualidades do cano de micro-raiamento, trilho de óptica, robustez, manual de instrução, etc."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500 text-xs font-sans"
                  />
                </div>

                {formStatus.message && (
                  <div className={`p-3 rounded text-center font-mono text-xs ${formStatus.type === "success" ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400":"bg-red-950/40 border border-red-500/30 text-red-400"}`}>
                    {formStatus.message}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="h-9 px-5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="h-9 px-6 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Salvar no Catálogo
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Interactive Pricing/Stock update layout */}
          <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-[#0A0A0A] shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-850 text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                  <th className="py-4 px-4 font-semibold">Produto</th>
                  <th className="py-4 px-4 font-semibold">Marca / Calibre</th>
                  <th className="py-4 px-4 font-semibold">Categoria</th>
                  <th className="py-4 px-4 font-semibold">Preço Unitário (R$)</th>
                  <th className="py-4 px-4 font-semibold">Estoque Real</th>
                  <th className="py-4 px-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 text-xs">
                {products.map((product) => {
                  const currentPrice = editingPrices[product.id] ?? product.price;
                  const currentStock = editingStocks[product.id] ?? product.stock;
                  const isModified =
                    (editingPrices[product.id] !== undefined && editingPrices[product.id] !== product.price) ||
                    (editingStocks[product.id] !== undefined && editingStocks[product.id] !== product.stock);

                  const isLoading = loadingItems[product.id];
                  const isSuccess = successItems[product.id];

                  return (
                    <tr key={product.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt=""
                            className="h-9 w-9 rounded-md object-cover bg-zinc-950 border border-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-bold text-zinc-100 block max-w-xs truncate">{product.name}</span>
                            <span className="text-[10px] text-gold-400 font-mono">ID: {product.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-zinc-400">
                        <span>{product.brand}</span>
                        <span className="block text-[10px] text-zinc-500">{product.caliber || "N/A"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-zinc-300 font-medium">{product.category}</span>
                      </td>
                      <td className="py-4 px-4 font-mono">
                        {showQuickEdit ? (
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-650">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={currentPrice}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setEditingPrices((prev) => ({ ...prev, [product.id]: isNaN(val) ? 0 : val }));
                              }}
                              className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none focus:border-orange-500 text-[13px]"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-200 font-medium">
                              R$ {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {editingPrices[product.id] !== undefined && editingPrices[product.id] !== product.price && (
                              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" title="Preço modificado e pendente de gravação" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 font-mono">
                        {showQuickEdit ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={currentStock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                setEditingStocks((prev) => ({ ...prev, [product.id]: isNaN(val) ? 0 : val }));
                              }}
                              className={`w-16 bg-zinc-900 border rounded px-2 py-1 text-center focus:outline-none focus:border-orange-500 text-[13px] ${
                                currentStock <= 2
                                  ? "border-amber-500/50 text-amber-400 font-bold"
                                  : "border-zinc-800 text-zinc-200"
                              }`}
                            />
                            {currentStock <= 2 && (
                              <span className="text-[10px] text-amber-500 uppercase font-bold animate-pulse">Baixo</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${currentStock <= 2 ? "text-amber-400 font-bold" : "text-zinc-300"}`}>
                              {currentStock} {currentStock === 1 ? "unidade" : "unidades"}
                            </span>
                            {currentStock <= 2 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase tracking-wide">
                                Crítico
                              </span>
                            )}
                            {editingStocks[product.id] !== undefined && editingStocks[product.id] !== product.stock && (
                              <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" title="Estoque modificado e pendente de gravação" />
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          {isModified && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleUpdatePriceOrStock(product.id)}
                              className="h-8 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1 transition-all text-xs cursor-pointer active:translate-y-px"
                              title="Salvar alterações dinâmicas"
                            >
                              <Save size={12} />
                              <span>{isLoading ? "..." : "Salvar"}</span>
                            </button>
                          )}
                          
                          {isSuccess && (
                            <span className="text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1 whitespace-nowrap bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/30">
                              <CheckCircle size={12} /> Salvo!
                            </span>
                          )}

                          {!showQuickEdit && !isModified && (
                            <button
                              onClick={() => setShowQuickEdit(true)}
                              className="h-8 px-2.5 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                              title="Habilitar edição rápida para este item"
                            >
                              <span>Editar</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="h-8 w-8 rounded bg-zinc-950 hover:bg-red-950/20 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-900/40 flex items-center justify-center transition-all cursor-pointer"
                            title="Remover produto permanentemente"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: CATEGORIES --- */}
      {activeTab === "categories" && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider">
                Gerenciar Categorias Balísticas
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Crie ou remova categorias do catálogo principal de carabinas e acessórios de forma dinâmica.
              </p>
            </div>
            
            <form onSubmit={handleAddCategory} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                required
                placeholder="Nova Categoria..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 w-full sm:w-64 font-mono animate-none"
              />
              <button
                type="submit"
                className="h-9 px-4 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap active:translate-y-px"
              >
                <Plus size={14} /> Add
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const activeCount = products.filter((p) => p.category === cat).length;
              return (
                <div key={cat} className="bg-zinc-950/30 border border-zinc-850 p-4 rounded-xl flex items-center justify-between hover:bg-zinc-950/60 transition-all font-mono">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                      <FolderOpen size={12} className="text-orange-500" />
                      {cat}
                    </span>
                    <span className="text-[9px] text-zinc-500 block">
                      {activeCount} {activeCount === 1 ? "equipamento vinculado" : "equipamentos vinculados"}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    className="h-8 w-8 rounded bg-zinc-900 hover:bg-red-955/20 border border-zinc-800 hover:border-red-955/30 text-zinc-400 hover:text-red-400 flex items-center justify-center cursor-pointer transition-all"
                    title="Excluir Categoria"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: AUDIT LOGS --- */}
      {activeTab === "audit" && (
        <div className="space-y-6 animate-fade-in text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider flex items-center gap-1.5">
                <History size={15} className="text-orange-550" />
                Registros de Auditoria de Segurança
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Histórico completo e imutável de todas as ações de escrita e autenticação realizadas neste portal.
              </p>
            </div>
            
            <button
              onClick={fetchAuditLogs}
              className="h-9 px-4 rounded border border-zinc-800 bg-zinc-900 text-zinc-350 hover:text-white hover:bg-zinc-850 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer font-mono"
            >
              <RefreshCw size={11} /> Atualizar Logs
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-850 rounded-xl overflow-hidden shadow-2xl">
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 font-mono text-xs">
                Nenhum log registrado até o momento.
              </div>
            ) : (
              <div className="divide-y divide-zinc-850 font-mono text-[11px]">
                {auditLogs.map((log) => {
                  const logDate = new Date(log.timestamp);
                  return (
                    <div key={log.id} className="p-4 hover:bg-zinc-900/10 transition-colors flex flex-col sm:flex-row justify-between gap-3 text-left">
                      <div className="space-y-1 max-w-2xl">
                        <div className="flex items-center flex-wrap gap-2 text-left">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            log.action.startsWith("PRODUCT_")
                              ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                              : log.action.startsWith("BLOG_")
                              ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                              : log.action.startsWith("CATEGORY_")
                              ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                              : log.action === "LOGIN_SUCCESS"
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : "bg-red-500/10 border border-red-500/20 text-red-400"
                          }`}>
                            {log.action}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-medium">{log.details}</span>
                        </div>
                        <div className="text-[10px] text-zinc-650">
                          Identificador do Operador: <code className="text-zinc-500">{log.userId}</code> • IP: <code className="text-zinc-500">{log.ipAddress}</code>
                        </div>
                      </div>
                      <div className="text-right text-[10px] text-zinc-550 self-center">
                        {logDate.toLocaleString("pt-BR")}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: BLOG --- */}
      {activeTab === "blog" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div>
              <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-wider">
                Gerenciar Matérias do Blog
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                Publique artigos técnicos, tutoriais de tiro de precisão e testes de carabinas PCP.
              </p>
            </div>
            
            <button
              onClick={() => setShowBlogForm(!showBlogForm)}
              className="h-10 px-4 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg cursor-pointer"
            >
              <Plus size={15} />
              <span>Escrever Artigo Técnico</span>
            </button>
          </div>

          {/* New Blog Form Collapse */}
          {showBlogForm && (
            <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-850 pb-3 text-left">
                <h4 className="text-xs font-bold text-orange-450 uppercase tracking-widest font-mono">
                  Nova Publicação Editorial
                </h4>
                <button onClick={() => setShowBlogForm(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateBlogPost} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Título do Artigo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Como Escolher sua Primeira Carabina PCP"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Editorias do Autor / Categoria *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Guia de Compra, Manutenção, Treinamento"
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Autor do Post *</label>
                    <input
                      type="text"
                      required
                      value={newPost.author}
                      onChange={(e) => setNewPost({ ...newPost, author: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Tempo Estimado (Ex: 5 min leitura)</label>
                    <input
                      type="text"
                      value={newPost.readTime}
                      onChange={(e) => setNewPost({ ...newPost, readTime: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">URL Imagem Capa de Blog</label>
                    <input
                      type="url"
                      placeholder="Deixe em branco para usar placeholder balístico"
                      value={newPost.imageUrl}
                      onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500 font-mono"
                    />
                  </div>
                </div>

                {/* Agenda de publicação */}
                <div className="bg-orange-500/5 p-4 rounded-lg border border-orange-500/10 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-450 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Simulação Data Agendamento futuro (UTC)</label>
                    <input
                      type="datetime-local"
                      value={newPost.scheduledDate || ""}
                      onChange={(e) => setNewPost({ ...newPost, scheduledDate: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-250 focus:outline-none focus:border-orange-500 font-mono text-[11px]"
                    />
                    <span className="text-[9px] text-zinc-500 block mt-1 leading-normal">
                      Se agendado para o futuro, o post ficará oculto para visitantes gerais até atingir esta data.
                    </span>
                  </div>
                  <div className="text-left font-mono self-center space-y-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Editor de Artigo Enriquecido</span>
                    <p className="text-[9px] text-zinc-550 leading-normal">
                      O editor suporta Markdown nativo. Use <code className="text-orange-400">### Título</code> para cabeçalhos e <code className="text-orange-400">* Tópico</code> para listas com marcadores.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider">Resumo Curto (Snippet Inicial) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Um sumário breve de 1 ou 2 sentenças para instigar o leitor esportivo."
                    value={newPost.excerpt}
                    onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-805 bg-zinc-900 border border-zinc-800 rounded p-2.5 text-zinc-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-zinc-500 font-bold mb-1 font-mono uppercase text-[9px] tracking-wider font-semibold">Texto Principal do Artigo (Markdown) *</label>
                  <textarea
                    rows={12}
                    required
                    placeholder="Conteúdo rico. Dica: use quebra dupla de parágrafo para manter visualmente imersivo."
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-805 bg-zinc-900 border border-zinc-800 rounded p-3 text-zinc-200 focus:outline-none focus:border-orange-500 text-xs font-mono leading-relaxed"
                  />
                </div>

                {formStatus.message && (
                  <div className={`p-3 rounded text-center font-mono text-xs ${formStatus.type === "success" ? "bg-emerald-950/40 border border-emerald-500/30 text-emerald-400":"bg-red-950/40 border border-red-500/30 text-red-400"}`}>
                    {formStatus.message}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 font-mono">
                  <button
                    type="button"
                    onClick={() => setShowBlogForm(false)}
                    className="h-10 px-5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850 text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Descartar
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-6 rounded bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider shadow-md cursor-pointer"
                  >
                    Publicar Artigo
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Blog posts table */}
          <div className="overflow-x-auto rounded-xl border border-zinc-850 bg-[#0A0A0A] shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-850 text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
                  <th className="py-4 px-4 font-semibold">Artigo de Blog</th>
                  <th className="py-4 px-4 font-semibold">Autor</th>
                  <th className="py-4 px-4 font-semibold">Categoria / Editoria</th>
                  <th className="py-4 px-4 font-semibold">Data de Publicação</th>
                  <th className="py-4 px-4 font-semibold text-right">Controle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/80 text-xs">
                {blogPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-900/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.imageUrl}
                          alt=""
                          className="h-9 w-9 rounded-md object-cover bg-zinc-950 border border-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                        <span className="font-bold text-zinc-200 max-w-sm truncate text-left">{post.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-zinc-500 font-mono">
                      {post.author}
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-medium font-mono uppercase">
                        {post.category}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-zinc-400 font-mono">
                      {post.date}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDeleteBlogPost(post.id, post.title)}
                        className="h-8 w-8 rounded bg-zinc-900 hover:bg-red-955/20 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-955/35 inline-flex items-center justify-center transition-all cursor-pointer"
                        title="Deletar artigo"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: SETTINGS --- */}
      {activeTab === "settings" && (
        <div className="bg-zinc-950/20 border border-zinc-850 p-6 rounded-xl space-y-4 text-left">
          <h3 className="text-sm font-extrabold text-white font-display uppercase tracking-widest flex items-center gap-2">
            <Lock size={16} className="text-orange-550" />
            <span>Infraestrutura e Segurança do Sistema</span>
          </h3>
          
          <div className="text-zinc-450 space-y-4 text-xs leading-relaxed max-w-2xl">
            <p className="font-sans leading-normal text-zinc-400">
              O portal Sniper Pro de gerenciamento funciona por meio de Tokens JWT no carregamento de rede. 
              Ao efetuar qualquer alteração de preços ou estoques, seu navegador envia a chave de controle
              no cabeçalho de requisição <code className="text-orange-400 font-semibold">Authorization Bearer</code>.
            </p>
            
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-3">
              <h4 className="font-bold text-zinc-200 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Como alterar sua senha padrão?
              </h4>
              <p className="font-sans leading-normal text-zinc-400">
                Para alterar a senha de acesso definitivo do seu portal, configure a variável de ambiente:
              </p>
              <pre className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-orange-400 font-mono font-bold">
                ADMIN_PASSWORD="suasenhasegura"
              </pre>
              <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                A variável deve ser adicionada à sua configuração de ambiente no Painel de Segredos (Secrets) do Google AI Studio, 
                ou criada no arquivo <code className="text-zinc-500">.env</code> de produção. Em seguida, reinicie o container para aplicar.
              </p>
            </div>

            <div className="pt-2 font-sans">
              <span className="block text-zinc-500 font-mono text-[10px] uppercase tracking-wider">Backup e Integridade:</span>
              <p className="text-zinc-500 text-[10.5px] leading-normal mt-1">
                Todos os dados encontram-se salvos de forma resiliente em arquivos JSON no servidor para persistência total em execuções normais no Cloud Run.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
