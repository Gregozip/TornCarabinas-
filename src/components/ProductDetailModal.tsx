import React, { useState } from "react";
import { Product } from "../types";
import { X, ShoppingCart, Scale, Crosshair, Zap, Package, Tag, ShieldCheck, Check } from "lucide-react";

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}) => {
  const [quantity, setQuantity] = useState(1);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onClose();
  };

  const handleBuyNow = () => {
    onBuyNow(product, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-white/10 bg-[#0A0A0A] shadow-2xl transition-all max-h-[90vh] flex flex-col">
        {/* Header Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/80 p-1.5 text-zinc-400 border border-white/10 transition-colors hover:text-white"
        >
          <X size={16} />
        </button>

        <div className="overflow-y-auto p-6 md:p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Image & Badges */}
            <div className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded border border-white/10 bg-black">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover opacity-95"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute top-3 left-3 rounded bg-black/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-400 border border-white/10">
                  {product.category}
                </div>
              </div>

              {/* Technical badges */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {product.brand && (
                  <div className="rounded bg-white/5 p-2.5 border border-white/5">
                    <span className="block text-[10px] text-zinc-500 uppercase">Fabricante</span>
                    <span className="font-semibold text-zinc-200">{product.brand}</span>
                  </div>
                )}
                {product.action && (
                  <div className="rounded bg-white/5 p-2.5 border border-white/5">
                    <span className="block text-[10px] text-zinc-500 uppercase">Funcionamento</span>
                    <span className="font-semibold text-zinc-200">{product.action}</span>
                  </div>
                )}
                {product.caliber && product.caliber !== "N/A" && (
                  <div className="rounded bg-white/5 p-2.5 border border-white/5">
                    <span className="block text-[10px] text-zinc-500 uppercase">Calibre</span>
                    <span className="font-semibold text-zinc-200">{product.caliber}</span>
                  </div>
                )}
                {product.speed && product.speed !== "N/A" && (
                  <div className="rounded bg-white/5 p-2.5 border border-white/5">
                    <span className="block text-[10px] text-zinc-500 uppercase">Velocidade</span>
                    <span className="font-semibold text-zinc-200">{product.speed}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Title, Specs, Description & CTA */}
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block mb-1 font-mono">
                  EQUIPAMENTO EXCLUSIVO | TORN CARABINAS
                </span>
                <h2 className="text-lg md:text-xl font-bold uppercase tracking-tight text-white mb-2">
                  {product.name}
                </h2>

                <div className="flex items-center gap-4.5 mb-5 font-mono text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Package size={13} className="text-zinc-500" />
                    <span>Estoque:</span>
                    {isOutOfStock ? (
                      <span className="text-red-400 font-bold uppercase">Indisponível</span>
                    ) : (
                      <span className="text-red-400 font-bold">{product.stock} unidades</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 py-4">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Descrição do Equipamento
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>

                {/* Spec Table */}
                <div className="border-t border-white/10 py-4 space-y-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Especificações Técnicas
                  </h3>
                  <div className="grid grid-cols-2 gap-y-2 text-[11px] font-mono">
                    {product.brand && (
                      <div className="flex justify-between border-b border-white/5 pb-1.5 pr-2">
                        <span className="text-zinc-500">Marca:</span>
                        <span className="text-zinc-300">{product.brand}</span>
                      </div>
                    )}
                    {product.caliber && (
                      <div className="flex justify-between border-b border-white/5 pb-1.5 pl-2">
                        <span className="text-zinc-500">Calibre:</span>
                        <span className="text-zinc-300">{product.caliber}</span>
                      </div>
                    )}
                    {product.speed && (
                      <div className="flex justify-between border-b border-white/5 pb-1.5 pr-2">
                        <span className="text-zinc-400">Cano / FPS:</span>
                        <span className="text-zinc-300">{product.speed}</span>
                      </div>
                    )}
                    {product.weight && (
                      <div className="flex justify-between border-b border-white/5 pb-1.5 pl-2">
                        <span className="text-zinc-500">Peso Total:</span>
                        <span className="text-zinc-300">{product.weight}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase Box */}
              <div className="border-t border-white/10 pt-5 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Valor à Vista</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-xs text-zinc-500 line-through block mt-0.5" id={`detail-old-price-${product.id}`}>
                        De: R$ {(product.originalPrice * quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className="text-xl font-bold text-white font-display">
                      R$ {(product.price * quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-zinc-430 block mt-0.5">
                      ou até 12x de R$ {((product.price * quantity * 1.12) / 12).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} no cartão
                    </span>
                  </div>

                  {!isOutOfStock && (
                    <div className="flex items-center rounded border border-white/10 bg-black/60 p-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-7 w-7 text-zinc-400 hover:text-white transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-zinc-100 font-mono">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="h-7 w-7 text-zinc-400 hover:text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className={`flex-1 h-11 flex items-center justify-center gap-2 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isOutOfStock
                        ? "bg-zinc-800 text-zinc-550 cursor-not-allowed"
                        : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-850 active:translate-y-px"
                    }`}
                  >
                    <ShoppingCart size={15} />
                    <span>Adicionar ao Carrinho</span>
                  </button>

                  <button
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className={`flex-1 h-11 flex items-center justify-center gap-2 rounded text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                      isOutOfStock
                        ? "bg-zinc-800 text-zinc-550 cursor-not-allowed"
                        : "bg-red-650 hover:bg-red-750 text-white shadow-lg shadow-black/20 active:translate-y-px"
                    }`}
                  >
                    <Check size={15} />
                    <span>Comprar Agora</span>
                  </button>
                </div>
                
                <p className="text-[9px] text-zinc-500 text-center mt-3 flex items-center justify-center gap-1">
                  <ShieldCheck size={11} className="text-emerald-500" />
                  <span>Venda restrita para maiores de 18 anos em conformidade com as diretrizes de segurança nacional.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
