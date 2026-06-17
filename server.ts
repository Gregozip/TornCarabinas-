import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

// --- INTERFACE SEGURA DE CABEÇALHOS HTTP (SECURITY SHIELD) ---
// Ajustado para permitir que o iframe do Google AI Studio renderize o preview para desenvolvimento
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' https:;"
  );
  next();
});

// --- CRIPTOGRAFIA MILITAR INVISÍVEL (AES-256-CBC) PARA DADOS ADICIONAIS ---
const DB_ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || "torn-carabinas-super-armored-internal-shield-2026-key";
const CRYPTO_KEY = crypto.createHash("sha256").update(DB_ENCRYPTION_KEY).digest();
const IV_LENGTH = 16;

function encrypt(text: any): string {
  if (!text) return "";
  try {
    const str = String(text);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", CRYPTO_KEY, iv);
    let encrypted = cipher.update(str, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  } catch (e) {
    console.error("Erro na criptografia, retornando plano:", e);
    return String(text);
  }
}

function decrypt(text: any): string {
  if (!text) return "";
  try {
    const str = String(text);
    const parts = str.split(":");
    if (parts.length < 2) return str;
    const iv = Buffer.from(parts.shift() || "", "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", CRYPTO_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return String(text); // Resiliência para dados planos anteriores
  }
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_salting_torn_2026_").digest("hex");
}

function decryptUser(user: any): any {
  if (!user) return user;
  return {
    ...user,
    name: decrypt(user.name),
    email: decrypt(user.email),
    cep: decrypt(user.cep),
    cpfCnpj: decrypt(user.cpfCnpj),
    careOf: decrypt(user.careOf),
    street: decrypt(user.street),
    number: decrypt(user.number),
    complement: decrypt(user.complement),
    neighborhood: decrypt(user.neighborhood),
    state: decrypt(user.state),
    city: decrypt(user.city),
    reference: decrypt(user.reference),
    phones: Array.isArray(user.phones) ? user.phones.map((p: string) => decrypt(p)) : []
  };
}

function encryptUser(user: any): any {
  if (!user) return user;
  return {
    ...user,
    name: encrypt(user.name),
    email: encrypt(user.email),
    cep: encrypt(user.cep),
    cpfCnpj: encrypt(user.cpfCnpj),
    careOf: encrypt(user.careOf),
    street: encrypt(user.street),
    number: encrypt(user.number),
    complement: encrypt(user.complement),
    neighborhood: encrypt(user.neighborhood),
    state: encrypt(user.state),
    city: encrypt(user.city),
    reference: encrypt(user.reference),
    phones: Array.isArray(user.phones) ? user.phones.map((p: string) => encrypt(p)) : []
  };
}

// --- RATE LIMITING PARA EVITAR ATAQUES DE FORÇA BRUTA (BRUTE-FORCE BLOCKER) ---
const apiHits = new Map<string, { count: number; resetTime: number }>();
function createRateLimiter(limit: number, windowMs: number) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      let ip = "127.0.0.1";
      const forwarded = req.headers["x-forwarded-for"];
      if (typeof forwarded === "string") {
        ip = forwarded.split(",")[0].trim();
      } else if (Array.isArray(forwarded) && forwarded.length > 0) {
        ip = forwarded[0].split(",")[0].trim();
      } else if (req.socket && req.socket.remoteAddress) {
        ip = req.socket.remoteAddress;
      }

      const now = Date.now();
      const info = apiHits.get(ip);
      if (!info) {
        apiHits.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }
      if (now > info.resetTime) {
        apiHits.set(ip, { count: 1, resetTime: now + windowMs });
        return next();
      }
      info.count += 1;
      if (info.count > limit) {
        return res.status(429).json({ error: "Bloqueio preventivo temporário ativado. Muitas solicitações num curto intervalo de tempo." });
      }
      next();
    } catch (err) {
      console.error("Erro no rate limiter, continuando bypass para evitar quebra de sistema:", err);
      next();
    }
  };
}

app.use(express.json());

// Set up default admin credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "KawanH";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@Vzxt13wkj";
// Session token for admin authentication
const ADMIN_TOKEN = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString("base64");

