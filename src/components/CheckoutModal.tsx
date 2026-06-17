import React, { useState, useEffect } from "react";
import { Product, UserProfile } from "../types";
import { X, ShoppingBag, Send, Phone, Plus, Trash, User, Mail, ShieldAlert, Check, Copy, ArrowRight, ArrowLeft } from "lucide-react";
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
  // Step tracker: 1 for Delivery/Registration, 2 for Payment Option (Pix QR Code)
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // optional signup password
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
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Auto-fill fields if user is logged in, or load from localStorage if guest
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
      // Fallback to localStorage saved data
      try {
        const saved = localStorage.getItem("torn_last_checkout_info");
        if (saved) {
          const parsed = JSON.parse(saved);
          setName(parsed.name || "");
          setEmail(parsed.email || "");
          setCep(parsed.cep || "");
          setCpfCnpj(parsed.cpfCnpj || "");
          setCareOf(parsed.careOf || "");
          setStreet(parsed.street || "");
          setNumber(parsed.number || "");
          setComplement(parsed.complement || "");
          setNeighborhood(parsed.neighborhood || "");
          setState(parsed.state || "");
          setCity(parsed.city || "");
          setReference(parsed.reference || "");
          setPhones(parsed.phones && parsed.phones.length > 0 ? parsed.phones : [""]);
        } else {
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
      } catch (e) {
        console.error("Erro ao ler torn_last_checkout_info do localStorage:", e);
      }
    }
    setErrorMessage("");
    setStep(1); // Always open in step 1 (Shipping information)
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

  // Step 1 Submission: Save information and transition to payment option
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name || !email) {
      setErrorMessage("Por favor, preencha o Nome e E-mail de Envio obrigatórios.");
      return;
    }

    const cleanedPhones = phones.map(p => p.trim()).filter(Boolean);
    if (cleanedPhones.length === 0) {
      setErrorMessage("Informe pelo menos um número de contato ativo para a documentação técnica.");
      return;
    }

    setLoading(true);

    // Prepare information payload for storage
    const checkoutInfo = {
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
    };

    // Save to local storage so next time it fills automatically as requested!
    try {
      localStorage.setItem("torn_last_checkout_info", JSON.stringify(checkoutInfo));
    } catch (e) {
      console.error("Falha ao salvar dados de entrega localmente:", e);
    }

    try {
      // 1. If not logged in and a password is entered, perform inline registration
      if (!loggedUser && password.trim() !== "" && saveProfile) {
        try {
          const regRes = await fetch("/api/users/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
          });
          const regData = await regRes.json();
          if (regRes.ok && regData.success) {
            onLoginSuccess(regData.user);
            
            // Immediately sync profile details with address
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
          } else {
            console.warn("Conta automática não pôde ser criada:", regData.error);
          }
        } catch (innerErr) {
          console.error("Erro ao cadastrar usuário na etapa de avanço:", innerErr);
        }
      } 
      // 2. If logged in and save mode is active, sync address adjustments to backend database
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
        } catch (innerErr) {
          console.error("Erro ao sincronizar informações de entrega:", innerErr);
        }
      }

      // Transition smoothly to payment step!
      setStep(2);
    } catch (err: any) {
      setErrorMessage("Erro ao processar e salvar informações: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy Pix Copia e Cola to Clipboard
  const handleCopyPixKey = () => {
    const pixCode = `00020126580014br.gov.bcb.pix0136f1b1a20c-5182-4f33-911e-450f78d65c325204000053039865408${total.toFixed(2)}5802BR5914TORN CARABINAS6009SAO PAULO62070503***6304`;
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Final Step: Submit through to WhatsApp with prefilled message
  const handleFinalizeAndSendWhatsApp = () => {
    try {
      const cleanedPhones = phones.map(p => p.trim()).filter(Boolean);
      
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
      msg += `*STATUS DO PAGAMENTO:* Realizei a transferência de R$ ${total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no PIX para homologação do pedido! Segue comprovante abaixo.`;

      const encodedMsg = encodeURIComponent(msg);
      // WhatsApp Operator number 
      const whatsappUrl = `https://wa.me/5511999999999?text=${encodedMsg}`;
      window.open(whatsappUrl, "_blank");
      onClose();
    } catch (err: any) {
      setErrorMessage("Erro ao compilar pedido: " + err.message);
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
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-red-650/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <ShoppingBag size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                {step === 1 ? "Identificação & Envio Seguro" : "Opção de Pagamento Via Pix"}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">
                {step === 1 
                  ? "Informe seu endereço para atestado de trânsito e entrega militar" 
                  : "Por favor, realize a transferência para liberação do despacho no WhatsApp"}
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

        {/* Modal Progression indicator bar */}
        <div className="bg-zinc-950 border-b border-zinc-900 grid grid-cols-2 text-center text-xs font-semibold">
          <div className={`py-2 border-r border-zinc-900 flex justify-center items-center gap-2 ${step === 1 ? "text-red-500 bg-red-600/5 font-bold" : "text-zinc-500"}`}>
            <span className="h-4.5 w-4.5 rounded-full bg-zinc-900 border text-[9px] flex items-center justify-center border-red-550/30">1</span>
            <span>Identificação e Localização</span>
          </div>
          <div className={`py-2 flex justify-center items-center gap-2 ${step === 2 ? "text-red-500 bg-red-600/5 font-bold" : "text-zinc-500"}`}>
            <span className="h-4.5 w-4.5 rounded-full bg-zinc-900 border text-[9px] flex items-center justify-center border-red-550/30">2</span>
            <span>Opção de Pagamento Pix</span>
          </div>
        </div>

        {/* Form or Payment Display Area */}
        {step === 1 ? (
          <form onSubmit={handleProceedToPayment} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {errorMessage && (
              <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-lg font-mono">
                ⚠️ {errorMessage}
              </div>
            )}

            {loggedUser ? (
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/35 rounded-lg flex items-center gap-2 text-emerald-400 text-xs">
                <Check size={14} className="stroke-[2.5]" />
                <span>Dados do Perfil carregados e associados automaticamente para sua conveniência!</span>
              </div>
            ) : (
              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col gap-1 text-zinc-400 text-xs">
                <div className="flex items-center gap-2 text-zinc-350 font-semibold mb-0.5">
                  <ShieldAlert size={14} className="text-red-500" />
                  <span>Configuração de Conta Opcional</span>
                </div>
                <p className="leading-relaxed">
                  Para que suas informações sejam guardadas para suas próximas compras automaticamente, preencha uma senha abaixo do seu e-mail e nós criaremos seu atirador automaticamente!
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="col-span-1 md:col-span-2">
                <h4 className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider border-b border-zinc-900 pb-1 mb-2">
                  Destinatário & Informações Fiscais
                </h4>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                  Nome Completo / Entrega *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome na documentação militar"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 pl-8 text-xs text-zinc-300 focus:outline-none focus:border-red-650 font-sans"
                    required
                  />
                  <User size={12} className="absolute left-2.5 top-3 text-zinc-650" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                  E-mail de Notificação *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemplo@provedor.com"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 pl-8 text-xs text-zinc-300 focus:outline-none focus:border-red-650 font-sans"
                    required
                  />
                  <Mail size={12} className="absolute left-2.5 top-3 text-zinc-650" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                  CPF ou CNPJ (Obrigatório por lei) *
                </label>
                <input
                  type="text"
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  placeholder="Ex: 000.000.000-00 ou CNPJ"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650 font-mono"
                  required
                />
              </div>

              {!loggedUser && (
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Definir Senha de Acesso (Opcional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Para criar perfil e salvar dados para sempre"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650 font-sans"
                  />
                </div>
              )}

              <div className="col-span-1 md:col-span-2 pt-2">
                <h4 className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider border-b border-zinc-900 pb-1 mb-2">
                  Destino e Dados de Frete
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
                  placeholder="Ex: Apartamento do síndico, recepção, fundos..."
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
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
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650 font-mono"
                  required
                />
              </div>

              <div className="col-span-1 md:col-span-2">
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                      Rua / Avenida *
                    </label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Endereço de envio"
                      className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
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
                      className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650 font-mono"
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
                  placeholder="Ex: Apto 101, Sala 2"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
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
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                  Estado (UF) *
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Ex: SP"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650 font-mono"
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
                  placeholder="Ex: Próximo à base aérea ou praça militar"
                  className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-650"
                />
              </div>

              <div className="col-span-1 md:col-span-2 pt-2">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-1 mb-2">
                  <h4 className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
                    Telefones Oficiais de Contato *
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
                          className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 pl-8 text-xs text-zinc-300 focus:outline-none focus:border-red-650 font-mono"
                          required
                        />
                        <Phone size={11} className="absolute left-2.5 top-3 text-zinc-650" />
                      </div>
                      {phones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhoneField(idx)}
                          className="h-8 w-8 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Trash size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Save options check */}
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-950">
              <input
                type="checkbox"
                id="save-profile-check"
                checked={saveProfile}
                onChange={(e) => setSaveProfile(e.target.checked)}
                className="rounded accent-red-600 bg-zinc-950 border-zinc-850 h-3.5 w-3.5 cursor-pointer"
              />
              <label htmlFor="save-profile-check" className="text-[11px] text-zinc-400 select-none cursor-pointer">
                {loggedUser 
                  ? "Sincronizar e deixar esse endereço guardado no meu perfil de atirador" 
                  : "Se digitei uma senha acima, criar a conta e guardar estes dados automaticamente"}
              </label>
            </div>

            <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
              <div className="text-left font-mono">
                <span className="block text-[9px] text-zinc-500 uppercase">Subtotal</span>
                <span className="text-sm font-bold text-red-500">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="h-11 px-5 bg-red-650 hover:bg-red-750 text-xs font-bold uppercase tracking-wider text-white rounded shadow-lg flex items-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Ir para Opções de Pagamento</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* STEP 2: PAYMENT OPTION VIA PIX - IMEDIATELY APPEARS AFTER SUBMITTING STEP 1! */
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            <div className="p-4 bg-emerald-950/20 border border-emerald-900/35 rounded-xl text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <Check size={14} className="stroke-[2.5]" />
                <span>Dados de Envio Salvos!</span>
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                Prendemos e guardamos suas especificações de entrega com total confidencialidade de atirador. Nas próximas vezes esse endereço se auto-preencherá instantaneamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Box 1 (Left): Simulated Pix QR Code Generator */}
              <div className="md:col-span-5 flex flex-col items-center p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3.5 text-center">
                <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                  Aponte seu Aplicativo Bancário
                </span>
                
                {/* Simulated high-fidelity premium geometric pixelated QR Code vector */}
                <div className="p-3 bg-white rounded-lg shadow-inner">
                  <svg width="150" height="150" viewBox="0 0 150 150" className="mx-auto select-none" style={{ background: "#FFFFFF" }}>
                    <rect x="0" y="0" width="30" height="30" fill="#000" />
                    <rect x="5" y="5" width="20" height="20" fill="#fff" />
                    <rect x="10" y="10" width="10" height="10" fill="#000" />

                    <rect x="120" y="0" width="30" height="30" fill="#000" />
                    <rect x="125" y="5" width="20" height="20" fill="#fff" />
                    <rect x="130" y="10" width="10" height="10" fill="#000" />

                    <rect x="0" y="120" width="30" height="30" fill="#000" />
                    <rect x="5" y="125" width="20" height="20" fill="#fff" />
                    <rect x="10" y="130" width="10" height="10" fill="#000" />

                    {/* Styled internal random block dots to simulate real QR payload */}
                    <rect x="15" y="40" width="10" height="10" fill="#000" />
                    <rect x="40" y="15" width="10" height="25" fill="#000" />
                    <rect x="55" y="5" width="15" height="10" fill="#000" />
                    <rect x="80" y="20" width="10" height="15" fill="#000" />
                    <rect x="95" y="0" width="15" height="30" fill="#000" />
                    <rect x="40" y="50" width="20" height="10" fill="#000" />
                    <rect x="5" y="80" width="15" height="10" fill="#000" />
                    <rect x="30" y="70" width="25" height="15" fill="#000" />
                    <rect x="70" y="60" width="15" height="35" fill="#000" />
                    <rect x="90" y="50" width="30" height="10" fill="#000" />
                    <rect x="110" y="75" width="15" height="20" fill="#000" />
                    <rect x="135" y="40" width="15" height="25" fill="#000" />

                    <rect x="40" y="105" width="25" height="15" fill="#000" />
                    <rect x="10" y="105" width="15" height="10" fill="#000" />
                    <rect x="75" y="110" width="30" height="10" fill="#000" />
                    <rect x="115" y="115" width="20" height="15" fill="#000" />
                    <rect x="135" y="100" width="15" height="30" fill="#000" />
                    <rect x="100" y="135" width="35" height="15" fill="#000" />
                    <rect x="40" y="130" width="30" height="10" fill="#000" />
                  </svg>
                </div>

                <div className="text-center">
                  <span className="block text-zinc-500 font-mono text-[9px] uppercase">Total Líquido</span>
                  <span className="text-base font-black text-white font-mono">
                    R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Box 2 (Right): Instructions, bank, copy-paste */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <h4 className="text-zinc-300 font-bold text-xs uppercase tracking-wider mb-2 font-display">
                    Instruções de Pagamento Pix
                  </h4>
                  <ol className="text-[11px] text-zinc-400 space-y-2 list-decimal list-inside leading-relaxed">
                    <li>Abra o aplicativo do seu banco preferido e acesse o menu <strong>Pix</strong>.</li>
                    <li>Escolha a opção de <strong>Escanear QR Code</strong> ou selecione <strong>Pix Copia e Cola</strong>.</li>
                    <li>Utilize as informações do lado esquerdo ou clique abaixo na chave de cópia.</li>
                    <li>Realize a transferência total de <strong className="text-red-400">R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>.</li>
                    <li>Clique no botão final para enviar no WhatsApp e encaminhe o comprovante!</li>
                  </ol>
                </div>

                {/* Bank / Beneficiary Details */}
                <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Beneficiário:</span>
                    <span className="text-zinc-300 font-medium font-sans">TORN CARABINAS LTDA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">CNPJ cadastrado:</span>
                    <span className="text-zinc-300 font-mono font-medium">12.345.678/0001-90</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Instituição:</span>
                    <span className="text-zinc-300 font-sans font-medium">Banco Central do Brasil</span>
                  </div>
                </div>

                {/* Pix Key copy-paste field */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                    Chave Pix Copia e Cola
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`00020126580014br.gov.bcb.pix0136f1b1a20c-5182-4f33-911e-[...]`}
                      className="flex-1 bg-zinc-950 border border-zinc-850 rounded p-2 text-[11px] text-zinc-400 focus:outline-none font-mono select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPixKey}
                      className="px-3 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-400 transition-colors flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span className="text-emerald-500 text-[10px]">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span className="text-[10px]">Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

            </div>

            {/* Step 2 Bottom Controls */}
            <div className="pt-4 border-t border-zinc-900 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="h-10 px-4 rounded border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:text-white text-zinc-400 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                <ArrowLeft size={13} />
                <span>Voltar e Editar Dados</span>
              </button>

              <button
                type="button"
                onClick={handleFinalizeAndSendWhatsApp}
                className="h-11 px-6 bg-red-650 hover:bg-red-750 text-xs font-bold uppercase tracking-wider text-white rounded shadow-lg shadow-black/80 flex items-center gap-2 transition-colors cursor-pointer active:scale-98 animate-pulse"
              >
                <Send size={13} />
                <span>Enviar Comprovante & Concluir Pedido</span>
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
