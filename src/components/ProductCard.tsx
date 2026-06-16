import React from "react";
import { Product } from "../types";
import { Eye, ShoppingCart, Tag, Package, ShieldCheck } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onViewDetails,
  onAddToCart,
}) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-white/10 bg-white/5 transition-all duration-300 hover:border-red-500/50 hover:bg-[#111111]">
      {/* Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-600 to-red-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Image Area */}
      <div className="relative aspect-video w-full overflow-hidden bg-black">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
          referrerPolicy="no-referrer"
        />
        
        {/* Category Tag */}
        <div className="absolute top-3 left-3 rounded bg-black/85 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 backdrop-blur-xs border border-white/10">
          {product.category}
        </div>

        {/* Action Tag (PCP / CO2 etc) */}
        {product.action && (
          <div className="absolute top-3 right-3 rounded bg-red-600 text-white px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest">
            {product.action.split(" ")[0]}
          </div>
        )}

        {/* Stock Alert overlay */}
        {isOutOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-xs">
            <span className="rounded border border-red-500/30 bg-red-950/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-red-400">
              Sem Estoque
            </span>
          </div>
        ) : product.stock <= 2 ? (
          <div className="absolute bottom-3 left-3 rounded bg-amber-950/95 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 backdrop-blur-xs">
            Apenas {product.stock} un!
          </div>
        ) : null}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] flex items-center gap-1.5 font-mono">
          <span>{product.brand}</span>
          {product.caliber && product.caliber !== "N/A" && (
            <>
              <span className="text-zinc-700">•</span>
              <span className="text-red-400/80">{product.caliber}</span>
            </>
          )}
        </div>

        <h3 className="line-clamp-2 text-sm font-bold uppercase tracking-tight text-zinc-100 group-hover:text-red-400 transition-colors duration-200">
          {product.name}
        </h3>

        {/* Technical specs teaser */}
        <div className="mt-2.5 space-y-1 text-[11px] text-zinc-400 font-mono">
          {product.speed && product.speed !== "N/A" && (
            <div className="flex justify-between border-b border-white/5 pb-1">
              <span className="text-zinc-500">Velocidade:</span>
              <span className="text-zinc-300 font-medium">{product.speed}</span>
            </div>
          )}
          {product.weight && product.weight !== "N/A" && (
            <div className="flex justify-between">
              <span className="text-zinc-500">Peso:</span>
              <span className="text-zinc-300 font-medium">{product.weight}</span>
            </div>
          )}
        </div>

        {/* Price & Cart row */}
        <div className="mt-auto pt-4 flex items-end justify-between border-t border-white/10">
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-505 uppercase tracking-widest font-semibold">Preço à vista</span>
            <span className="text-base font-bold text-white font-display">
              R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] text-emerald-400/90 flex items-center gap-0.5 mt-0.5 font-mono">
              <ShieldCheck size={11} /> SELO TORN CARABINAS
            </span>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => onViewDetails(product)}
              className="flex h-8.5 w-8.5 items-center justify-center rounded border border-white/10 bg-black/60 text-zinc-400 hover:border-red-500/40 hover:text-red-400 transition-all duration-200"
              title="Especificações Técnicas"
            >
              <Eye size={14} />
            </button>
            <button
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product)}
              className={`flex h-8.5 px-3 gap-1 items-center justify-center rounded text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                isOutOfStock
                  ? "bg-zinc-800 text-zinc-650 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-black/10 active:translate-y-px"
              }`}
            >
              <ShoppingCart size={13} />
              <span>Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
