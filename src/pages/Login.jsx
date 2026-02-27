import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiMail, FiLock, FiLogIn, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { PROJECT_NAME, PROJECT_LOGO } from "../config";

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
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
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
                            src={PROJECT_LOGO}
                            alt={`${PROJECT_NAME} Logo`}
                            className="relative w-20 h-20 drop-shadow-lg"
                        />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-50 tracking-tight">
                        {PROJECT_NAME}
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
                                placeholder="ejemplo@correo.com"
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

                    {/* Terms Checkbox (only on register) */}
                    {isRegister && (
                        <div className="flex items-start gap-3 animate-fadeUp">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
                                He leído y acepto los{" "}
                                <button
                                    type="button"
                                    onClick={() => setShowTermsModal(true)}
                                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                                >
                                    términos y condiciones
                                </button>
                                .
                            </label>
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
                            onClick={() => { setIsRegister(!isRegister); setError(null); setSuccess(null); setAcceptTerms(false); }}
                            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                        >
                            {isRegister ? "Inicia sesión" : "Crea una cuenta"}
                        </button>
                    </p>
                </form>
            </div>

            {/* Terms Modal overlay */}
            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Términos y Condiciones de Uso</h2>
                            <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <span className="sr-only">Cerrar</span>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto text-sm text-gray-600 dark:text-gray-400 space-y-4">
                            <p><strong>Última actualización:</strong> {new Date().toLocaleDateString()}</p>
                            <p>Bienvenido a {PROJECT_NAME}. Al registrarse para obtener una cuenta y utilizar nuestro sistema inteligente, usted acepta estar sujeto a los siguientes términos y condiciones de servicio. Lea atentamente este documento.</p>

                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 text-base">1. Uso del Servicio y Herramientas</h3>
                            <p>El sistema proporciona herramientas de automatización, monitoreo de sensores (humedad, temperatura) y predicción climática. Su uso es responsabilidad exclusiva del usuario con el fin de optimizar el riego. No garantizamos resultados agrícolas infalibles, puesto que las condiciones ambientales reales pueden variar de manera impredecible.</p>

                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 text-base">2. Privacidad de Datos y Telemetría</h3>
                            <p>Conforme a nuestras normas de protección, guardamos telemetría e información vital (temperatura, clima, humedad de suelo) generada por sus sensores. Todo el flujo es encriptado en reposo y en tránsito. Su correo e información de acceso personal es manejado bajo un trato estricto y no será vendido a terceros con fines de lucro o de marketing ajenos.</p>

                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 text-base">3. Limitación de Responsabilidad</h3>
                            <p>{PROJECT_NAME}, sus desarrolladores, la Universidad Veracruzana o cualquier entidad asociada no será responsable directa o indirectamente por la pérdida parcial o total de los cultivos derivada de situaciones como:</p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Interrupción general o fallos del software por mantenimientos.</li>
                                <li>Pérdida de conectividad de los sensores a la red local WiFi.</li>
                                <li>Instalación eléctrica y/o mal cableado en las bombas de agua.</li>
                                <li>Casos de fuerza mayor, catástrofes naturales y eventos fuera de control técnico.</li>
                            </ul>

                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 text-base">4. Cuenta y Seguridad</h3>
                            <p>El usuario se compromete a mantener medidas de seguridad sobre sus credenciales. Queda prohibido el intento de ingeniería inversa, inyectar código malicioso en la plataforma o usar de manera abusiva las automatizaciones (botnets) hacia nuestros endpoints.</p>

                            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mt-4 text-base">5. Modificaciones y Actualizaciones</h3>
                            <p>Nos reservamos el derecho de modificar estos términos de servicio, políticas de datos o interrumpir el acceso al backend de experimentación en cualquier momento, siempre mediante un aviso general. El uso continuado supondrá la aceptación implícita.</p>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="px-5 py-2.5 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => { setAcceptTerms(true); setShowTermsModal(false); }}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg transition active:scale-[0.97]"
                            >
                                Aceptar Condiciones
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
