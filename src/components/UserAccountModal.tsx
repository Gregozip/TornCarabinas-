import React, { useState } from "react";
import { UserProfile } from "../types";
import { X, Lock, Mail, User, ShieldCheck, Phone, Plus, Trash, Check, UserCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  loggedUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  loggedUser,
  onLoginSuccess,
  onLogout,
}) => {
  const [mode, setMode] = useState<"login" | "register" | "profile" | "forgot">(
    loggedUser ? "profile" : "login"
  );

  // Auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [name, setName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryInstructions, setRecoveryInstructions] = useState("");

  // Profile fields (used when logged in)
  const [profName, setProfName] = useState(loggedUser?.name || "");
  const [profEmail, setProfEmail] = useState(loggedUser?.email || "");
  const [profCep, setProfCep] = useState(loggedUser?.cep || "");
  const [profCpfCnpj, setProfCpfCnpj] = useState(loggedUser?.cpfCnpj || "");
  const [profCareOf, setProfCareOf] = useState(loggedUser?.careOf || "");
  const [profStreet, setProfStreet] = useState(loggedUser?.street || "");
  const [profNumber, setProfNumber] = useState(loggedUser?.number || "");
  const [profComplement, setProfComplement] = useState(loggedUser?.complement || "");
  const [profNeighborhood, setProfNeighborhood] = useState(loggedUser?.neighborhood || "");
  const [profState, setProfState] = useState(loggedUser?.state || "");
  const [profCity, setProfCity] = useState(loggedUser?.city || "");
  const [profReference, setProfReference] = useState(loggedUser?.reference || "");
  const [profPhones, setProfPhones] = useState<string[]>(loggedUser?.phones || [""]);
  const [profPassword, setProfPassword] = useState("");

  // Sync state if loggedUser changes
  React.useEffect(() => {
    if (loggedUser) {
      setMode("profile");
      setProfName(loggedUser.name || "");
      setProfEmail(loggedUser.email || "");
      setProfCep(loggedUser.cep || "");
      setProfCpfCnpj(loggedUser.cpfCnpj || "");
      setProfCareOf(loggedUser.careOf || "");
      setProfStreet(loggedUser.street || "");
      setProfNumber(loggedUser.number || "");
      setProfComplement(loggedUser.complement || "");
      setProfNeighborhood(loggedUser.neighborhood || "");
      setProfState(loggedUser.state || "");
      setProfCity(loggedUser.city || "");
      setProfReference(loggedUser.reference || "");
      setProfPhones(loggedUser.phones && loggedUser.phones.length > 0 ? loggedUser.phones : [""]);
    } else {
      setMode("login");
    }
    setErrorMsg("");
    setSuccessMsg("");
  }, [loggedUser]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Por favor, informe seu e-mail e sua senha.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao fazer login");
      }
      onLoginSuccess(data.user);
      setSuccessMsg("Acesso concedido com sucesso!");
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg("Todos os campos de cadastro são de preenchimento obrigatório.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As senhas preenchidas não coincidem. Digite-as novamente.");
      return;
    }
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro no registro do usuário");
      }
      onLoginSuccess(data.user);
      setSuccessMsg("Conta criada com sucesso! Aproveite.");
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail) {
      setErrorMsg("Por favor, preencha o endereço de e-mail.");
      return;
    }
    setErrorMsg("");
    setSuccessMsg("");
    setRecoveryInstructions("");
    setLoading(true);

    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recoveryEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao recuperar senha");
      }
      setSuccessMsg(data.message);
      if (data.debugInstructions) {
        setRecoveryInstructions(data.debugInstructions);
      }
      setRecoveryEmail("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedUser) return;
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    // Clean empty phone strings
    const cleanedPhones = profPhones.map(p => p.trim()).filter(Boolean);

    try {
      const updateData: any = {
        id: loggedUser.id,
        name: profName,
        email: profEmail,
        cep: profCep,
        cpfCnpj: profCpfCnpj,
        careOf: profCareOf,
        street: profStreet,
        number: profNumber,
        complement: profComplement,
        neighborhood: profNeighborhood,
        state: profState,
        city: profCity,
        reference: profReference,
        phones: cleanedPhones,
      };

      if (profPassword.trim() !== "") {
        updateData.password = profPassword;
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar dados.");
      }
      onLoginSuccess(data.user);
      setSuccessMsg("Dados cadastrais salvos de forma segura!");
      setProfPassword("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addPhoneField = () => {
    setProfPhones([...profPhones, ""]);
  };

  const removePhoneField = (index: number) => {
    const newVal = profPhones.filter((_, idx) => idx !== index);
    setProfPhones(newVal.length > 0 ? newVal : [""]);
  };

  const handlePhoneChange = (index: number, val: string) => {
    const updated = [...profPhones];
    updated[index] = val;
    setProfPhones(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-xs"
        id="account-modal-backdrop"
      />

      {/* Main Card Frame */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="relative bg-[#0C0C0C] border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl z-10"
        id="account-modal-container"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-900 bg-zinc-950 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-red-600/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <UserCircle2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                {mode === "profile" ? "Seu Perfil de Atirador" : "Autenticação De Atiradores"}
              </h3>
              <p className="text-[10px] text-zinc-500 font-mono">
                {mode === "profile" 
                  ? "Gerencie suas informações para envios expressos" 
                  : "Entre ou crie uma conta em poucos cliques"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white border border-zinc-800 bg-zinc-900 rounded p-1 transition-colors"
            id="btn-close-account-modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/30 border border-red-900/40 text-red-400 text-xs rounded-lg font-mono">
              ⚠️ {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 text-xs rounded-lg font-mono flex items-center gap-1.5 animate-pulse">
              <Check size={14} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN VIEW */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Endereço de E-mail
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg py-2.5 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono placeholder:text-zinc-700"
                      required
                      id="login-email-input"
                    />
                    <Mail size={13} className="absolute left-3 top-3.5 text-zinc-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Senha de Segurança
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg py-2.5 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono placeholder:text-zinc-700"
                      required
                      id="login-password-input"
                    />
                    <Lock size={13} className="absolute left-3 top-3.5 text-zinc-600" />
                  </div>
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setErrorMsg("");
                        setSuccessMsg("");
                        setRecoveryInstructions("");
                      }}
                      className="text-[10px] text-zinc-500 hover:text-red-400 font-mono transition-colors cursor-pointer"
                      id="btn-switch-to-forgot"
                    >
                      Esqueceu sua senha? Clique aqui para recuperar
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors shadow-lg shadow-black/45 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-login-submit"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Conectar ao Painel</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-zinc-500 text-xs">
                  Não possui cadastro?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                    id="btn-switch-to-register"
                  >
                    Crie sua conta de atirador aqui
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* REGISTER VIEW */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Seu Nome Completo
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Albuquerque de Moura"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg py-2.5 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono placeholder:text-zinc-700"
                      required
                      id="register-name-input"
                    />
                    <User size={13} className="absolute left-3 top-3.5 text-zinc-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Seu Melhor E-mail
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg py-2.5 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono placeholder:text-zinc-700"
                      required
                      id="register-email-input"
                    />
                    <Mail size={13} className="absolute left-3 top-3.5 text-zinc-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Definir Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres recomendados"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg py-2.5 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono placeholder:text-zinc-700"
                      required
                      id="register-password-input"
                    />
                    <Lock size={13} className="absolute left-3 top-3.5 text-zinc-600" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Confirmar Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Redigite exatamente a mesma senha"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg py-2.5 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono placeholder:text-zinc-700"
                      required
                      id="register-confirm-password-input"
                    />
                    <Lock size={13} className="absolute left-3 top-3.5 text-zinc-600" />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors shadow-lg shadow-black/45 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-register-submit"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={14} />
                      <span>Cadastrar Nova Conta</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-zinc-500 text-xs">
                  Já possui uma conta?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className="text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                    id="btn-switch-to-login"
                  >
                    Realize o login por aqui
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD VIEW */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 leading-normal">
                  Esqueceu sua senha? Não se preocupe! Informe o e-mail cadastrado na sua conta de atirador e nós geraremos instruções seguras e um código de redefinição para restaurar seu acesso imediatamente.
                </p>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-400 mb-1.5">
                    Endereço de E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-zinc-950 border border-zinc-805 rounded-lg py-2.5 pl-9 pr-4 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono placeholder:text-zinc-700"
                      required
                      id="recovery-email-input"
                    />
                    <Mail size={13} className="absolute left-3 top-3.5 text-zinc-600" />
                  </div>
                </div>
              </div>

              {recoveryInstructions && (
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2 font-mono">
                  <div className="text-[10px] uppercase text-red-400 font-bold tracking-wider flex items-center gap-1">
                    <Check size={12} />
                    <span>E-mail Enviado com Sucesso (Simulação Local)</span>
                  </div>
                  <pre className="text-[10px] text-zinc-300 whitespace-pre-wrap leading-relaxed select-all bg-black p-2.5 rounded border border-zinc-850 overflow-x-auto">
                    {recoveryInstructions}
                  </pre>
                  <p className="text-[9px] text-zinc-500 leading-normal">
                    *Como este é um ambiente de demonstração blindado, o servidor redefiniu sua senha de forma segura e gerou as instruções acima para você copiar e usar para entrar na sua conta agora mesmo!
                  </p>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors shadow-lg shadow-black/45 flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-forgot-submit"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mail size={14} />
                      <span>Gerar e Enviar Instruções por E-mail</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMsg("");
                    setSuccessMsg("");
                    setRecoveryInstructions("");
                  }}
                  className="w-full h-10 border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400 hover:text-white uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer"
                  id="btn-back-to-login"
                >
                  Voltar para o Login
                </button>
              </div>
            </form>
          )}

          {/* LOGGED PROFILE VIEW & ADDRESS MANAGEMENT */}
          {mode === "profile" && loggedUser && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Basic Personal details */}
                <div className="col-span-1 md:col-span-2">
                  <h4 className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider border-b border-zinc-900 pb-1 mb-3">
                    Informações Gerais
                  </h4>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    required
                    id="prof-name-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    E-mail de Cadastro
                  </label>
                  <input
                    type="email"
                    value={profEmail}
                    onChange={(e) => setProfEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    required
                    id="prof-email-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={profCpfCnpj}
                    onChange={(e) => setProfCpfCnpj(e.target.value)}
                    placeholder="Ex: 000.000.000-00"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                    id="prof-cpfnpj-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Alterar Senha (Opcional)
                  </label>
                  <input
                    type="password"
                    value={profPassword}
                    onChange={(e) => setProfPassword(e.target.value)}
                    placeholder="Deixe vazio para manter atual"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    id="prof-password-change"
                  />
                </div>

                {/* Shipping details */}
                <div className="col-span-1 md:col-span-2 pt-2">
                  <h4 className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider border-b border-zinc-900 pb-1 mb-3">
                    Endereço de Entrega Completo
                  </h4>
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Aos Cuidados De (Destinatário Opcional)
                  </label>
                  <input
                    type="text"
                    value={profCareOf}
                    onChange={(e) => setProfCareOf(e.target.value)}
                    placeholder="Ex: Sócio do Clube, Familiar, Recepção..."
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    id="prof-careof-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    CEP
                  </label>
                  <input
                    type="text"
                    value={profCep}
                    onChange={(e) => setProfCep(e.target.value)}
                    placeholder="00000-000"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                    id="prof-cep-input"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                        Rua / Logradouro
                      </label>
                      <input
                        type="text"
                        value={profStreet}
                        onChange={(e) => setProfStreet(e.target.value)}
                        placeholder="Nome da avenida ou rua"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                        id="prof-street-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        value={profNumber}
                        onChange={(e) => setProfNumber(e.target.value)}
                        placeholder="N°"
                        className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                        id="prof-num-input"
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
                    value={profComplement}
                    onChange={(e) => setProfComplement(e.target.value)}
                    placeholder="Bloco, Apto, Sala, etc."
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    id="prof-comp-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Bairro
                  </label>
                  <input
                    type="text"
                    value={profNeighborhood}
                    onChange={(e) => setProfNeighborhood(e.target.value)}
                    placeholder="Bairro"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    id="prof-bairro-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={profCity}
                    onChange={(e) => setProfCity(e.target.value)}
                    placeholder="Cidade"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    id="prof-city-input"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Estado (Conforme UF)
                  </label>
                  <input
                    type="text"
                    value={profState}
                    onChange={(e) => setProfState(e.target.value)}
                    placeholder="Ex: SP, RJ, MG"
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                    id="prof-state-input"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-zinc-500 mb-1">
                    Ponto de Referência
                  </label>
                  <input
                    type="text"
                    value={profReference}
                    onChange={(e) => setProfReference(e.target.value)}
                    placeholder="Perto do posto, em frente ao mercado..."
                    className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-sans"
                    id="prof-ref-input"
                  />
                </div>

                {/* Phone numbers list with interactive adding / removing */}
                <div className="col-span-1 md:col-span-2 pt-2">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-1 mb-3">
                    <h4 className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
                      Telefones de Contato
                    </h4>
                    <button
                      type="button"
                      onClick={addPhoneField}
                      className="text-[9px] font-mono font-bold uppercase tracking-wider text-red-400 hover:text-red-300 flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded transition-all cursor-pointer"
                      id="btn-add-phone-field"
                    >
                      <Plus size={10} />
                      <span>Adicionar Telefone</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {profPhones.map((phone, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => handlePhoneChange(idx, e.target.value)}
                            placeholder="(DD) 99999-9999"
                            className="w-full bg-zinc-950 border border-zinc-850 rounded p-2 pl-8 text-xs text-zinc-300 focus:outline-none focus:border-red-600 font-mono"
                            required
                            id={`prof-phone-input-${idx}`}
                          />
                          <Phone size={11} className="absolute left-2.5 top-3 text-zinc-650" />
                        </div>
                        {profPhones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhoneField(idx)}
                            className="h-8 w-8 rounded bg-zinc-900 border border-zinc-850 text-zinc-500 hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
                            title="Remover este Telefone"
                            id={`btn-remove-phone-${idx}`}
                          >
                            <Trash size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-zinc-900 justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-zinc-950 border border-zinc-850 text-zinc-500 hover:text-red-400 font-bold uppercase tracking-wider text-[10px] rounded hover:bg-black transition-all cursor-pointer"
                  id="btn-logout-profiler"
                >
                  Sair do Perfil / Desconectar
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto h-10 px-5 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-wider text-white rounded transition-all shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                  id="btn-save-pro-settings"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Salvar Perfil Seguro</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </motion.div>
    </div>
  );
};
