export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  brand: string;
  caliber?: string;
  speed?: string; // e.g. "305 m/s (1000 FPS)"
  action?: string; // PCP, CO2, Spring, Gas Ram
  weight?: string;
  featured?: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  date: string;
  author: string;
  imageUrl: string;
  readTime: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  cep?: string;
  cpfCnpj?: string;
  careOf?: string; // Aos Cuidados
  street?: string; // Rua
  number?: string; // Número
  complement?: string; // Complemento
  neighborhood?: string; // Bairro
  state?: string; // Estado
  city?: string; // Cidade
  reference?: string; // Referência
  phones?: string[]; // telefones
}

export interface StoreData {
  products: Product[];
  blogPosts: BlogPost[];
}