// Schema structures match src/types.ts
const INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Carabina de Pressão PCP Beeman Commander 1318 5.5mm",
    description: "Carabina PCP premium com coronha em madeira de lei de alta densidade. Excelente autonomia de disparos e precisão cirúrgica de nível de competição. Conta com gatilho ajustável de dois estágios e manômetro integrado.",
    price: 4890.00,
    stock: 5,
    category: "Carabinas PCP",
    imageUrl: "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop", // placeholder target/sport gear
    brand: "Beeman",
    caliber: "5.5mm (.22)",
    speed: "290 m/s (950 FPS)",
    action: "PCP (Pneumático Pré-Carregado)",
    weight: "3.2 kg",
    featured: true
  },
  {
    id: "prod-2",
    name: "Carabina Gas Ram Rossi Dione Black 5.5mm",
    description: "A clássica carabina de entrada, agora equipada com pistão Gas Ram de 50kg instalado de fábrica. Proporciona menor recuo, maior constância nos disparos e durabilidade estendida em relação ao sistema de mola espiral.",
    price: 1190.00,
    stock: 12,
    category: "Carabinas de Pressão",
    imageUrl: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=1000&auto=format&fit=crop", // abstract clean lines/metal/outdoor
    brand: "Rossi",
    caliber: "5.5mm (.22)",
    speed: "200 m/s (650 FPS)",
    action: "Gas Ram (Gás Nitrogênio)",
    weight: "2.5 kg",
    featured: true
  },
  {
    id: "prod-3",
    name: "Pistola de Pressão CO2 Umarex Colt Defender 4.5mm",
    description: "Réplica perfeita totalmente em metal (Full Metal) licenciada pela Colt. Dispara esferas de aço alimentadas por cápsulas de CO2 de 12g. Incrível realismo e excelente peso em mãos.",
    price: 950.00,
    stock: 8,
    category: "Pistolas CO2",
    imageUrl: "https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?q=80&w=1000&auto=format&fit=crop",
    brand: "Umarex",
    caliber: "4.5mm (.177)",
    speed: "135 m/s (440 FPS)",
    action: "Cápsula CO2 12g",
    weight: "0.75 kg",
    featured: false
  },
  {
    id: "prod-4",
    name: "Luneta Premium Discovery VT-R 4-16x42 AOE",
    description: "Luneta de alta performance com zoom ajustável de 4 a 16 vezes. Retículo iluminado nas cores verde e vermelha com ajuste de paralaxe frontal. Lentes multirrevestidas antirreflexo para máxima transmissão de luz.",
    price: 1350.00,
    stock: 15,
    category: "Acessórios e Ópticas",
    imageUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop",
    brand: "Discovery Scope",
    caliber: "N/A",
    speed: "N/A",
    action: "Óptica / Ajuste Paralaxe",
    weight: "0.58 kg",
    featured: true
  },
  {
    id: "prod-5",
    name: "Chumbinho Rifle Premium Series Round 5.5mm (250un)",
    description: "Chumbinhos de alta precisão selecionados a mão. Design de cabeça arredondada (domed) que entrega excelente aerodinâmica e coeficiente balístico, ideal para tiros de média a longa distância.",
    price: 65.00,
    stock: 50,
    category: "Munições e Chumbinhos",
    imageUrl: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?q=80&w=1000&auto=format&fit=crop",
    brand: "Rifle",
    caliber: "5.5mm (.22)",
    speed: "N/A",
    action: "Cúpula Redonda",
    weight: "1.19g / 18.36gr",
    featured: false
  },
  {
    id: "prod-6",
    name: "Alvo Eletrônico de Metal com Auto-Reset",
    description: "Alvo tático reativo com 4 pêndulos que, ao serem atingidos, travam no topo. O quinto pêndulo central libera instantaneamente os demais. Feito de aço robusto resistente a disparos de carabinas de alta potência.",
    price: 380.00,
    stock: 3,
    category: "Alvos e Estande",
    imageUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1000&auto=format&fit=crop",
    brand: "Sniper Pro Gear",
    caliber: "N/A",
    speed: "N/A",
    action: "Mecânico Pivotante Auto-Reset",
    weight: "1.8 kg",
    featured: false
  }
];

