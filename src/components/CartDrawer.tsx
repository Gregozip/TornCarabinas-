import React from "react";
import { Product } from "../types";
import { X, Trash2, ShoppingCart, MessageSquareCode, ArrowRight } from "lucide-react";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onOpenCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onOpenCheckout,
}) => {
  if (!isOpen) return null;

  const total = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);


  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
        <div className="w-screen max-w-md bg-[#0A0A0A] border-l border-white/10 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/40">
            <h3 className="text-sm font-black text-white hover:text-red-400 flex items-center gap-2 font-display uppercase tracking-widest">
              <ShoppingCart size={16} className="text-red-400" />
              <span>Seu Carrinho</span>
            </h3>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white rounded-full p-1.5 border border-white/10 bg-black/80 transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Cart item listing */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 bg-black border border-white/10 rounded-full flex items-center justify-center text-zinc-600">
                  <ShoppingCart size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-300 text-sm uppercase tracking-wider">Carrinho Vazio</h4>
                  <p className="text-[11px] text-zinc-500 max-w-[240px] mx-auto mt-1">
                    Explore nosso catálogo de carabinas de pressão, munições e acessórios para adicionar equipamentos.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 h-9 px-4 rounded bg-black hover:bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider text-red-400 font-mono transition-colors"
                >
                  Continuar Navegando
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-3 bg-white/5 border border-white/5 p-3 rounded hover:border-red-500/30 transition-all duration-200"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    className="h-14 w-14 rounded object-cover bg-black border border-white/10"
                    referrerPolicy="no-referrer"
                  />

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h4 className="font-bold text-zinc-200 text-xs line-clamp-1 uppercase tracking-tight">
                        {item.product.name}
                      </h4>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">
                        Calibre: {item.product.caliber || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center rounded bg-black border border-white/10 p-0.5">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                          className="h-5 w-5 text-zinc-500 hover:text-white font-mono text-center flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-[11px] font-bold text-zinc-350 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                          className="h-5 w-5 text-zinc-500 hover:text-white font-mono text-center flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="block text-xs font-semibold font-mono text-white">
                          R$ {(item.product.price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveItem(item.product.id)}
                    className="self-start text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-black"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Checkout Footer */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-white/10 bg-black space-y-4">
              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between text-[11px] text-zinc-550">
                  <span>Subtotal:</span>
                  <span className="text-zinc-300">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-[11px] text-zinc-550">
                  <span>Envio do Equipamento:</span>
                  <span className="text-emerald-400">A combinar via WhatsApp</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-white pt-2 border-t border-white/10 font-display uppercase tracking-widest">
                  <span>Valor Estimado:</span>
                  <span className="text-red-400">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={onOpenCheckout}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded bg-red-600 hover:bg-red-700 font-bold uppercase tracking-wider text-white text-xs transition-colors shadow-lg shadow-black/45 active:translate-y-px cursor-pointer"
                >
                  <MessageSquareCode size={15} />
                  <span>Finalizar Pedido — Detalhes</span>
                </button>

                <p className="text-[9px] text-zinc-500 text-center leading-normal">
                  Preencha os detalhes logísticos de entrega (autocompletados se logado) antes do envio para o WhatsApp da loja.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
