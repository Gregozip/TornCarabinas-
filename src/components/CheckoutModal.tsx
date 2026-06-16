import React, { useState, useEffect } from "react";
import { Product, UserProfile } from "../types";
import { X, ShoppingBag, Send, Phone, Plus, Trash, User, Mail, ShieldAlert, Check } from "lucide-react";
import { motion } from "motion/react";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  loggedUser: UserProfile | null;
  cartItems: CartItem[];
  total: number;
  onLoginSuccess: (user: UserProfile) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  loggedUser,
  cartItems,
  total,
  onLoginSuccess,
}) => {
  // Checkout Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // optional signup senha
  const [cep, setCep] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [careOf, setCareOf] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [reference, setReference] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);

  const [saveProfile, setSaveProfile] = useState(true);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-fill fields if user is logged in
  useEffect(() => {
    if (loggedUser) {
      setName(loggedUser.name || "");
      setEmail(loggedUser.email || "");
      setCep(loggedUser.cep || "");
      setCpfCnpj(loggedUser.cpfCnpj || "");
      setCareOf(loggedUser.careOf || "");
      setStreet(loggedUser.street || "");
      setNumber(loggedUser.number || "");
      setComplement(loggedUser.complement || "");
      setNeighborhood(loggedUser.neighborhood || "");
      setState(loggedUser.state || "");
      setCity(loggedUser.city || "");
      setReference(loggedUser.reference || "");
      setPhones(loggedUser.phones && loggedUser.phones.length > 0 ? loggedUser.phones : [""]);
    } else {
      // Clear fields if no user is connected so they can fill from scratch
      setName("");
      setEmail("");
      setCep("");
      setCpfCnpj("");
      setCareOf("");
      setStreet("");
      setNumber("");
      setComplement("");
      setNeighborhood("");
      setState("");
      setCity("");
      setReference("");
      setPhones([""]);
    }
    setErrorMessage("");
    setInfoMessage("");
  }, [loggedUser, isOpen]);

  if (!isOpen) return null;

  const addPhoneField = () => {
    setPhones([...phones, ""]);
  };

  const removePhoneField = (index: number) => {
    const updated = phones.filter((_, idx) => idx !== index);
    setPhones(updated.length > 0 ? updated : [""]);
  };

  const handlePhoneChange = (index: number, value: string) => {
    const updated = [...phones];
    updated[index] = value;
    setPhones(updated);
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (!name || !email) {
      setErrorMessage("Por favor, preencha pelo menos o Nome e E-mail de Envio.");
      return;
    }

    const cleanedPhones = phones.map(p => p.trim()).filter(Boolean);
    if (cleanedPhones.length === 0) {
      setErrorMessage("Por favor, informe no menos de um número de contato ativo.");
      return;
    }

    setLoading(true);

    try {
      // 1. If NOT logged in and password is provided, perform an inline registration!
      if (!loggedUser && password.trim() !== "" && saveProfile) {
        try {
          const regRes = await fetch("/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const regData = await regRes.json();
          if (regRes.ok && regData.success) {
            // Log user in automatically!
            onLoginSuccess(regData.user);
            
            // Now save all address parameters to this newly registered account automatically!
            await fetch("/api/users/profile", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: regData.user.id,
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
                phones: cleanedPhones,
              }),
            });
          }
        } catch (innerError) {
          console.error("Erro no cadastro em tempo de checkout:", innerError);
        }
      } 
      // 2. If already logged in, automatically sync any address modifications to their persistent profile!
      else if (loggedUser && saveProfile) {
        try {
          const syncRes = await fetch("/api/users/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: loggedUser.id,
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
              phones: cleanedPhones,
            }),
          });
          const syncData = await syncRes.json();
          if (syncRes.ok && syncData.success) {
            onLoginSuccess(syncData.user);
          }
        } catch (innerError) {
          console.error("Erro ao sincronizar informações com o perfil:", innerError);
        }
      }

      // Generate structured shipping message
      let msg = `*PEDIDO TORN CARABINAS*\n`;
      msg += `==================================\n`;
      msg += `*DADOS DO CLIENTE*\n`;
      msg += `• *Nome:* ${name.trim()}\n`;
      msg += `• *E-mail:* ${email.trim()}\n`;
      if (cpfCnpj) msg += `• *CPF/CNPJ:* ${cpfCnpj.trim()}\n`;
      
      msg += `\n*CONTATO TELEFÔNICO*\n`;
      cleanedPhones.forEach((phone, index) => {
        msg += `• Telefone ${index + 1}: ${phone.trim()}\n`;
      });

      msg += `\n*ENDEREÇO DE ENTREGA DE EQUIPAMENTO*\n`;
      if (careOf) msg += `• *Aos Cuidados:* ${careOf.trim()}\n`;
      msg += `• *CEP:* ${cep.trim() || "Não especificado"}\n`;
      msg += `• *Rua:* ${street.trim() || "Não especificada"}, N° ${number.trim() || "S/N"}\n`;
      if (complement) msg += `• *Complemento:* ${complement.trim()}\n`;
      msg += `• *Bairro:* ${neighborhood.trim() || "Não informado"}\n`;
      msg += `• *Cidade/UF:* ${city.trim() || "Não informada"} - ${state.toUpperCase().trim() || "N/A"}\n`;
      if (reference) msg += `• *Ponto de Referência:* ${reference.trim()}\n`;

      msg += `\n*PRODUTOS SOLICITADOS*\n`;
      cartItems.forEach((item, index) => {
        msg += `[${index + 1}] *${item.product.name}*\n`;
        msg += `    Quantidade: ${item.quantity}x | Valor: R$ ${(item.product.price * item.quantity).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n`;
        if (item.product.caliber && item.product.caliber !== "N/A") {
          msg += `    Calibre: ${item.product.caliber}\n`;
        }
      });

      msg += `\n==================================\n`;
      msg += `*VALOR TOTAL ESTIMADO:* R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}\n`;
      msg += `==================================\n`;
      msg += `Por favor, confirmem o cálculo do frete e os detalhes de pagamento via PIX!`;

      const encodedMsg = encodeURIComponent(msg);
      // Hardcoded or default WhatsApp Operator number
      const whatsappUrl = `https://wa.me/5511999999999?text=${encodedMsg}`;
      
      // Open in a new window/tab safely
      window.open(whatsappUrl, "_blank");
      onClose();
    } catch (err: any) {
      setErrorMessage("Erro ao compilar pedido: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-xs" 
        id="checkout-modal-backdrop"
      />

      {/* Main Container */}
      <div 
        className="relative bg-[#0C0C0C] border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl z-10"
        id="checkout-modal-container"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-900 bg-zinc-950 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                Formulário de Checkout & Entrega
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">
                Informe o local seguro para o envio e preenchimento dos certificados de tiro
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white border border-zinc-800 bg-zinc-900 rounded p-1 transition-colors"
            id="btn-close-checkout-modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Element */}
        <form onSubmit={handleSubmitCheckout} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {errorMessage && (
            <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-lg font-mono">
              ⚠️ {errorMessage}
            </div>
          )}

          {loggedUser ? (
            <div className="p-3 bg-red-600/10 border border-red-600/20 rounded-lg flex items-center gap-2 text-red-400 text-xs">
              <Check size={14} className="stroke-[2.5]" />
              <span>Sessão de Atirador Conectada: E-mail e Nome autofilados com sucesso!</span>
            </div>
          ) : (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-1.5 text-zinc-400 text-xs">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold mb-0.5">
                <ShieldAlert size={14} className="text-red-500" />
                <span>Cadastro Opcional Integrado</span>
              </div>
              <p className="leading-relaxed">
                Você não está logado. Se desejar salvar estes dados de endereço e telefone para compras futuras, basta preencher uma senha abaixo de e-mail. Nós criaremos seu perfil de forma automática!
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Section 1: Customer info */}
            <div className="col-span-1 md:col-span-2">
              <h4 className="text-zinc-400 font-mono text-[9.5px] uppercase tracking-wider border-b border-zinc-900 pb-1 mb-2">
                Informações de Registro & Facturação
              </h4>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                Nome de Entrega / Destinatário *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome que irá constar na documentação"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 pl-8 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                  required
                />
                <User size={12} className="absolute left-2.5 top-3 text-zinc-650" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                E-mail para Nota Fiscal *
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@provedor.com"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 pl-8 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                  required
                />
                <Mail size={12} className="absolute left-2.5 top-3 text-zinc-650" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                CPF ou CNPJ
              </label>
              <input
                type="text"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="Ex: 000.000.000-00 ou CNPJ"
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
              />
            </div>

            {!loggedUser && (
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                  Definir Senha (Se deseja se registrar)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Defina uma senha se quer cadastrar agora"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                />
              </div>
            )}

            {/* Section 2: Address info */}
            <div className="col-span-1 md:col-span-2 pt-2">
              <h4 className="text-zinc-400 font-mono text-[9.5px] uppercase tracking-wider border-b border-zinc-900 pb-1 mb-2">
                Endereço Logístico de Envio
              </h4>
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                Aos Cuidados De
              </label>
              <input
                type="text"
                value={careOf}
                onChange={(e) => setCareOf(e.target.value)}
                placeholder="Ex: Apartamento do síndico, escritório, recepção..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                CEP Logístico *
              </label>
              <input
                type="text"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Nome da Rua / Avenida *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Logradouro"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="N°"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                Complemento
              </label>
              <input
                type="text"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
                placeholder="Ex: Apto 101, Fundos, Sala 3"
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                Bairro de Envio *
              </label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Nome do Bairro"
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                Cidade *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cidade"
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                Estado / UF *
              </label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Ex: SP"
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                required
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                Ponto de Referência
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: Próximo à praça principal"
                className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
              />
            </div>

            {/* Section 3: Contact phones */}
            <div className="col-span-1 md:col-span-2 pt-2">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-1 mb-2">
                <h4 className="text-zinc-400 font-mono text-[9.5px] uppercase tracking-wider">
                  Telefones Balísticos de Contato *
                </h4>
                <button
                  type="button"
                  onClick={addPhoneField}
                  className="text-[9px] font-mono font-bold uppercase tracking-wider text-red-500 hover:text-red-400 flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded transition-all cursor-pointer"
                >
                  <Plus size={10} />
                  <span>Adicionar</span>
                </button>
              </div>

              <div className="space-y-2">
                {phones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => handlePhoneChange(idx, e.target.value)}
                        placeholder="(DD) 99999-9999"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 pl-8 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                        required
                      />
                      <Phone size={11} className="absolute left-2.5 top-3 text-zinc-650" />
                    </div>
                    {phones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhoneField(idx)}
                        className="h-8 w-8 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer animate-fade-in"
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sync switch */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="save-profile-check"
              checked={saveProfile}
              onChange={(e) => setSaveProfile(e.target.checked)}
              className="rounded accent-red-600 bg-zinc-950 border-zinc-850 h-3.5 w-3.5"
            />
            <label htmlFor="save-profile-check" className="text-xs text-zinc-400 select-none cursor-pointer">
              {loggedUser 
                ? "Sincronizar e salvar atualizações neste endereço no meu perfil" 
                : "Se eu digitei uma senha acima, registrar e salvar meu endereço no perfil automaticamente."}
            </label>
          </div>

          <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
            <div className="text-left font-mono">
              <span className="block text-[10px] text-zinc-500 uppercase">Total Estimado</span>
              <span className="text-sm font-bold text-red-500">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-11 px-6 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded shadow-lg shadow-black/50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={13} />
                  <span>Concluir e Enviar no WhatsApp</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