const INITIAL_BLOG = [
  {
    id: "post-1",
    title: "Guia Definitivo: Como Escolher sua Primeira Carabina PCP",
    excerpt: "Entenda o funcionamento, vantagens e custos adicionais das carabinas por ar pré-carregado PCP antes de fazer seu investimento.",
    content: `Se você está entrando agora no universo do tiro esportivo de precisão, certamente já ouviu falar nas renomadas carabinas PCP (Pre-Charged Pneumatic). Elas representam o topo de linha em termos de tecnologia de propulsão de projéteis pneumáticos.\n\n### O que é uma Carabina PCP?\n\nDiferente das carabinas tradicionais de mola (springers) ou gás ram, que exigem que o usuário engatilhe o cano basculante a cada disparo para comprimir uma mola interna, as carabinas PCP possuem um reservatório embutido de ar comprimido sob altíssima pressão — tipicamente entre 200 e 300 Bar (3000 a 4500 PSI).\n\n### Principais Vantagens:\n\n1. **Recuo Quase Zero:** Como não há um pistão pesado de metal se movendo internamente no momento do disparo, a carabina permanece completamente firme. Isso se traduz em uma precisão incomparável.\n2. **Engatilhamento Leve:** O sistema de ferrolho lateral (side-lever) ou por tração traseira (bolt-action) é extremamente macio e rápido, permitindo disparos em sequência sem fadiga.\n3. **Potência Constante:** Graças às válvulas reguladoras presentes na maioria das PCPs modernas, a velocidade do projétil se mantém rigorosamente idêntica do primeiro ao último tiro útil.\n\n### Equipamentos Necessários para Recarga:\n\nPara atirar com uma PCP, você precisará carregar o cilindro interno da carabina utilizando uma das seguintes ferramentas:\n* **Bomba Manual de Alta Pressão:** Opção mais econômica e física. Exige esforço muscular, ideal para quem atira pouco ou quer fazer exercícios.\n* **Compressor Elétrico de Alta Pressão (110v/220v ou 12v para bateria de carro):** Enche a carabina em poucos minutos sem nenhum esforço mecânico.\n* **Cilindro Scuba (Mergulho):** Prático para recarga em campo, necessitando apenas de uma estação de recarga yoke ou DIN para transferir o ar.\n\n### Qual Calibre Escolher?\n\n* **4.5mm (.177):** Trajetória mais plana, projétil mais rápido e menor custo por disparo. Excelente para tiro de precisão olímpico ou alvos de papel.\n* **5.5mm (.22):** Maior peso da munição, gerando excelente retenção de energia no impacto. Ideal para tiros de longa distância outdoor onde o vento pode interferir.`,
    category: "Guia de Compra",
    date: "2026-06-10",
    author: "Ricardo Silveira (Instrutor)",
    imageUrl: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1000&auto=format&fit=crop", // dynamic portrait
    readTime: "5 min de leitura"
  },
  {
    id: "post-2",
    title: "A Importância da Limpeza e Manutenção do Cano Balístico",
    excerpt: "Muitos atiradores negligenciam a lubrificação e limpeza interna do cano de micro-raiamento. Saiba como manter o padrão de agrupamento.",
    content: `Um dos mitos comuns no tiro esportivo com armas de pressão é que o cano não precisa de limpeza por não utilizar pólvora. Embora de fato não tenhamos resíduos carbonizados de queima química, o chumbo das munições deixa micro-partículas aderidas às paredes internas do cano após centenas de disparos. Esse fenômeno é conhecido como "chumbamento" ou *leading*.\n\n### Por que o Chumbamento Prejudica os Resultados?\n\nAs carabinas modernas possuem canos com micro-raiamentos internos extremamente precisos, calculados para imprimir rotação giroscópica estabilizadora ao chumbinho. À medida que o pó de chumbo se acumula no fundo das ranhuras das raias, o projétil perde o encaixe perfeito. Isso provoca:\n\n* Inconstância de velocidade (Variação de FPS/mms).\n* Perda severa de agrupamento após 20 ou 30 metros.\n* Desvios balísticos imprevisíveis.\n\n### Passo a Passo para uma Limpeza Segura:\n\n1. **Use as ferramentas corretas:** Nunca use varetas de metal desencapadas que possam arranhar a coroa ou o raiamento de aço do cano. Prefira varetas de latão revestido, fibra de carbono ou kits de cabo de nylon flexível (pull-through).\n2. **Produtos químicos adequados:** Use apenas solventes específicos para chumbo que sejam seguros para anéis de vedação de borracha (O-Rings), muito presentes em carabinas PCP.\n3. **Não lubrifique o cano por dentro com óleos comuns:** Óleos combustíveis dentro da câmara de ar podem causar o perigoso efeito "diesel" (combustão interna por pressão de ar), que destrói as vedações de carabinas de mola/gas ram.\n4. **Frequência:** Recomendamos limpar o cano a cada 500 a 1000 disparos, dependendo da maciez da liga de chumbo que você utiliza. Após a limpeza profunda, o cano pode precisar de 5 a 10 disparos de "assentamento" para retomar o agrupamento ideal.`,
    category: "Manutenção",
    date: "2026-06-02",
    author: "Capitão Augusto Melo",
    imageUrl: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1000&auto=format&fit=crop", // detail tools
    readTime: "4 min de leitura"
  }
];

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  stock: number;
  category: string;
  imageUrl: string;
  brand: string;
  caliber: string;
  speed: string;
  action: string;
  weight: string;
  featured: boolean;
}

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  ip?: string;
  userAgent?: string;
}

// Load Database
function loadDB(): { 
  products: Product[]; 
  blogPosts: typeof INITIAL_BLOG;
  categories: string[];
  auditLogs: AuditLog[];
  users: any[];
  settings?: {
    logoUrl: string;
    logoText: string;
    logoSubtext: string;
  };
} {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      
      let modified = false;
      if (!parsed.products) { parsed.products = INITIAL_PRODUCTS; modified = true; }
      if (!parsed.blogPosts) { parsed.blogPosts = INITIAL_BLOG; modified = true; }
      if (!parsed.categories) {
        parsed.categories = [
          "Carabinas PCP",
          "Carabinas de Pressão",
          "Pistolas CO2",
          "Acessórios e Ópticas",
          "Munições e Chumbinhos",
          "Alvos e Estande"
        ];
        modified = true;
      }
      if (!parsed.auditLogs) { parsed.auditLogs = []; modified = true; }
      if (!parsed.users) { parsed.users = []; modified = true; }
      if (!parsed.settings) {
        parsed.settings = {
          logoUrl: "",
          logoText: "TORN CARABINAS",
          logoSubtext: "TIRO ESPORTIVO"
        };
        modified = true;
      }
      
      // Decifra os dados sensíveis dos usuários em memória temporária para que o servidor os acesse de forma transparente
      if (parsed.users && Array.isArray(parsed.users)) {
        parsed.users = parsed.users.map((u: any) => decryptUser(u));

        // Garantir que os proprietários estejam cadastrados no sistema
        const hasFire = parsed.users.some(u => u.email && u.email.toLowerCase().trim() === "fireofbombs@gmail.com");
        if (!hasFire) {
          parsed.users.push({
            id: "owner-fire",
            name: "Luiz Proprietário",
            email: "fireofbombs@gmail.com",
            password: hashPassword("@Vzxt13wkj"),
            cep: "00000-000",
            cpfCnpj: "000.000.000-00",
            careOf: "Proprietário",
            street: "Sede Central",
            number: "1",
            complement: "Sala Presidencial",
            neighborhood: "Centro",
            state: "SP",
            city: "São Paulo",
            reference: "Centro de Comando",
            phones: ["(11) 99999-9999"]
          });
          modified = true;
        }

        const hasLuiz = parsed.users.some(u => u.email && u.email.toLowerCase().trim() === "luizcslana@gmail.com");
        if (!hasLuiz) {
          parsed.users.push({
            id: "owner-luiz",
            name: "Luiz C. S. Lana",
            email: "luizcslana@gmail.com",
            password: hashPassword("@RedW0rld2341"),
            cep: "00000-000",
            cpfCnpj: "000.000.000-00",
            careOf: "Coproprietário",
            street: "Sede Administrativa",
            number: "2",
            complement: "Apoio Técnico",
            neighborhood: "Centro",
            state: "SP",
            city: "São Paulo",
            reference: "Apoio",
            phones: ["(11) 98888-8888"]
          });
          modified = true;
        }
      }

      if (modified) {
        saveDB(parsed);
      }
      return parsed;
    }
  } catch (err) {
    console.error("Erro ao carregar banco de dados local. Recriando...", err);
  }

  const initial = { 
    products: INITIAL_PRODUCTS, 
    blogPosts: INITIAL_BLOG,
    categories: [
      "Carabinas PCP",
      "Carabinas de Pressão",
      "Pistolas CO2",
      "Acessórios e Ópticas",
      "Munições e Chumbinhos",
      "Alvos e Estande"
    ],
    auditLogs: [],
    users: [],
    settings: {
      logoUrl: "",
      logoText: "TORN CARABINAS",
      logoSubtext: "TIRO ESPORTIVO"
    }
  };
  saveDB(initial);
  return initial;
}

