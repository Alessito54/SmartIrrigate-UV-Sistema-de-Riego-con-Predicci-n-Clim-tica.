import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiLogIn, FiUser, FiX } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { PROJECT_NAME, PROJECT_LOGO } from "../config";
import bgImage from "../assets/images/campo-agricola.jpg";

export default function Login() {
    const { user, login, register, loginWithGoogle, resetPassword, loading: authLoading } = useAuth();
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [nombre, setNombre] = useState("");
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    // Already logged in → redirect
    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    if (user) return <Navigate to="/dashboard" replace />;

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

        if (isRegister && !acceptTerms) {
            setError("Debes aceptar los Términos y Condiciones para crear tu cuenta.");
            return;
        }

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
        <div className="min-h-screen flex text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-950">
            {/* ─── Left Side: Branding / Image ───────────────────────────── */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between overflow-hidden bg-slate-900">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <img
                        src={bgImage}
                        alt="Campo agrícola"
                        className="w-full h-full object-cover scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 flex flex-col justify-end via-slate-900/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-emerald-900/30 mix-blend-multiply"></div>
                </div>

                {/* Top Logo */}
                <div className="relative z-10 p-12 animate-fadeUp">
                    <div className="flex items-center gap-3">
                        <img src={PROJECT_LOGO} alt={PROJECT_NAME} className="w-12 h-12 drop-shadow-2xl" />
                        <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{PROJECT_NAME}</h1>
                    </div>
                </div>

                {/* Bottom Text */}
                <div className="relative z-10 p-12 pb-20 max-w-lg animate-fadeUp delay-100">
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6 drop-shadow-2xl">
                        Inteligencia<br />
                        <span className="text-emerald-400">agrícola</span> a tu alcance.
                    </h2>
                    <p className="text-lg text-emerald-50/80 drop-shadow-md">
                        Monitorea tu invernadero, automatiza tus riegos, y maximiza tu producción con datos climáticos en tiempo real.
                    </p>
                </div>
            </div>

            {/* ─── Right Side: Form ──────────────────────────────────────── */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-24 relative">

                {/* Mobile BG Decorative - only visible on small screens */}
                <div className="lg:hidden absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-sky-50 to-emerald-100 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950" />
                <div className="lg:hidden absolute top-0 right-0 w-[40vw] h-[40vw] max-w-[300px] bg-emerald-400/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 -z-10" />

                <div className="w-full max-w-md animate-fadeUp">

                    {/* Header (visible more on mobile, subtle on desktop) */}
                    <div className="mb-10 lg:mb-12">
                        <div className="lg:hidden flex items-center gap-3 mb-8">
                            <img src={PROJECT_LOGO} alt={PROJECT_NAME} className="w-10 h-10 drop-shadow-md" />
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{PROJECT_NAME}</h1>
                        </div>
                        <h2 className="text-3xl font-extrabold tracking-tight mb-2">
                            {isRegister ? "Crear cuenta" : "Bienvenido de nuevo"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {isRegister ? "Comienza a optimizar tus cultivos hoy mismo." : "Ingresa tus datos para acceder a tu panel."}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Alerts */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex gap-3 text-red-700 dark:text-red-400 animate-fadeUp text-sm shadow-sm font-medium">
                                ⚠️ <span>{error}</span>
                            </div>
                        )}
                        {success && (
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 flex gap-3 text-emerald-700 dark:text-emerald-400 animate-fadeUp text-sm shadow-sm font-medium">
                                ✓ <span>{success}</span>
                            </div>
                        )}

                        {/* Name Field (Register) */}
                        {isRegister && (
                            <div className="space-y-1.5 animate-fadeUp">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Nombre completo</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FiUser className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        placeholder="Ej. Juan Pérez"
                                        required
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Correo electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiMail className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@correo.com"
                                    required
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Contraseña</label>
                                {!isRegister && (
                                    <button
                                        type="button"
                                        onClick={handleResetPassword}
                                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <FiLock className="text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        {/* Terms (Register) */}
                        {isRegister && (
                            <div className="flex items-start gap-3 pt-2 animate-fadeUp">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={acceptTerms}
                                    onChange={(e) => setAcceptTerms(e.target.checked)}
                                    className="mt-1 flex-shrink-0 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                                <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                                    Acepto los{" "}
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                                        className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                                    >
                                        Términos y Condiciones
                                    </button>
                                    {" "}al registrarme en la plataforma.
                                </label>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isRegister ? "Crear cuenta gratuita" : "Ingresar a mi cuenta"}
                                        <div className="group-hover:translate-x-1 transition-transform">
                                            <FiLogIn />
                                        </div>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-4 py-4">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">O</span>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                        </div>

                        {/* Google Login */}
                        <button
                            type="button"
                            onClick={handleGoogle}
                            disabled={loading}
                            className="w-full py-3.5 rounded-xl text-sm font-bold bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-200 dark:hover:border-slate-700 shadow-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            <FcGoogle className="text-xl" />
                            Continuar con Google
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-10">
                        {isRegister ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta aún?"}{" "}
                        <button
                            type="button"
                            onClick={() => { setIsRegister(!isRegister); setError(null); setSuccess(null); setAcceptTerms(false); }}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline transition-all"
                        >
                            {isRegister ? "Inicia sesión aquí" : "Regístrate gratis"}
                        </button>
                    </p>
                </div>
            </div>

            {/* ─── Terms Modal ─────────────────────────────────────────────── */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 dark:border-slate-800 animate-fadeUp">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Términos y Condiciones de Uso</h2>
                            <button onClick={() => setShowTermsModal(false)} className="p-2 -mr-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <span className="sr-only">Cerrar</span>
                                <FiX size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 md:p-8 overflow-y-auto text-sm text-gray-600 dark:text-gray-400 space-y-5 custom-scrollbar">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-4 rounded-xl font-medium text-xs">
                                <strong>Última actualización:</strong> {new Date().toLocaleDateString()}
                            </div>

                            <p className="leading-relaxed">
                                Bienvenido a <strong className="text-gray-900 dark:text-gray-100">{PROJECT_NAME}</strong>. Al registrarse para obtener una cuenta y utilizar nuestro sistema inteligente, usted acepta estar sujeto a los siguientes términos y condiciones de servicio. Lea atentamente este documento.
                            </p>

                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mt-6 text-base tracking-tight">1. Uso del Servicio y Herramientas</h3>
                            <p className="leading-relaxed">El sistema proporciona herramientas de automatización, monitoreo de sensores (humedad, temperatura) y predicción climática. Su uso es responsabilidad exclusiva del usuario con el fin de optimizar el riego. No garantizamos resultados agrícolas infalibles, puesto que las condiciones ambientales reales pueden variar de manera impredecible.</p>

                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mt-6 text-base tracking-tight">2. Privacidad de Datos y Telemetría</h3>
                            <p className="leading-relaxed">Conforme a nuestras normas de protección, guardamos telemetría e información vital generada por sus sensores. Todo el flujo es encriptado en reposo y en tránsito. Su correo e información de acceso personal es manejado bajo un trato estricto y no será vendido a terceros con fines de lucro o de marketing ajenos.</p>

                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mt-6 text-base tracking-tight">3. Limitación de Responsabilidad</h3>
                            <p className="leading-relaxed">{PROJECT_NAME}, sus desarrolladores o cualquier entidad asociada no será responsable directa o indirectamente por la pérdida parcial o total de los cultivos derivada de situaciones como:</p>
                            <ul className="list-disc pl-5 space-y-2 marker:text-emerald-500 mt-2">
                                <li>Interrupción general o fallos del software por mantenimientos.</li>
                                <li>Pérdida de conectividad de los sensores a la red local WiFi.</li>
                                <li>Instalación eléctrica y/o mal cableado en las bombas de agua.</li>
                                <li>Casos de fuerza mayor, catástrofes naturales y eventos fuera de control técnico.</li>
                            </ul>

                            <h3 className="font-bold text-gray-900 dark:text-gray-100 mt-6 text-base tracking-tight">4. Cuenta y Seguridad</h3>
                            <p className="leading-relaxed">El usuario se compromete a mantener medidas de seguridad sobre sus credenciales. Queda prohibido el intento de ingeniería inversa, inyectar código malicioso en la plataforma o usar de manera abusiva las automatizaciones (botnets) hacia nuestros endpoints.</p>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-5 border-t border-gray-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-gray-50/50 dark:bg-slate-900/50">
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="px-6 py-3 text-gray-600 dark:text-gray-300 text-sm font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => { setAcceptTerms(true); setShowTermsModal(false); }}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                            >
                                Aceptar las condiciones
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
