import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    FiArrowRight, FiCheckCircle, FiTarget, FiShield, FiBookOpen,
    FiMenu, FiX, FiChevronLeft, FiChevronRight, FiMail,
    FiDroplet, FiCpu, FiCloud, FiZap, FiWifi,
} from "react-icons/fi";
import { FaScaleBalanced, FaHandshakeAngle, FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import { HiOutlineLightBulb } from "react-icons/hi";
import { PROJECT_NAME, PROJECT_LOGO, SOCIAL_FACEBOOK, SOCIAL_INSTAGRAM, SOCIAL_TIKTOK, CONTACT_EMAIL, PROMO_VIDEO_URL } from "../config";
import campoAgricola from '../assets/images/campo-agricola.jpg';
import monitoreo from '../assets/images/monitor.jpg';
import campoAgricola2 from '../assets/images/campo-agricola2.jpg';

const carouselSlides = [
    { image: monitoreo, title: "Automatización Inteligente", description: "Monitorea y riega tus cultivos automáticamente basándose en predicciones climáticas en tiempo real." },
    { image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=2000", title: "Optimización de Recursos", description: "Ahorra agua utilizando nuestro algoritmo predictivo que evita riegos innecesarios." },
    { image: campoAgricola2, title: "Análisis de Datos Históricos", description: "Accede al historial de humedad, temperatura y clima para tomar mejores decisiones." },
];

const stats = [
    { value: "40%", label: "Ahorro de agua", emoji: "💧" },
    { value: "24/7", label: "Monitoreo continuo", emoji: "⏱" },
    { value: "IoT", label: "Módulo OASYS", emoji: "📡" },
    { value: "Auto", label: "Automatización", emoji: "⚙️" },
];

const features = [
    { icon: FiWifi, color: "emerald", bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-600 dark:text-emerald-400", title: "Módulo OASYS Climático", desc: "Hardware IoT que transmite datos de temperatura, humedad, UV y viento directo a la nube en segundos." },
    { icon: FiCloud, color: "sky", bg: "bg-sky-100 dark:bg-sky-900/40", text: "text-sky-600 dark:text-sky-400", title: "Predicción Meteorológica", desc: "Consulta el pronóstico extendido de tu ubicación y la del módulo simultáneamente." },
    { icon: FiDroplet, color: "blue", bg: "bg-blue-100 dark:bg-blue-900/40", text: "text-blue-600 dark:text-blue-400", title: "Riego Automatizado", desc: "Activa o programa el riego basado en umbrales de humedad y pronóstico de lluvia." },
    { icon: FiZap, color: "amber", bg: "bg-amber-100 dark:bg-amber-900/40", text: "text-amber-600 dark:text-amber-400", title: "Alertas Automáticas", desc: "Define umbrales de temperatura, humedad y radiación para recibir alertas y activar actuadores al instante." },
];

const steps = [
    { n: "01", emoji: "📡", color: "emerald", title: "Instala tu OASYS", desc: "Conecta el módulo climático en tu invernadero. Al encenderse se registra automáticamente y comienza a transmitir." },
    { n: "02", emoji: "📊", color: "sky", title: "Monitorea en tiempo real", desc: "Temperatura, humedad, radiación y viento llegan al dashboard en tiempo real. También el clima de tu ubicación." },
    { n: "03", emoji: "⚡", color: "violet", title: "El sistema actúa solo", desc: "Configura umbrales y el sistema activa el riego o la malla sombra automáticamente cuando las condiciones lo requieran." },
];

export default function Landing() {
    const { user } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [contactForm, setContactForm] = useState({ nombre: '', email: '', mensaje: '' });
    const [contactSent, setContactSent] = useState(false);

    const handleContactSubmit = (e) => {
        e.preventDefault();
        const subject = encodeURIComponent(`Nuevo mensaje de contacto de ${contactForm.nombre}`);
        const body = encodeURIComponent(`Nombre: ${contactForm.nombre}\nEmail: ${contactForm.email}\n\nMensaje:\n${contactForm.mensaje}`);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        setContactForm({ nombre: '', email: '', mensaje: '' });
        setContactSent(true);
        setTimeout(() => setContactSent(false), 4000);
    };

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length), 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? carouselSlides.length - 1 : prev - 1));

    const navLinks = [
        { name: "Inicio", href: "#inicio" },
        { name: "Descubre", href: "#carrusel" },
        { name: "Cómo funciona", href: "#como-funciona" },
        { name: "Quiénes Somos", href: "#nosotros" },
        { name: "Normas", href: "#normas" },
        { name: "Contacto", href: "#contacto" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 overflow-x-hidden selection:bg-emerald-500/30 scroll-smooth">

            {/* ═══ NAV ═══ */}
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "glass shadow-md py-3" : "bg-transparent py-5"}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={PROJECT_LOGO} alt={`${PROJECT_NAME} Logo`} className="w-20 h-20" />
                        <span className={`text-xl font-bold uppercase tracking-wide ${isScrolled ? "text-emerald-600 dark:text-emerald-400" : "text-white"}`}>{PROJECT_NAME}</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <ul className="flex flex-row items-center gap-6">
                            {navLinks.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className={`text-sm font-semibold transition hover:text-emerald-400 ${isScrolled ? "text-slate-600 dark:text-slate-300" : "text-white/90"}`}>{link.name}</a>
                                </li>
                            ))}
                        </ul>
                        <Link to={user ? "/dashboard" : "/login"} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-2 hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30">
                            {user ? "Ir a la App" : "Ingresar"} <FiArrowRight />
                        </Link>
                    </nav>
                    <button className={`md:hidden text-3xl transition ${isScrolled ? "text-slate-700 dark:text-white" : "text-white"}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <FiX /> : <FiMenu />}
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-full left-0 w-full glass py-8 flex flex-col items-center gap-6 shadow-2xl animate-fadeUp">
                        {navLinks.map((link) => (
                            <a key={link.name} href={link.href} onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 dark:text-white">{link.name}</a>
                        ))}
                        <Link to={user ? "/dashboard" : "/login"} className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl" onClick={() => setMobileMenuOpen(false)}>
                            {user ? "Ir a la App" : "Iniciar Sesión"}
                        </Link>
                    </div>
                )}
            </header>

            <main>
                {/* ═══ HERO ═══ */}
                <section id="inicio" className="relative min-h-screen flex items-center justify-center">
                    {/* Background */}
                    <div className="absolute inset-0 z-0">
                        <img src={campoAgricola} alt="Agricultura" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/65 dark:bg-slate-950/75" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 dark:from-slate-950 via-transparent to-transparent" />
                        {/* Animated halo */}
                        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
                    </div>

                    <div className="relative z-10 text-center px-4 mt-20 max-w-5xl mx-auto">
                        {/* Badge pill */}
                        <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-md text-emerald-300 text-sm font-bold px-4 py-1.5 rounded-full mb-8">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            OASYS Módulo Climático · Nuevo
                        </div>

                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-xl leading-tight">
                            Revoluciona<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">tu cultivo</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto drop-shadow-lg leading-relaxed">
                            Optimiza el uso del agua combinando IoT y datos meteorológicos de última generación.
                        </p>

                        {/* Feature pills */}
                        <div className="flex flex-wrap justify-center gap-3 mb-10">
                            {["📡 Módulo IoT", "💧 40% menos agua", "⚡ Automatización", "🌦 Clima en tiempo real"].map((tag) => (
                                <span key={tag} className="bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-semibold px-3.5 py-1.5 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to={user ? "/dashboard" : "/login"} className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition shadow-xl shadow-emerald-600/30 flex justify-center items-center gap-2 text-lg">
                                Comenzar Ahora <FiArrowRight />
                            </Link>
                            <a href="#carrusel" className="px-8 py-4 bg-white/15 backdrop-blur-md text-white font-bold rounded-xl border border-white/25 hover:bg-white/25 transition text-center shadow-lg text-lg">
                                Descubrir Más
                            </a>
                        </div>

                        {/* Scroll hint */}
                        <div className="mt-16 flex flex-col items-center gap-2 text-white/40 animate-bounce">
                            <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5">
                                <div className="w-1 h-2.5 bg-white/50 rounded-full" />
                            </div>
                            <span className="text-[10px] uppercase tracking-widest font-semibold">Scroll</span>
                        </div>
                    </div>
                </section>

                {/* ═══ STATS BAND ═══ */}
                <section className="bg-slate-900/95 border-y border-slate-800 py-10">
                    <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-slate-700/50">
                        {stats.map(({ value, label, emoji }) => (
                            <div key={label} className="text-center px-6 py-2">
                                <p className="text-3xl md:text-4xl font-black text-emerald-400">{value}</p>
                                <p className="text-xs md:text-sm font-semibold text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                                    <span>{emoji}</span> {label}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ═══ FEATURES GRID ═══ */}
                <section className="py-20 bg-white/50 dark:bg-slate-900/30">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center mb-14">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Tecnología</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-2 text-slate-900 dark:text-white">Todo lo que necesitas</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">Desde el sensor físico hasta la predicción inteligente, en una sola plataforma.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {features.map(({ icon: Icon, bg, text, title, desc }) => (
                                <div key={title} className="glass rounded-3xl p-7 hover:-translate-y-2 transition-all shadow-sm hover:shadow-xl group">
                                    <div className={`w-12 h-12 ${bg} ${text} flex items-center justify-center rounded-2xl mb-5 group-hover:scale-110 transition-transform`}>
                                        <Icon size={22} />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 leading-snug">{title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ CAROUSEL ═══ */}
                <section id="carrusel" className="py-24 bg-slate-900 dark:bg-slate-950">
                    <div className="w-full">
                        <div className="text-center mb-12 px-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Descubre</span>
                            <h2 className="text-4xl font-black mt-2 uppercase text-white">Descubre {PROJECT_NAME}</h2>
                        </div>
                        <div className="relative w-full overflow-hidden shadow-2xl group">
                            <div className="flex transition-transform duration-700 h-[550px] sm:h-[650px] lg:h-[780px]" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                {carouselSlides.map((slide, index) => (
                                    <div key={index} className="w-full h-full flex-shrink-0 relative">
                                        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/30 to-transparent flex items-end">
                                            <div className="p-10 md:p-20 lg:p-28 w-full md:w-3/4">
                                                <h3 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-5 drop-shadow-xl">{slide.title}</h3>
                                                <p className="text-lg lg:text-2xl text-slate-200 drop-shadow-lg leading-relaxed">{slide.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={prevSlide} className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full text-white text-2xl flex justify-center items-center opacity-0 group-hover:opacity-100 transition hover:bg-white/30">
                                <FiChevronLeft />
                            </button>
                            <button onClick={nextSlide} className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full text-white text-2xl flex justify-center items-center opacity-0 group-hover:opacity-100 transition hover:bg-white/30">
                                <FiChevronRight />
                            </button>
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                                {carouselSlides.map((_, i) => (
                                    <button key={i} onClick={() => setCurrentSlide(i)} className={`h-3 rounded-full transition-all ${currentSlide === i ? 'w-12 bg-emerald-500' : 'w-3 bg-white/40 hover:bg-white/60'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ VIDEO ═══ */}
                <section id="video-promo" className="py-24 relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950">
                    {/* Decorative glow */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px]" />
                    </div>
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <div className="text-center mb-12">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Demostración</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-2 text-white">
                                Conoce <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">O.A.S.Y.S</span> en acción
                            </h2>
                            <p className="text-lg text-slate-400 mt-3 max-w-2xl mx-auto">
                                Descubre cómo nuestro sistema inteligente transforma y optimiza el riego agrícola.
                            </p>
                        </div>
                        <div className="relative max-w-5xl mx-auto group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-700" />
                            <div className="relative glass rounded-3xl overflow-hidden shadow-2xl bg-slate-900 ring-1 ring-slate-800/50 aspect-video flex items-center justify-center">
                                {PROMO_VIDEO_URL ? (
                                    <iframe src={PROMO_VIDEO_URL} title="O.A.S.Y.S Promo" className="w-full h-full border-0 absolute inset-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                ) : (
                                    <div className="text-center p-8 relative z-10">
                                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex justify-center items-center mx-auto mb-4 border border-emerald-500/30">
                                            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Video Promocional</h3>
                                        <p className="text-slate-400">Agrega el enlace en <code className="text-emerald-400">src/config.js</code> → <code className="text-emerald-400">PROMO_VIDEO_URL</code>.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ CÓMO FUNCIONA ═══ */}
                <section id="como-funciona" className="py-24 bg-white/50 dark:bg-slate-900/30">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Proceso</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-2 text-slate-900 dark:text-white">¿Cómo funciona?</h2>
                            <p className="text-slate-500 dark:text-slate-400 mt-3 max-w-xl mx-auto">
                                Tres pasos simples para convertir tu invernadero en un sistema autónomo e inteligente.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Connecting line desktop */}
                            <div className="hidden md:block absolute top-12 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-emerald-400 via-sky-400 to-violet-400 opacity-30" />

                            {steps.map(({ n, emoji, color, title, desc }, i) => (
                                <div key={n} className="glass rounded-3xl p-8 text-center relative animate-fadeUp" style={{ animationDelay: `${i * 0.15}s` }}>
                                    {/* Step number watermark */}
                                    <span className={`absolute top-4 right-5 text-6xl font-black text-${color}-100 dark:text-${color}-900/20 select-none leading-none`}>{n}</span>

                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-${color}-100 dark:bg-${color}-900/30 text-3xl mb-6 shadow-sm`}>
                                        {emoji}
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="text-center mt-12">
                            <Link to={user ? "/dashboard" : "/login"} className="inline-flex items-center gap-2 px-7 py-3.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20">
                                Empezar ahora <FiArrowRight />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ═══ QUIÉNES SOMOS ═══ */}
                <section id="nosotros" className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900/50">
                    <div className="max-w-7xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">El equipo</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-2 text-slate-900 dark:text-white">Quiénes Somos</h2>
                        </div>

                        {/* MVV Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            {[
                                { icon: FiTarget, gradient: "from-emerald-500 to-emerald-600", accent: "border-t-emerald-500", title: "Misión", text: "Crear sistemas eficientes y accesibles que optimicen recursos y mejoren la producción agrícola apoyando un entorno sostenible." },
                                { icon: HiOutlineLightBulb, gradient: "from-sky-500 to-sky-600", accent: "border-t-sky-500", title: "Visión", text: "Ser pioneros en tecnología agrícola mundial, logrando que el riego inteligente sea el estándar de la industria." },
                                { icon: FiCheckCircle, gradient: "from-violet-500 to-violet-600", accent: "border-t-violet-500", title: "Propósitos", text: "Democratizar la tecnología IoT para reducir desperdicios de agua con inteligencia artificial y análisis de big data." },
                            ].map(({ icon: Icon, gradient, accent, title, text }) => (
                                <div key={title} className={`glass rounded-3xl p-8 shadow-lg hover:-translate-y-2 transition-all border-t-4 ${accent} flex flex-col`}>
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl mb-6 shadow-lg`}>
                                        <Icon />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm flex-1">{text}</p>
                                </div>
                            ))}
                        </div>

                        {/* Valores & Metas */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass rounded-3xl p-8 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900 border border-emerald-100 dark:border-slate-700">
                                <h3 className="text-2xl font-bold flex items-center gap-3 mb-6 text-slate-900 dark:text-white">
                                    <span className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white"><FaHandshakeAngle /></span>
                                    Valores
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        { emoji: "💡", v: "Innovación Continua", d: "Adoptamos nuevas tecnologías para mantenernos a la vanguardia." },
                                        { emoji: "🌿", v: "Sostenibilidad", d: "Cada decisión considera el impacto ambiental a largo plazo." },
                                        { emoji: "⚡", v: "Eficiencia Operativa", d: "Optimizamos cada proceso para maximizar resultados." },
                                    ].map(({ emoji, v, d }) => (
                                        <li key={v} className="flex items-start gap-3">
                                            <span className="text-xl w-8 flex-shrink-0 mt-0.5">{emoji}</span>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white text-sm">{v}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="glass rounded-3xl p-8 bg-gradient-to-br from-sky-50 to-white dark:from-slate-800 dark:to-slate-900 border border-sky-100 dark:border-slate-700">
                                <h3 className="text-2xl font-bold flex items-center gap-3 mb-6 text-slate-900 dark:text-white">
                                    <span className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white"><FiTarget /></span>
                                    Metas
                                </h3>
                                <ul className="space-y-4">
                                    {[
                                        { emoji: "💧", m: "Ahorro del 40% de agua", d: "Reducimos el consumo con riego basado en pronóstico real." },
                                        { emoji: "⚡", m: "Automatización robusta", d: "El sistema activa riego y malla automáticamente según los umbrales configurados." },
                                        { emoji: "🔧", m: "Cero mantenimiento", d: "Hardware diseñado para funcionar años sin intervención." },
                                    ].map(({ emoji, m, d }) => (
                                        <li key={m} className="flex items-start gap-3">
                                            <span className="text-xl w-8 flex-shrink-0 mt-0.5">{emoji}</span>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white text-sm">{m}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{d}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ NORMAS ═══ */}
                <section id="normas" className="py-24 relative overflow-hidden">
                    {/* CSS-only background — no external image */}
                    <div className="absolute inset-0 bg-slate-900">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(16,185,129,0.08)_0%,transparent_60%)]" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgba(14,165,233,0.08)_0%,transparent_60%)]" />
                        {/* Grid pattern */}
                        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
                    </div>

                    <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
                        <FaScaleBalanced className="text-5xl text-emerald-500 mx-auto mb-6" />
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Estándares</span>
                        <h2 className="text-4xl md:text-5xl font-black mt-2 mb-5 text-white">Nuestras Normas</h2>
                        <p className="text-slate-400 mb-14 max-w-lg mx-auto">Calidad tecnológica, seguridad de datos y protección ambiental son pilares no negociables.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            {[
                                { icon: FiShield, color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-500/20", title: "Protección de Datos", desc: "Telemetría e información vital cifrada en todo momento con algoritmos empresariales de nivel AES-256." },
                                { icon: FiBookOpen, color: "text-sky-400", bg: "bg-sky-400/10 border-sky-500/20", title: "IoT Industrial", desc: "Redes encriptadas, eficiencia energética e interoperabilidad segura de hardware a nube con protocolos MQTT/HTTPS." },
                                { icon: FiCpu, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-500/20", title: "Procesamiento en la Nube", desc: "Datos procesados y almacenados en Firebase en tiempo real, accesibles desde cualquier dispositivo con conexión." },
                                { icon: FiZap, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-500/20", title: "Eficiencia Energética", desc: "Módulos OASYS diseñados con bajo consumo (< 2W) para operar con energía solar o baterías de larga duración." },
                            ].map(({ icon: Icon, color, bg, title, desc }) => (
                                <div key={title} className={`glass rounded-3xl p-8 bg-slate-800/70 border ${bg} shadow-xl flex gap-5 hover:-translate-y-1 transition-all text-white group`}>
                                    <div className={`w-14 h-14 rounded-2xl ${bg} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`text-2xl ${color}`} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">{title}</h4>
                                        <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ CONTACTO ═══ */}
                <section id="contacto" className="py-24 relative overflow-hidden bg-slate-900 border-t border-slate-800 text-white">
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-600 rounded-full blur-[120px]" />
                        <div className="absolute top-40 -right-40 w-[400px] h-[400px] bg-sky-600 rounded-full blur-[120px]" />
                    </div>
                    <div className="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Contacto</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-2 mb-5 drop-shadow-md">¿Tienes una duda o propuesta?</h2>
                            <p className="text-xl text-slate-300 mb-8 drop-shadow-sm leading-relaxed">Nuestro equipo está listo para ayudarte a revolucionar tu forma de cultivo. Déjanos tus datos y nos pondremos en contacto contigo.</p>
                            <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-3 text-emerald-400 font-bold text-lg bg-slate-800/60 hover:bg-slate-800 px-6 py-4 rounded-2xl border border-slate-700 hover:border-emerald-500/30 transition">
                                <FiMail className="text-2xl" /> {CONTACT_EMAIL}
                            </a>

                            {/* Trust bullets */}
                            <ul className="mt-8 space-y-3">
                                {["Respuesta en menos de 24 h", "Demos personalizadas disponibles", "Soporte técnico incluido"].map((t) => (
                                    <li key={t} className="flex items-center gap-2.5 text-slate-400 text-sm">
                                        <FiCheckCircle className="text-emerald-500 flex-shrink-0" size={15} />
                                        {t}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="glass bg-slate-800/60 border border-slate-700 p-8 md:p-10 rounded-3xl shadow-2xl">
                            {contactSent ? (
                                <div className="text-center py-12 space-y-3">
                                    <p className="text-5xl">✅</p>
                                    <p className="text-xl font-bold text-white">¡Mensaje enviado!</p>
                                    <p className="text-slate-400 text-sm">Abrimos tu cliente de correo. Nos pondremos en contacto pronto.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleContactSubmit} className="flex flex-col gap-5 text-left">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="nombre" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</label>
                                            <input id="nombre" type="text" value={contactForm.nombre} onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })} placeholder="Tu nombre completo" required className="bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition" />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo</label>
                                            <input id="email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} placeholder="tu@correo.com" required className="bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label htmlFor="mensaje" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mensaje</label>
                                        <textarea id="mensaje" value={contactForm.mensaje} onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })} placeholder="¿En qué podemos ayudarte?" required rows={4} className="bg-slate-900/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition resize-none" />
                                    </div>
                                    <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-base">
                                        Enviar Mensaje <FiArrowRight />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* ═══ FOOTER ═══ */}
            <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
                {/* Top band */}
                <div className="border-b border-slate-800/60 py-10">
                    <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
                        {/* Brand */}
                        <div className="md:col-span-2 space-y-4">
                            <div className="flex items-center gap-3">
                                <img src={PROJECT_LOGO} alt={PROJECT_NAME} className="w-14 h-14" />
                                <div>
                                    <p className="text-lg font-black text-white uppercase tracking-wide">{PROJECT_NAME}</p>
                                    <p className="text-xs text-slate-500">Sistema de riego inteligente</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
                                Revolucionando la agricultura mediante el internet de las cosas e inteligencia predictiva.
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                                {SOCIAL_FACEBOOK && (
                                    <a href={SOCIAL_FACEBOOK} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition hover:-translate-y-0.5">
                                        <FaFacebookF size={14} />
                                    </a>
                                )}
                                {SOCIAL_INSTAGRAM && (
                                    <a href={SOCIAL_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition hover:-translate-y-0.5">
                                        <FaInstagram size={14} />
                                    </a>
                                )}
                                {SOCIAL_TIKTOK && (
                                    <a href={SOCIAL_TIKTOK} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition hover:-translate-y-0.5">
                                        <FaTiktok size={14} />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Secciones</h4>
                            <ul className="space-y-2.5">
                                {navLinks.map(link => (
                                    <li key={link.name}>
                                        <a href={link.href} className="text-sm hover:text-emerald-400 transition">{link.name}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Legal</h4>
                            <ul className="space-y-2.5 mb-6">
                                <li><Link to="/privacidad" className="text-sm hover:text-emerald-400 transition">Privacidad</Link></li>
                                <li><Link to="/terminos" className="text-sm hover:text-emerald-400 transition">Términos de uso</Link></li>
                                <li><Link to="/derechos" className="text-sm hover:text-emerald-400 transition">Derechos de Autor</Link></li>
                            </ul>
                            <Link to={user ? "/dashboard" : "/login"} className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition">
                                {user ? "Ir a la App" : "Iniciar sesión"} <FiArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-600">
                    <p>© {new Date().getFullYear()} {PROJECT_NAME}. Todos los derechos reservados.</p>
                    <p className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Ingeniería de Software · UV
                    </p>
                </div>
            </footer>
        </div>
    );
}