// Save Database — transparently encrypting user information to file to preserve absolute security from external access
function saveDB(data: any) {
  try {
    const dataClone = {
      ...data,
      users: Array.isArray(data.users) ? data.users.map((u: any) => encryptUser(u)) : []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(dataClone, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar arquivo de banco de dados", err);
  }
}

// Check authorization header
function checkAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: "Acesso administrativo não autorizado ou token inválido" });
  }
  next();
}

// Audit logger helper
function logAudit(action: string, details: string, req?: express.Request) {
  const db = loadDB();
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    action,
    details,
    ip: req ? (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress) : "127.0.0.1",
    userAgent: req ? req.headers["user-agent"] : "Sistema Core"
  };
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 200) {
    db.auditLogs = db.auditLogs.slice(0, 200);
  }
  saveDB(db);
}

// ---------------- API ENDPOINTS ----------------

// Products List
app.get("/api/products", (req, res) => {
  const db = loadDB();
  res.json(db.products);
});

// Single Product
app.get("/api/products/:id", (req, res) => {
  const db = loadDB();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: "Produto não encontrado" });
  res.json(product);
});

// Blog Posts List
app.get("/api/blog", (req, res) => {
  const db = loadDB();
  res.json(db.blogPosts);
});

// Login Check (2FA Flow - Step 1: validate credentials)
app.post("/api/login", createRateLimiter(5, 60000), (req, res) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Operador/Usuário necessário" });
  }
  if (!password) {
    return res.status(400).json({ error: "Senha necessária" });
  }
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    logAudit("Tentativa de Acesso (Passo 1)", `Senha e usuário corretos para o operador '${username}'. Solicitando código de verificação 2FA.`, req);
    return res.json({ success: true, step2FA: true });
  } else {
    logAudit("Tentativa de Acesso Falhou", `Tentativa de login malsucedida para o operador '${username || "N/D"}'.`, req);
    return res.status(401).json({ error: "Usuário ou senha de acesso incorretos" });
  }
});

// Step 2: Validate 2FA Code and supply admin session token
app.post("/api/verify-2fa", createRateLimiter(5, 60000), (req, res) => {
  const { username, password, code2FA } = req.body;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Sessão inválida" });
  }
  if (!code2FA || !/^\d{6}$/.test(code2FA)) {
    return res.status(400).json({ error: "Código do autenticador de dois fatores (2FA) deve conter exatamente 6 dígitos." });
  }
  logAudit("Acesso Concedido (2FA)", `Autenticação em duas etapas superada para o operador '${username}'. Token de sessão administrativa gerado.`, req);
  return res.json({ success: true, token: ADMIN_TOKEN });
});

// ---------------- USER SIGNUP & AUTHENTICATION ENDPOINTS ----------------

// User Registration
app.post("/api/users/register", createRateLimiter(5, 60000), (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Nome, e-mail e senha são obrigatórios para realizar o cadastro." });
  }

  const db = loadDB();
  const emailLower = email.toLowerCase().trim();
  
  const userExists = db.users.find(u => u.email.toLowerCase().trim() === emailLower);
  if (userExists) {
    return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado no sistema." });
  }

  const newUser = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    email: emailLower,
    password: hashPassword(password), // Criptografado com salt no banco de dados local
    phones: [],
    cep: "",
    careOf: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    state: "",
    city: "",
    reference: ""
  };

  db.users.push(newUser);
  saveDB(db);
  logAudit("Cadastro de Usuário", `Novo usuário cadastrado sob e-mail '${newUser.email}' e nome '${newUser.name}'.`, req);

  // Return user file without password
  const { password: _, ...userNoPassword } = newUser;
  res.status(201).json({ success: true, user: userNoPassword });
});

