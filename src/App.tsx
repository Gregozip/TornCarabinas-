import { useState, useEffect } from "react";
import { Product, BlogPost, UserProfile, StoreSettings } from "./types";
import { ProductCard } from "./components/ProductCard";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { BlogModal } from "./components/BlogModal";
import { AdminPanel } from "./components/AdminPanel";
import { ManagerPanel } from "./components/ManagerPanel";
import { CartDrawer } from "./components/CartDrawer";
import { UserAccountModal } from "./components/UserAccountModal";
import { CheckoutModal } from "./components/CheckoutModal";
import {
  Crosshair,
  Search,
  SlidersHorizontal,
  BookOpen,
  Wrench,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  User,
  ShoppingBag,
  Menu,
  LockKeyhole,
  Lock,
  Compass,
  FileText,
  ShoppingCart
} from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
}

const CATEGORIES = [
  "Todas",
  "Carabinas PCP",
  "Carabinas de Pressão",
  "Pistolas CO2",
  "Acessórios e Ópticas",
  "Munições e Chumbinhos",
  "Alvos e Estande"
];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "Carabinas PCP",
    "Carabinas de Pressão",
    "Pistolas CO2",
    "Acessórios e Ópticas",
    "Munições e Chumbinhos",
    "Alvos e Estande"
  ]);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  
  // View switches (added manager as a first-class route section)
  const [currentSection, setCurrentSection] = useState<"store" | "admin" | "manager">("store");

  // User Authentication & Address State
  const [loggedUser, setLoggedUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("torn_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Interactive UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  
  // Selected detail modals
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  
  // Cart toggle
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Advanced search parameters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterBrand, setFilterBrand] = useState("Todas");
  const [filterCaliber, setFilterCaliber] = useState("Todos");
  const [filterAction, setFilterAction] = useState("Todas");
  const [filterStockOnly, setFilterStockOnly] = useState(false);
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("none");

  // Fetch only logo & name settings from server
  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const settingsData = await res.json();
        setStoreSettings(settingsData);
      }
    } catch (err) {
      console.error("Erro ao puxar dados de personalização:", err);
    }
  };

  // Fetch initial data from server (including dynamic categories)
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resProducts, resBlog, resCategories] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/blog"),
        fetch("/api/categories")
      ]);
      
      if (resProducts.ok && resBlog.ok) {
        const prodData = await resProducts.json();
        const blogData = await resBlog.json();
        setProducts(prodData);
        setBlogPosts(blogData);
      }
      if (resCategories && resCategories.ok) {
        const catData = await resCategories.json();
        setCategories(catData);
      }
      await fetchSettings();
    } catch (err) {
      console.error("Erro ao carregar dados do servidor Express:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Check if the manager is accessing the unlisted /manager path or manager=true query parameter
    const path = window.location.pathname;
    const search = window.location.search;
    if (path.toLowerCase().includes("/manager") || search.toLowerCase().includes("manager=true")) {
      setCurrentSection("manager");
    }
  }, []);

  // Cart Management
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
    // Auto open cart drawer to feel smooth & interactive
    setIsCartOpen(true);
  };

  const handleBuyNow = (product: Product, quantity: number = 1) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevItems, { product, quantity }];
    });
    setIsCheckoutOpen(true);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setLoggedUser(user);
    localStorage.setItem("torn_user", JSON.stringify(user));
    const emailLower = user.email.toLowerCase().trim();
    if (emailLower === "fireofbombs@gmail.com" || emailLower === "luizcslana@gmail.com") {
      sessionStorage.setItem("torn_manager_authorized", "true");
      sessionStorage.setItem("torn_manager_user", user.name || "Luiz");
    }
  };

  const handleLogout = () => {
    setLoggedUser(null);
    localStorage.removeItem("torn_user");
    sessionStorage.removeItem("torn_manager_authorized");
    sessionStorage.removeItem("torn_manager_user");
  };

  useEffect(() => {
    if (loggedUser) {
      const emailLower = loggedUser.email.toLowerCase().trim();
      if (emailLower === "fireofbombs@gmail.com" || emailLower === "luizcslana@gmail.com") {
        sessionStorage.setItem("torn_manager_authorized", "true");
        sessionStorage.setItem("torn_manager_user", loggedUser.name || "Luiz");
      }
    }
  }, [loggedUser]);

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  // Get dynamic distinct lists from products for options dropdowns
  const availableBrands = ["Todas", ...Array.from(new Set(products.map(p => p.brand).filter(Boolean)))];
  const availableCalibers = ["Todos", ...Array.from(new Set(products.map(p => p.caliber).filter(c => c && c !== "N/A")))];
  const availableActions = ["Todas", ...Array.from(new Set(products.map(p => p.action).filter(a => a && a !== "Ação Manual" && a !== "N/A")))];

  // Multi-criteria advanced search and sorting
  let filteredProducts = products.filter((product) => {
    // 1. Category Chip
    const matchesCategory = selectedCategory === "Todas" || product.category === selectedCategory;
    
    // 2. Search Box Query
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.caliber && product.caliber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.action && product.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
    // 3. Brand Filter Dropdown
    const matchesBrand = filterBrand === "Todas" || product.brand === filterBrand;
    
    // 4. Caliber Filter Dropdown
    const matchesCaliber = filterCaliber === "Todos" || product.caliber === filterCaliber;
    
    // 5. Action Filter Dropdown
    const matchesAction = filterAction === "Todas" || product.action === filterAction;
    
    // 6. Stock Check
    const matchesStock = !filterStockOnly || product.stock > 0;
    
    // 7. Price limits (Min/Max)
    const minPriceNum = parseFloat(filterMinPrice);
    const maxPriceNum = parseFloat(filterMaxPrice);
    const matchesMinPrice = isNaN(minPriceNum) || product.price >= minPriceNum;
    const matchesMaxPrice = isNaN(maxPriceNum) || product.price <= maxPriceNum;
    
    return matchesCategory && matchesSearch && matchesBrand && matchesCaliber && matchesAction && matchesStock && matchesMinPrice && matchesMaxPrice;
  });

  // Sort Filtered Results
  if (sortBy === "price-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  } else if (sortBy === "stock-desc") {
    filteredProducts = [...filteredProducts].sort((a, b) => b.stock - a.stock);
  } else if (sortBy === "name-asc") {
    filteredProducts = [...filteredProducts].sort((a, b) => a.name.localeCompare(b.name));
  }

  // Filter out blog posts whose scheduledDate is in the future for public storefront view
  const publicBlogPosts = blogPosts.filter((post) => {
    if (!post.scheduledDate) return true;
    const today = new Date().toISOString().slice(0, 10);
    return post.scheduledDate <= today;
  });

  // Featured air rifles list
  const featuredProducts = products.filter((p) => p.featured);

  const cartItemsCount = cartItems.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-between selection:bg-red-650 selection:text-white">
      
      {/* ---------------- NAVIGATION HEADER ---------------- */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentSection("store")}>
          {storeSettings?.logoUrl ? (
            <div className="h-9 max-w-[120px] flex items-center justify-center rounded overflow-hidden">
              <img 
                src={storeSettings.logoUrl} 
                alt="Logo" 
                className="h-full object-contain" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop";
                }}
              />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-950/40">
              <Crosshair size={20} className="stroke-[2.5]" />
            </div>
          )}
          <div className="text-left font-display">
            <span className="text-sm font-black tracking-widest text-white block uppercase leading-none">
              {storeSettings?.logoText ? (
                <>
                  {storeSettings.logoText.includes(" ") ? (
                    <>
                      {storeSettings.logoText.substring(0, storeSettings.logoText.lastIndexOf(" "))}{" "}
                      <span className="text-red-500">
                        {storeSettings.logoText.substring(storeSettings.logoText.lastIndexOf(" ") + 1)}
                      </span>
                    </>
                  ) : (
                    <span className="text-red-500">{storeSettings.logoText}</span>
                  )}
                </>
              ) : (
                <>
                  TORN <span className="text-red-500">CARABINAS</span>
                </>
              )}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider block mt-0.5 uppercase">
              {storeSettings?.logoSubtext || "TIRO ESPORTIVO"}
            </span>
          </div>
        </div>

        {/* Right side controls: Cart */}
        <div className="flex items-center gap-2.5">
          {currentSection === "store" && (
            <>
              {/* Shortcut to Manager Panel for Owners */}
              {loggedUser && (
                (() => {
                  const emailLower = loggedUser.email.toLowerCase().trim();
                  return emailLower === "fireofbombs@gmail.com" || emailLower === "luizcslana@gmail.com";
                })() && (
                  <button
                    onClick={() => {
                      sessionStorage.setItem("torn_manager_authorized", "true");
                      sessionStorage.setItem("torn_manager_user", loggedUser.name || "Luiz");
                      setCurrentSection("manager");
                    }}
                    className="h-10 px-3.5 rounded-xl border border-red-500/30 bg-red-650/15 text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer"
                    title="Acessar o Painel de Gerente"
                  >
                    <SlidersHorizontal size={14} />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Painel de Gerente
                    </span>
                  </button>
                )
              )}

              {/* My Account Button */}
              <button
                onClick={() => setIsAccountOpen(true)}
                className={`h-10 px-3.5 rounded-xl border flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
                  loggedUser 
                    ? "bg-zinc-900 border-zinc-850 text-zinc-300 hover:text-white" 
                    : "bg-red-650/10 border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white"
                }`}
                title={loggedUser ? "Meus Dados e Telefones" : "Minha Conta / Registrar"}
              >
                <User size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {loggedUser ? `${loggedUser.name.split(" ")[0]}` : "Registrar / Entrar"}
                </span>
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="relative h-10 px-4 rounded-xl bg-red-650/10 border border-red-500/20 text-red-500 hover:bg-red-600 hover:text-white flex items-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <ShoppingBag size={15} />
                <span className="text-xs font-bold uppercase tracking-wider">Carrinho</span>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-650 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ---------------- MAIN CONTAINER ---------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6">
        
        {loading ? (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Carregando catálogo balístico...</span>
          </div>
        ) : currentSection === "manager" ? (
          
          /* ---------------- UNLISTED TACTICAL MANAGER PANEL ---------------- */
          <ManagerPanel
            products={products}
            categories={categories}
            settings={storeSettings}
            onRefreshData={fetchData}
            onRefreshSettings={fetchSettings}
            onClose={() => {
              // Clear URL search and path parameters beautifully
              window.history.pushState({}, "", "/");
              setCurrentSection("store");
            }}
          />

        ) : currentSection === "admin" ? (
          
          /* ---------------- SECURITY ADMIN BOARD ---------------- */
          <AdminPanel
            products={products}
            blogPosts={blogPosts}
            onRefreshData={fetchData}
          />
          
        ) : (
          
          /* ---------------- PUBLIC STOREFRONT ---------------- */
          <div className="space-y-12">
            
            {/* Header Showcase Banner */}
            <section className="relative overflow-hidden rounded-2xl border border-zinc-850 bg-radial from-zinc-900 to-zinc-950 p-6 md:p-12 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 py-10 md:py-16">
              <div className="absolute top-0 right-0 h-48 w-48 bg-red-600/5 blur-3xl rounded-full" />
              <div className="absolute bottom-0 left-0 h-48 w-48 bg-red-500/5 blur-3xl rounded-full" />

              <div className="space-y-4 max-w-xl text-left">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-red-400">
                  <Sparkles size={11} className="animate-spin" /> Distribuidor Especializado e Certificado
                </span>

                <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-display uppercase leading-none">
                  Precisão Cirúrgica <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">
                    Sem Meio-Termo.
                  </span>
                </h1>

                <p className="text-sm text-zinc-400 leading-relaxed">
                  As principais carabinas PCP mundiais, lunetas de alto ajuste orbital, esferas e munições selecionadas manualmente. 
                  Garantia de constância balística e atendimento exclusivo de atirador para atirador.
                </p>

                <div className="pt-3 flex flex-wrap gap-3">
                  <a
                    href="#catalog-top"
                    className="h-10 px-5 rounded-lg bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-red-950/20 active:translate-y-px transition-all flex items-center gap-1.5"
                  >
                    <span>Explorar Catálogo</span>
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>

              {/* Decorative side badge */}
              <div className="hidden lg:flex flex-col items-center justify-center p-8 bg-zinc-900/60 border border-zinc-800 rounded-xl relative max-w-xs space-y-4">
                <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 text-red-500">
                  <ShoppingCart size={22} className="animate-pulse" />
                </div>
                <div className="text-center">
                  <span className="block font-bold text-zinc-200 text-sm">Loja especializada na venda de carabinas e airsofts</span>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Os melhores equipamentos do mercado de tiro e airsoft com suporte logístico personalizado e documentação completa.
                  </p>
                </div>
              </div>
            </section>

            {/* Filter and Interactive Catalog space */}
            <section id="catalog-top" className="space-y-6 pt-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
                <div>
                  <h2 className="text-sm font-bold font-display uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                    <span className="h-1.5 w-3 bg-red-600 rounded-sm" />
                    Catálogo de Equipamentos
                  </h2>
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Selecione por categoria de propulsão ou use o painel de filtros avançados
                  </p>
                </div>

                {/* Interactive Search Tool */}
                <div className="relative w-full lg:max-w-xs">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar carabinas, munições..."
                    className="w-full bg-zinc-950 border border-zinc-805 rounded-lg py-2 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono placeholder:text-zinc-600"
                  />
                  <Search size={14} className="absolute left-3 top-2.5 text-zinc-650" />
                </div>
              </div>

              {/* Category Chips Horizontal List - Using dynamic categories State */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {["Todas", ...categories].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-red-600 text-white shadow-md shadow-red-950/20"
                          : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-all bg-zinc-900/60 hover:bg-zinc-900 rounded-lg border border-zinc-800 cursor-pointer"
                >
                  <SlidersHorizontal size={11} />
                  <span>{showAdvancedFilters ? "Fechar Busca Avançada" : "Busca Avançada & Filtros"}</span>
                  {showAdvancedFilters ? "▲" : "▼"}
                </button>
              </div>

              {/* Collapsible Advanced Filters Board */}
              {showAdvancedFilters && (
                <div className="p-5 rounded-xl border border-zinc-850 bg-zinc-950/40 space-y-4 animate-fade-in text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Brand Selector */}
                    <div>
                      <label className="block text-zinc-500 font-mono text-[9px] uppercase tracking-wider mb-1">Fabricante / Marca</label>
                      <select
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 focus:outline-none focus:border-orange-500"
                      >
                        {availableBrands.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    {/* Caliber Selector */}
                    <div>
                      <label className="block text-zinc-500 font-mono text-[9px] uppercase tracking-wider mb-1">Calibre Específico</label>
                      <select
                        value={filterCaliber}
                        onChange={(e) => setFilterCaliber(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 focus:outline-none focus:border-orange-500"
                      >
                        {availableCalibers.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Action Selector */}
                    <div>
                      <label className="block text-zinc-500 font-mono text-[9px] uppercase tracking-wider mb-1">Mecanismo / Tipo de Ação</label>
                      <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 focus:outline-none focus:border-orange-500"
                      >
                        {availableActions.map(a => (
                          <option key={a} value={a}>{a}</option>
                        ))}
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div>
                      <label className="block text-zinc-500 font-mono text-[9px] uppercase tracking-wider mb-1">Organização de Exibição</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded p-2 text-zinc-300 focus:outline-none focus:border-orange-500 text-orange-400 font-bold"
                      >
                        <option value="none">Padrão do Sistema</option>
                        <option value="price-asc">Menor Preço (Crescente)</option>
                        <option value="price-desc">Maior Preço (Decrescente)</option>
                        <option value="stock-desc">Volume de Estoque</option>
                        <option value="name-asc">Ordem Alfabética (A-Z)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-zinc-900">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Price bounds */}
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 font-mono text-[9px] uppercase tracking-wider">Preço Mín/Máx:</span>
                        <input
                          type="number"
                          placeholder="Mín"
                          value={filterMinPrice}
                          onChange={(e) => setFilterMinPrice(e.target.value)}
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded p-1.5 text-center text-zinc-300 font-mono"
                        />
                        <span className="text-zinc-650 font-mono">-</span>
                        <input
                          type="number"
                          placeholder="Máx"
                          value={filterMaxPrice}
                          onChange={(e) => setFilterMaxPrice(e.target.value)}
                          className="w-16 bg-zinc-900 border border-zinc-800 rounded p-1.5 text-center text-zinc-300 font-mono"
                        />
                      </div>

                      {/* Stock Toggle */}
                      <label className="inline-flex items-center gap-2 cursor-pointer select-none text-zinc-400 hover:text-white">
                        <input
                          type="checkbox"
                          checked={filterStockOnly}
                          onChange={(e) => setFilterStockOnly(e.target.checked)}
                          className="rounded border-zinc-800 bg-zinc-950 text-orange-500 focus:ring-orange-600 focus:ring-offset-zinc-950 h-4 w-4"
                        />
                        <span className="font-mono text-[9px] uppercase tracking-wider">Apenas Equipamentos em Estoque</span>
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-mono uppercase bg-zinc-900/60 px-2 py-1 rounded">
                        Resultados obtidos: <strong>{filteredProducts.length}</strong>
                      </span>
                      
                      <button
                        onClick={() => {
                          setFilterBrand("Todas");
                          setFilterCaliber("Todos");
                          setFilterAction("Todas");
                          setFilterStockOnly(false);
                          setFilterMinPrice("");
                          setFilterMaxPrice("");
                          setSelectedCategory("Todas");
                          setSortBy("none");
                        }}
                        className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-850 hover:text-white text-[10px] font-mono font-bold text-zinc-400 tracking-wider uppercase border border-zinc-800 cursor-pointer"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid listings */}
              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-zinc-900/20 border border-dashed border-zinc-850 rounded-xl">
                  <div className="h-12 w-12 rounded-full bg-zinc-950 flex items-center justify-center text-zinc-500 mx-auto">
                    <Search size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-300 text-sm">Nenhum equipamento localizado</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-[280px] mx-auto">
                      Tente alterar os filtros de busca ou escolha "Todas" as categorias de acessórios.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onViewDetails={(p) => setActiveProduct(p)}
                      onAddToCart={(p) => handleAddToCart(p, 1)}
                    />
                  ))}
                </div>
              )}
            </section>

          </div>
        )}
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-10 px-4 md:px-8 mt-20 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-red-600 flex items-center justify-center text-white">
                <Crosshair size={16} />
              </div>
              <span className="font-extrabold text-white text-sm uppercase tracking-wider font-display">
                TORN CARABINAS
              </span>
            </div>
            <p className="text-zinc-500 leading-normal max-w-sm">
              Artigos esportivos balísticos de alto calibre. Compra segura, produtos com faturamento rigoroso estruturado e de alta durabilidade.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-zinc-300 font-display uppercase tracking-wider text-xs">
              Segurança e Conformidade
            </h4>
            <div className="rounded-lg bg-red-950/20 border border-red-900/30 p-3 flex items-start gap-2.5 text-zinc-400 text-[11px] leading-relaxed">
              <ShieldAlert className="text-red-400 shrink-0 mt-0.5" size={16} />
              <span>
                <strong>Atenção:</strong> De acordo com a portaria nacional, a venda de carabinas e pistolas de pressão é restrita a 
                maiores de 18 anos de idade. Exige-se comprovação de identidade no momento do envio balístico. Atire com segurança.
              </span>
            </div>
          </div>

          {/* Consumer resources or contact column */}
          <div className="space-y-3 flex flex-col justify-start">
            <h4 className="font-bold text-zinc-300 font-display uppercase tracking-wider text-xs">
              Atendimento Especializado
            </h4>
            <p className="text-zinc-500">
              Precisa de ajuda ou restou alguma dúvida de calibre e velocidade? Entre em contato direto com o nosso time técnico via WhatsApp ou e-mail.
            </p>
            <div className="text-[11px] text-zinc-450 font-mono space-y-1">
              <p>Segunda a Sexta — 09:00 às 18:00</p>
              <p className="text-red-400 font-bold">contato@torncarabinas.com.br</p>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-650 font-mono">
          <span>© 2026 Torn Carabinas Ltda. Todos os direitos reservados.</span>
          <span className="flex items-center gap-1 select-none">
            <span>Hospedagem Comercial Protegida SSL</span>
            <button 
              onClick={() => {
                setCurrentSection(currentSection === "admin" ? "store" : "admin");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-zinc-900 hover:text-zinc-800 transition-colors ml-1 p-0.5 cursor-pointer"
              title="Acesso Restrito"
            >
              <Lock size={10} />
            </button>
          </span>
        </div>
      </footer>

      {/* ---------------- CARDS & SIDE DIALOGS MODALS ---------------- */}
      
      {/* Product specs details */}
      {activeProduct && (
        <ProductDetailModal
          product={activeProduct}
          onClose={() => setActiveProduct(null)}
          onAddToCart={(p, qty) => handleAddToCart(p, qty)}
          onBuyNow={(p, qty) => handleBuyNow(p, qty)}
        />
      )}

      {/* Blog reading screen */}
      {activePost && (
        <BlogModal
          post={activePost}
          onClose={() => setActivePost(null)}
        />
      )}

      {/* Interactive Cart drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onOpenCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* User registration/profile modal */}
      <UserAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        loggedUser={loggedUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Structured Checkout details modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        loggedUser={loggedUser}
        cartItems={cartItems}
        total={cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
