import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiLogIn, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
    const { user, login, register, loginWithGoogle, resetPassword, loading: authLoading } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    // Already logged in → redirect
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (user) return <Navigate to="/" replace />;

    const errorMessages = {
        "auth/invalid-credential": "Correo o contraseña incorrectos",
        "auth/user-not-found": "No se encontró este usuario",
        "auth/wrong-password": "Contraseña incorrecta",
        "auth/too-many-requests": "Demasiados intentos. Espera un momento.",
        "auth/invalid-email": "Correo electrónico no válido",
        "auth/email-already-in-use": "Este correo ya está registrado",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres",
        "auth/popup-closed-by-user": "Se cerró la ventana de Google",
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            if (isRegister) {
                await register(email, password, nombre);
            } else {
                await login(email, password);
            }
        } catch (err) {
            setError(errorMessages[err.code] || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle() {
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (err) {
            setError(errorMessages[err.code] || "Error con Google");
        } finally {
            setLoading(false);
        }
    }

    async function handleResetPassword() {
        if (!email) {
            setError("Escribe tu correo arriba para recuperar la contraseña");
            return;
        }
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            await resetPassword(email);
            setSuccess("Se envió un correo para restablecer tu contraseña");
        } catch (err) {
            setError(errorMessages[err.code] || "Error al enviar correo de recuperación");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="
        min-h-screen flex items-center justify-center
        bg-gradient-to-br from-emerald-50 via-sky-50 to-emerald-100
        dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950
        px-4
      "
        >
            {/* Decorative halos */}
            <div className="pointer-events-none fixed -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-emerald-400/15 blur-[120px]" />
            <div className="pointer-events-none fixed -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-sky-400/10 blur-[100px]" />

            <div className="w-full max-w-md animate-fadeUp">
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-3">
                        <div className="absolute inset-0 bg-emerald-400/20 blur-xl rounded-full scale-125" />
                        <img
                            src="/lis-logo.png"
                            alt="Lis"
                            className="relative w-20 h-20 drop-shadow-lg"
                        />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
                        Lis
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {isRegister ? "Crea tu cuenta para comenzar" : "Accede a tu invernadero"}
                    </p>
                </div>

                {/* Card */}
                <form
                    onSubmit={handleSubmit}
                    className="glass rounded-2xl p-6 sm:p-8 shadow-xl space-y-5"
                >
                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200/60 dark:border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-300 animate-fadeUp">
                            {error}
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-800/40 rounded-xl px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 animate-fadeUp">
                            {success}
                        </div>
                    )}

                    {/* Name (only on register) */}
                    {isRegister && (
                        <div className="animate-fadeUp">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                                Nombre
                            </label>
                            <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/40 rounded-xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 focus-within:ring-2 focus-within:ring-emerald-500/40 transition">
                                <FiUser className="text-gray-400 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    placeholder="Tu nombre"
                                    required
                                    className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 text-sm placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    )}

                    {/* Email */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                            Correo electrónico
                        </label>
                        <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/40 rounded-xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 focus-within:ring-2 focus-within:ring-emerald-500/40 transition">
                            <FiMail className="text-gray-400 flex-shrink-0" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tu@correo.com"
                                required
                                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 text-sm placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                            Contraseña
                        </label>
                        <div className="flex items-center gap-3 bg-white/60 dark:bg-slate-800/40 rounded-xl px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 focus-within:ring-2 focus-within:ring-emerald-500/40 transition">
                            <FiLock className="text-gray-400 flex-shrink-0" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={6}
                                className="flex-1 bg-transparent outline-none text-gray-800 dark:text-gray-100 text-sm placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Forgot password (login mode only) */}
                    {!isRegister && (
                        <div className="text-right -mt-2">
                            <button
                                type="button"
                                onClick={handleResetPassword}
                                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="
              w-full py-3 rounded-xl text-sm font-semibold text-white
              bg-emerald-600 hover:bg-emerald-500
              shadow-lg shadow-emerald-600/20
              transition-all duration-200 active:scale-[0.97]
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
                    >
                        {loading ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        ) : (
                            <>
                                <FiLogIn />
                                {isRegister ? "Crear cuenta" : "Iniciar sesión"}
                            </>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        <span className="text-xs text-gray-400 dark:text-gray-500">o</span>
                        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={loading}
                        className="
              w-full py-3 rounded-xl text-sm font-semibold
              bg-white dark:bg-slate-800
              border border-gray-200 dark:border-gray-700
              text-gray-700 dark:text-gray-200
              hover:bg-gray-50 dark:hover:bg-slate-700
              shadow-sm hover:shadow-md
              transition-all duration-200 active:scale-[0.97]
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-3
            "
                    >
                        <FcGoogle className="text-lg" />
                        Continuar con Google
                    </button>

                    {/* Toggle login/register */}
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                        {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
                        <button
                            type="button"
                            onClick={() => { setIsRegister(!isRegister); setError(null); setSuccess(null); }}
                            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                        >
                            {isRegister ? "Inicia sesión" : "Crea una cuenta"}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
}