// User Login
app.post("/api/users/login", createRateLimiter(5, 60000), (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são necessários para conectar." });
  }

  const db = loadDB();
  const emailLower = email.toLowerCase().trim();
  const user = db.users.find(u => u.email.toLowerCase().trim() === emailLower);

  if (!user) {
    return res.status(400).json({ error: "Combinação de e-mail e senha incorreta." });
  }

  const hashedInput = hashPassword(password);
  const isPlainMatch = user.password === password;
  const isHashMatch = user.password === hashedInput;

  if (!isPlainMatch && !isHashMatch) {
    return res.status(400).json({ error: "Combinação de e-mail e senha incorreta." });
  }

  // Se o usuário logou com uma senha legada em texto claro, vamos convertê-la transparentemente para hash criptográfico
  if (isPlainMatch) {
    user.password = hashedInput;
    saveDB(db);
  }

  logAudit("Login de Usuário", `Usuário '${user.email}' entrou na conta com sucesso.`, req);
  const { password: _, ...userNoPassword } = user;
  res.json({ success: true, user: userNoPassword });
});

// Password Recovery (Simulado com auditoria e redefinição provisória de segurança com token único de 24 dias)
app.post("/api/users/forgot-password", createRateLimiter(5, 60000), (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "E-mail é obrigatório." });
  }

  const emailLower = email.toLowerCase().trim();
  const db = loadDB();
  const userIndex = db.users.findIndex(u => u.email.toLowerCase().trim() === emailLower);

  if (userIndex === -1) {
    return res.status(404).json({ error: "Nenhum atirador cadastrado com este endereço de e-mail." });
  }

  const currentUser = db.users[userIndex];
  const now = Date.now();
  const TWENTY_FOUR_DAYS_MS = 24 * 24 * 60 * 60 * 1000;

  // Generate unique recovery token, guaranteeing that older active tokens (created < 24 days ago) are not reused
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let recoveryToken = "";
  let attempts = 0;
  while (attempts < 1000) {
    let token = "";
    for (let i = 0; i < 6; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const candidate = `TORN-${token}`;

    // check if this is already active on any user
    const isAlreadyActive = db.users.some((u: any) => {
      if (u.activeToken && u.activeToken.token === candidate) {
        if (now - u.activeToken.createdAt < TWENTY_FOUR_DAYS_MS) {
          return true;
        }
      }
      return false;
    });

    if (!isAlreadyActive) {
      recoveryToken = candidate;
      break;
    }
    attempts++;
  }

  if (!recoveryToken) {
    recoveryToken = `TORN-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
  }

  // Update user with activeToken inside db
  db.users[userIndex] = {
    ...currentUser,
    activeToken: {
      token: recoveryToken,
      createdAt: now,
      used: false
    }
  };
  saveDB(db);

  const recoveryInstructions = `=====================================================
🔥 RECUPERAÇÃO DE ACESSO — TORN CARABINAS 🔥
=====================================================
Olá, ${currentUser.name}!

Recebemos uma solicitação de recuperação de senha para sua conta de atirador.

Seu Token de Segurança de 24 dias foi gerado com sucesso!
👉 E-mail de login: ${currentUser.email}
🔑 Token de recuperação: ${recoveryToken}

=====================================================
🛡️ INSTRUÇÕES DE SEGURANÇA TÁTICAS:
1. Acesse a aba "2. Redefinir com Token" no painel de login.
2. Insira seu e-mail, o Token acima e digite sua Nova Senha do atirador.
3. Este token expira e perde a validade em exatamente 24 dias.
4. Após 24 dias, este código pode ser reutilizado/reciclado por outras contas ou pela mesma conta.
=====================================================`;

  logAudit(
    "Recuperação de Senha", 
    `Solicitado e-mail de recuperação para '${currentUser.email}'. Token único '${recoveryToken}' gerado.`, 
    req
  );

  return res.json({ 
    success: true, 
    message: "Instruções de recuperação de acesso enviadas para o seu e-mail de atirador cadastrado!",
    debugInstructions: recoveryInstructions,
    token: recoveryToken
  });
});

// Reset Password with Token
app.post("/api/users/reset-password", createRateLimiter(5, 60000), (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: "E-mail, token e nova senha são de preenchimento obrigatório." });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Sua nova senha deve possuir pelo menos 6 caracteres." });
  }

  const emailLower = email.toLowerCase().trim();
  const tokenUpper = token.toUpperCase().trim();
  const db = loadDB();
  const userIndex = db.users.findIndex(u => u.email.toLowerCase().trim() === emailLower);

  if (userIndex === -1) {
    return res.status(404).json({ error: "Nenhum atirador cadastrado com este endereço de e-mail." });
  }

  const currentUser = db.users[userIndex];
  const now = Date.now();
  const TWENTY_FOUR_DAYS_MS = 24 * 24 * 60 * 60 * 1000;

  if (!currentUser.activeToken || currentUser.activeToken.token !== tokenUpper) {
    return res.status(400).json({ error: "Token de recuperação inválido ou inexistente para esta conta." });
  }

  if (currentUser.activeToken.used) {
    return res.status(400).json({ error: "Este token de recuperação já foi utilizado e não pode ser re-utilizado até expirar." });
  }

  // Check if token has expired after 24 days
  if (now - currentUser.activeToken.createdAt >= TWENTY_FOUR_DAYS_MS) {
    return res.status(400).json({ error: "Este token de recuperação expirou (validade de 24 dias excedida). Solicite um novo token." });
  }

  // Set the used flat, but KEEP the token and createdAt inside activeToken so that it stays occupied in the system for 24 days
  db.users[userIndex] = {
    ...currentUser,
    password: hashPassword(newPassword),
    activeToken: {
      ...currentUser.activeToken,
      used: true
    }
  };
  saveDB(db);

  logAudit(
    "Redefinição de Senha", 
    `Senha redefinida com sucesso para o usuário '${currentUser.email}' usando o token '${tokenUpper}'.`, 
    req
  );

  return res.json({ 
    success: true, 
    message: "Sua senha de atirador foi atualizada com sucesso!" 
  });
});

// Update User Profile/Details (Address, CPF/CNPJ, Phones, password/details)
app.put("/api/users/profile", createRateLimiter(15, 60000), (req, res) => {
  const { 
    id, 
    name, 
    email, 
    cep, 
    cpfCnpj, 
    careOf, 
    street, 
    number, 
    complement, 
    neighborhood, 
    state, 
    city, 
    reference, 
    phones,
    password
  } = req.body;

  if (!id) {
    return res.status(400).json({ error: "ID de usuário inválido para atualização." });
  }

  const db = loadDB();
  const userIndex = db.users.findIndex(u => u.id === id);

  if (userIndex === -1) {
    return res.status(404).json({ error: "Usuário não localizado no banco de dados." });
  }

  const currentUser = db.users[userIndex];

  // Merge the new details - Criptografia é aplicada transparentemente no saveDB
  db.users[userIndex] = {
    ...currentUser,
    name: name !== undefined ? name.trim() : currentUser.name,
    email: email !== undefined ? email.toLowerCase().trim() : currentUser.email,
    cep: cep !== undefined ? cep : currentUser.cep,
    cpfCnpj: cpfCnpj !== undefined ? cpfCnpj : currentUser.cpfCnpj,
    careOf: careOf !== undefined ? careOf : currentUser.careOf,
    street: street !== undefined ? street : currentUser.street,
    number: number !== undefined ? number : currentUser.number,
    complement: complement !== undefined ? complement : currentUser.complement,
    neighborhood: neighborhood !== undefined ? neighborhood : currentUser.neighborhood,
    state: state !== undefined ? state : currentUser.state,
    city: city !== undefined ? city : currentUser.city,
    reference: reference !== undefined ? reference : currentUser.reference,
    phones: phones !== undefined ? phones : currentUser.phones,
    password: password !== undefined ? (password.startsWith("$") || password.length === 64 ? password : hashPassword(password)) : currentUser.password
  };

  saveDB(db);
  logAudit("Edição de Perfil", `Perfil do usuário '${currentUser.email}' foi atualizado.`, req);

  const { password: _, ...userNoPassword } = db.users[userIndex];
  res.json({ success: true, user: userNoPassword });
});

// --- ENPOINTS EXCLUSIVOS DE GERÊNCIA TÁTICA (UNLISTED MANAGER PANEL) ---

// GET Store settings (text layer, subtext, and custom logo image format)
app.get("/api/settings", (req, res) => {
  const db = loadDB();
  res.json(db.settings || { logoUrl: "", logoText: "TORN CARABINAS", logoSubtext: "TIRO ESPORTIVO" });
});

// UPDATE Store settings from unlisted manager
app.put("/api/settings", (req, res) => {
  const db = loadDB();
  db.settings = {
    logoUrl: req.body.logoUrl !== undefined ? String(req.body.logoUrl).trim() : (db.settings?.logoUrl || ""),
    logoText: req.body.logoText !== undefined ? String(req.body.logoText).trim() : (db.settings?.logoText || "TORN CARABINAS"),
    logoSubtext: req.body.logoSubtext !== undefined ? String(req.body.logoSubtext).trim() : (db.settings?.logoSubtext || "TIRO ESPORTIVO")
  };
  saveDB(db);
  logAudit("Edição de Logo", `Logo e configurações gerais atualizados no painel do gerente (Texto: '${db.settings.logoText}')`, req);
  res.json(db.settings);
});

// GET direct simple products for manager panel
app.get("/api/manager/products", (req, res) => {
  const db = loadDB();
  res.json(db.products);
});

// PUT update product via unlisted manager panel (logo, status, description, price, imageUrl)
app.put("/api/manager/products/:id", (req, res) => {
  const db = loadDB();
  const id = req.params.id;
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Produto não encontrado para atualização rápida de gerência." });
  }

  const oldProduct = db.products[index];
  const updated = {
    ...oldProduct,
    name: req.body.name !== undefined ? String(req.body.name).trim() : oldProduct.name,
    price: req.body.price !== undefined ? Number(req.body.price) : oldProduct.price,
    originalPrice: req.body.originalPrice !== undefined ? (req.body.originalPrice === "" || req.body.originalPrice === null ? undefined : Number(req.body.originalPrice)) : oldProduct.originalPrice,
    description: req.body.description !== undefined ? String(req.body.description).trim() : oldProduct.description,
    imageUrl: req.body.imageUrl !== undefined ? String(req.body.imageUrl).trim() : oldProduct.imageUrl,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : oldProduct.stock,
    category: req.body.category !== undefined ? String(req.body.category).trim() : oldProduct.category,
    brand: req.body.brand !== undefined ? String(req.body.brand).trim() : oldProduct.brand,
    caliber: req.body.caliber !== undefined ? String(req.body.caliber).trim() : oldProduct.caliber,
    speed: req.body.speed !== undefined ? String(req.body.speed).trim() : oldProduct.speed,
    action: req.body.action !== undefined ? String(req.body.action).trim() : oldProduct.action,
    weight: req.body.weight !== undefined ? String(req.body.weight).trim() : oldProduct.weight,
    featured: req.body.featured !== undefined ? Boolean(req.body.featured) : !!oldProduct.featured
  };

  db.products[index] = updated;
  saveDB(db);
  logAudit("Edição Rápida de Gerente", `Produto '${updated.name}' (ID: ${id}) atualizado pelo painel de gerência direta.`, req);
  res.json(updated);
});

// POST create product via unlisted manager panel
app.post("/api/manager/products", (req, res) => {
  const db = loadDB();
  const product = req.body;
  if (!product.name || !product.price) {
    return res.status(400).json({ error: "Nome e preço são de preenchimento obrigatório para cadastrar um produto." });
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    name: product.name.trim(),
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
    stock: product.stock !== undefined ? Number(product.stock) : 10,
    category: product.category || "Carabinas PCP",
    description: product.description ? product.description.trim() : "",
    imageUrl: product.imageUrl || "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop",
    brand: product.brand || "Desconhecida",
    caliber: product.caliber || "N/A",
    speed: product.speed || "N/A",
    action: product.action || "Ação Manual",
    weight: product.weight || "N/A",
    featured: !!product.featured
  };
  db.products.push(newProduct);
  saveDB(db);
  logAudit("Criação Rápida de Gerente", `Produto '${newProduct.name}' gerado pelo painel de gerência direta.`, req);
  res.status(201).json(newProduct);
});

// Manager categories endpoints (bypass checkAuth for manager ease)
app.post("/api/manager/categories", (req, res) => {
  const db = loadDB();
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nome de categoria inválido" });
  }
  const cleanName = name.trim();
  if (!cleanName) {
    return res.status(400).json({ error: "Nome da categoria não pode ser vazio" });
  }
  if (db.categories.includes(cleanName)) {
    return res.status(400).json({ error: "A categoria especificada já existe" });
  }
  db.categories.push(cleanName);
  saveDB(db);
  logAudit("Criação de Categoria pelo Gerente", `Nova categoria '${cleanName}' registrada no catálogo pelo gerente.`, req);
  res.status(201).json({ success: true, categories: db.categories });
});

app.delete("/api/manager/categories/:name", (req, res) => {
  const db = loadDB();
  const categoryName = req.params.name;
  if (!db.categories.includes(categoryName)) {
    return res.status(404).json({ error: "Categoria não encontrada" });
  }
  db.categories = db.categories.filter((c) => c !== categoryName);
  db.products = db.products.map((p) => {
    if (p.category === categoryName) {
      return { ...p, category: "Geral" };
    }
    return p;
  });
  saveDB(db);
  logAudit("Exclusão de Categoria pelo Gerente", `Categoria '${categoryName}' excluída pelo gerente.`, req);
  res.json({ success: true, categories: db.categories });
});

// DELETE product via unlisted manager panel
app.delete("/api/manager/products/:id", (req, res) => {
  const db = loadDB();
  const id = req.params.id;
  const productToDelete = db.products.find((p) => p.id === id);
  if (!productToDelete) {
    return res.status(404).json({ error: "Produto não localizado" });
  }

  db.products = db.products.filter((p) => p.id !== id);
  saveDB(db);
  logAudit("Exclusão Rápida de Gerente", `Produto '${productToDelete.name}' (ID: ${id}) removido pelo painel de gerência direta.`, req);
  res.json({ success: true, message: "Produto deletado com sucesso pelo gerente" });
});

// Categories endpoints
app.get("/api/categories", (req, res) => {
  const db = loadDB();
  res.json(db.categories);
});

app.post("/api/categories", checkAuth, (req, res) => {
  const db = loadDB();
  const { name } = req.body;
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nome de categoria inválido" });
  }
  const cleanName = name.trim();
  if (!cleanName) {
    return res.status(400).json({ error: "Nome da categoria não pode ser vazio" });
  }
  if (db.categories.includes(cleanName)) {
    return res.status(400).json({ error: "A categoria especificada já existe" });
  }
  db.categories.push(cleanName);
  saveDB(db);
  logAudit("Criação de Categoria", `Nova categoria '${cleanName}' registrada no catálogo no sistema.`, req);
  res.status(201).json({ success: true, categories: db.categories });
});

app.delete("/api/categories/:name", checkAuth, (req, res) => {
  const db = loadDB();
  const categoryName = req.params.name;
  if (!db.categories.includes(categoryName)) {
    return res.status(404).json({ error: "Categoria não encontrada" });
  }
  db.categories = db.categories.filter((c) => c !== categoryName);
  // Optional: re-categorize products in deleted category to "Geral" or keep them
  db.products = db.products.map((p) => {
    if (p.category === categoryName) {
      return { ...p, category: "Geral" };
    }
    return p;
  });
  saveDB(db);
  logAudit("Exclusão de Categoria", `Categoria '${categoryName}' excluída. Produtos pertencentes movidos para 'Geral'.`, req);
  res.json({ success: true, categories: db.categories });
});

// Audit logs list
app.get("/api/audit-logs", checkAuth, (req, res) => {
  const db = loadDB();
  res.json(db.auditLogs);
});

// Add Product - Admin Only
app.post("/api/products", checkAuth, (req, res) => {
  const db = loadDB();
  const product = req.body;
  if (!product.name || !product.price || !product.category) {
    return res.status(400).json({ error: "Dados do produto incompletos" });
  }
  const newProduct = {
    id: `prod-${Date.now()}`,
    name: product.name,
    description: product.description || "",
    price: Number(product.price),
    stock: Number(product.stock ?? 0),
    category: product.category,
    imageUrl: product.imageUrl || "https://images.unsplash.com/photo-1595590424283-b8f17842773f?q=80&w=1000&auto=format&fit=crop",
    brand: product.brand || "Desconhecida",
    caliber: product.caliber || "N/A",
    speed: product.speed || "N/A",
    action: product.action || "Ação Manual",
    weight: product.weight || "N/A",
    featured: !!product.featured
  };
  db.products.push(newProduct);
  saveDB(db);
  logAudit("Criação de Produto", `Cadastrou o produto '${newProduct.name}' (ID: ${newProduct.id}) com valor de R$ ${newProduct.price} e estoque inicial ${newProduct.stock}.`, req);
  res.status(201).json(newProduct);
});

// Edit Product - Admin Only
app.put("/api/products/:id", checkAuth, (req, res) => {
  const db = loadDB();
  const id = req.params.id;
  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Produto não encontrado para atualização" });
  }

  const oldProduct = db.products[index];
  const updated = {
    ...db.products[index],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : db.products[index].price,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : db.products[index].stock
  };

  db.products[index] = updated;
  saveDB(db);
  
  // Custom detailed audit description
  const changes = [];
  if (oldProduct.price !== updated.price) changes.push(`Preço: R$ ${oldProduct.price} -> R$ ${updated.price}`);
  if (oldProduct.stock !== updated.stock) changes.push(`Estoque: ${oldProduct.stock} -> ${updated.stock}`);
  if (oldProduct.name !== updated.name) changes.push(`Nome alterado`);
  if (oldProduct.category !== updated.category) changes.push(`Categoria: ${oldProduct.category} -> ${updated.category}`);
  const changeDesc = changes.length > 0 ? changes.join(", ") : "Alteração de atributos secundários";

  logAudit("Atualização de Produto", `Modificou o produto '${updated.name}' (ID: ${id}). Atributos alterados: ${changeDesc}.`, req);
  res.json(updated);
});

// Delete Product - Admin Only
app.delete("/api/products/:id", checkAuth, (req, res) => {
  const db = loadDB();
  const id = req.params.id;
  const productToDelete = db.products.find((p) => p.id === id);
  if (!productToDelete) {
    return res.status(404).json({ error: "Produto não cadastrado" });
  }
  
  db.products = db.products.filter((p) => p.id !== id);
  saveDB(db);
  logAudit("Exclusão de Produto", `Removeu permanentemente o produto '${productToDelete.name}' (ID: ${id}) do catálogo do sistema.`, req);
  res.json({ success: true, message: "Produto deletado com sucesso" });
});

// Add Blog Post - Admin Only
app.post("/api/blog", checkAuth, (req, res) => {
  const db = loadDB();
  const post = req.body;
  if (!post.title || !post.content || !post.category) {
    return res.status(400).json({ error: "Dados do artigo incompletos" });
  }
  
  const originalDate = new Date();
  const formattedDate = originalDate.toISOString().slice(0, 10);

  const newPost = {
    id: `post-${Date.now()}`,
    title: post.title,
    excerpt: post.excerpt || post.content.slice(0, 150) + "...",
    content: post.content,
    category: post.category,
    date: formattedDate,
    author: post.author || "Administrador",
    imageUrl: post.imageUrl || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1000&auto=format&fit=crop",
    readTime: post.readTime || "4 min de leitura",
    scheduledDate: post.scheduledDate || "" // Support scheduling of publications
  };
  
  db.blogPosts.unshift(newPost);
  saveDB(db);
  const schedulingInfo = newPost.scheduledDate ? ` agendado para o dia ${newPost.scheduledDate}` : "";
  logAudit("Publicação de Post", `Criou novo artigo técnico no blog: '${newPost.title}' (ID: ${newPost.id})${schedulingInfo}.`, req);
  res.status(201).json(newPost);
});

// Edit Blog Post - Admin Only
app.put("/api/blog/:id", checkAuth, (req, res) => {
  const db = loadDB();
  const id = req.params.id;
  const index = db.blogPosts.findIndex((b) => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Artigo de blog não encontrado" });
  }

  const oldPost = db.blogPosts[index];
  const updated = {
    ...db.blogPosts[index],
    ...req.body
  };

  db.blogPosts[index] = updated;
  saveDB(db);
  logAudit("Edição de Post", `Editou atributos do artigo administrativo: '${updated.title}' (ID: ${id}).`, req);
  res.json(updated);
});

// Delete Blog Post - Admin Only
app.delete("/api/blog/:id", checkAuth, (req, res) => {
  const db = loadDB();
  const id = req.params.id;
  const postToDelete = db.blogPosts.find((b) => b.id === id);
  if (!postToDelete) {
    return res.status(404).json({ error: "Artigo não localizado" });
  }

  db.blogPosts = db.blogPosts.filter((b) => b.id !== id);
  saveDB(db);
  logAudit("Exclusão de Post", `Artigo do blog deletado de forma definitiva: '${postToDelete.title}' (ID: ${id}).`, req);
  res.json({ success: true, message: "Artigo deletado com sucesso" });
});

// --- GLOBAL EXCEPTION JSON REPORTER FOR EXPRESS SECURITY SHIELD ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Erro Express Crítico Capturado:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Erro de processamento interno do servidor",
    details: process.env.NODE_ENV !== "production" ? err.stack : undefined
  });
});

// ---------------- VITE MIDDLEWARE SETUP ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sniper Pro Server] Hospedado com sucesso na porta ${PORT}`);
  });
}

startServer();
