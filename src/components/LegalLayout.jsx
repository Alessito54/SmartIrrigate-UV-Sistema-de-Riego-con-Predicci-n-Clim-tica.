import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { PROJECT_NAME, PROJECT_LOGO } from "../config";

export function LegalSection({ title, children }) {
    return (
        <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                {title}
            </h2>
            <div className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed space-y-2">
                {children}
            </div>
        </section>
    );
}

export default function LegalLayout({ title, icon, lastUpdated, children }) {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100">

            {/* Nav */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "glass shadow-md py-3" : "bg-slate-900/90 backdrop-blur-md py-4"}`}>
                <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src={PROJECT_LOGO} alt={PROJECT_NAME} className="w-10 h-10" />
                        <span className="text-sm font-bold uppercase tracking-wide text-white">{PROJECT_NAME}</span>
                    </Link>
                    <Link to="/" className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition">
                        <FiArrowLeft size={13} /> Volver al inicio
                    </Link>
                </div>
            </header>

            {/* Hero band */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pt-32 pb-14 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <div className="relative z-10">
                    <p className="text-5xl mb-4">{icon}</p>
                    <h1 className="text-4xl md:text-5xl font-black text-white">{title}</h1>
                    <p className="text-slate-400 mt-3 text-sm">
                        Última actualización: {lastUpdated}
                    </p>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-4 py-14">
                <div className="glass rounded-3xl p-8 sm:p-12 space-y-8">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-slate-950 border-t border-slate-900 py-8 text-center">
                <p className="text-sm text-slate-500">© {new Date().getFullYear()} {PROJECT_NAME}. Todos los derechos reservados.</p>
                <div className="flex justify-center gap-6 mt-3">
                    <Link to="/privacidad" className="text-xs text-slate-500 hover:text-emerald-400 transition">Privacidad</Link>
                    <Link to="/terminos" className="text-xs text-slate-500 hover:text-emerald-400 transition">Términos de uso</Link>
                    <Link to="/derechos" className="text-xs text-slate-500 hover:text-emerald-400 transition">Derechos de Autor</Link>
                </div>
            </footer>
        </div>
    );
}
