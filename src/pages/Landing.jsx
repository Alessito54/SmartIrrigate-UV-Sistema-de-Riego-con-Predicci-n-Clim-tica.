import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FiArrowRight, FiCheckCircle, FiTarget, FiShield, FiBookOpen, FiMenu, FiX, FiChevronLeft, FiChevronRight, FiMail } from "react-icons/fi";
import { FaScaleBalanced, FaHandshakeAngle, FaFacebookF, FaInstagram, FaTiktok } from "react-icons/fa6";
import { HiOutlineLightBulb } from "react-icons/hi";
import { PROJECT_NAME, PROJECT_LOGO, SOCIAL_FACEBOOK, SOCIAL_INSTAGRAM, SOCIAL_TIKTOK, CONTACT_EMAIL, PROMO_VIDEO_URL } from "../config";
import campoAgricola from '../assets/images/campo-agricola.jpg';
import monitoreo from '../assets/images/monitor.jpg';
import campoAgricola2 from '../assets/images/campo-agricola2.jpg';


const carouselSlides = [
    {
        image: monitoreo,
        title: "Automatización Inteligente",
        description: "Monitorea y riega tus cultivos automáticamente basándose en predicciones climáticas en tiempo real."
    },
    {
        image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&q=80&w=2000",
        title: "Optimización de Recursos",
        description: "Ahorra agua utilizando nuestro algoritmo predictivo que evita riegos innecesarios."
    },
    {
        image: campoAgricola2,
        title: "Análisis de Datos Históricos",
        description: "Accede al historial de humedad, temperatura y clima para tomar mejores decisiones."
    }
];

export default function Landing() {
    const { user } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [contactForm, setContactForm] = useState({ nombre: '', email: '', mensaje: '' });

    const handleContactSubmit = (e) => {
        e.preventDefault();
        const subject = encodeURIComponent(`Nuevo mensaje de contacto de ${contactForm.nombre}`);
        const body = encodeURIComponent(`Nombre: ${contactForm.nombre}\nEmail: ${contactForm.email}\n\nMensaje:\n${contactForm.mensaje}`);
        window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
        setContactForm({ nombre: '', email: '', mensaje: '' });
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
        { name: "Video", href: "#video-promo" },
        { name: "Quiénes Somos", href: "#nosotros" },
        { name: "Normas", href: "#normas" },
        { name: "Contacto", href: "#contacto" },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 overflow-x-hidden selection:bg-emerald-500/30 scroll-smooth">
            <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "glass shadow-md py-3" : "bg-transparent py-5"}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src={PROJECT_LOGO} alt={`${PROJECT_NAME} Logo`} className="w-20 h-20" />
                        <span className={`text-xl font-bold uppercase ${isScrolled ? "text-emerald-600 dark:text-emerald-400" : "text-white"}`}>{PROJECT_NAME}</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <ul className="flex flex-row items-center gap-6">
                            {navLinks.map((link) => (
                                <li key={link.name}>
                                    <a href={link.href} className={`text-sm font-semibold hover:text-emerald-400 ${isScrolled ? "text-slate-600 dark:text-slate-300" : "text-white"}`}>{link.name}</a>
                                </li>
                            ))}
                        </ul>
                        <Link to={user ? "/dashboard" : "/login"} className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold flex items-center gap-2 hover:bg-emerald-500">
                            {user ? "Ir a la App" : "Ingresar"} <FiArrowRight />
                        </Link>
                    </nav>
                    <button className="md:hidden text-3xl text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
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
                {/* HERO */}
                <section id="inicio" className="relative h-screen flex items-center justify-center">
                    <div className="absolute inset-0 z-0">
                        <img src={campoAgricola} alt="Agricultura" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/70 dark:bg-slate-950/80 backdrop-blur-sm" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 dark:from-slate-950 via-transparent" />
                    </div>
                    <div className="relative z-10 text-center px-4 mt-20">
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 drop-shadow-xl">Revoluciona tu cultivo</h1>
                        <p className="text-xl md:text-2xl text-slate-200 mb-10 max-w-3xl mx-auto drop-shadow-lg">Optimiza el uso del agua combinando IoT y datos meteorológicos de última generación.</p>
                        <div className="flex flex-col sm:flex-row gap-5 justify-center">
                            <Link to={user ? "/dashboard" : "/login"} className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition shadow-lg flex justify-center items-center gap-2">Comenzar Ahora <FiArrowRight /></Link>
                            <a href="#carrusel" className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition text-center shadow-lg">Descubrir Más</a>
                        </div>
                    </div>
                </section>

                {/* CAROUSEL */}
                <section id="carrusel" className="py-24 bg-slate-900 dark:bg-slate-950">
                    <div className="w-full">
                        <h2 className="text-4xl font-black text-center mb-12 uppercase text-white">Descubre {PROJECT_NAME}</h2>
                        <div className="relative w-full overflow-hidden shadow-2xl group">
                            <div className="flex transition-transform duration-700 h-[600px] sm:h-[700px] lg:h-[800px]" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                                {carouselSlides.map((slide, index) => (
                                    <div key={index} className="w-full h-full flex-shrink-0 relative">
                                        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex items-end">
                                            <div className="p-10 md:p-20 lg:p-32 w-full md:w-3/4">
                                                <h3 className="text-4xl md:text-5xl lg:text-7xl font-black text-white mb-6 drop-shadow-xl">{slide.title}</h3>
                                                <p className="text-xl lg:text-3xl text-slate-200 drop-shadow-lg">{slide.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={prevSlide} className="absolute left-4 lg:left-8 top-1/2 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full text-white text-2xl flex justify-center items-center opacity-0 group-hover:opacity-100 transition"><FiChevronLeft /></button>
                            <button onClick={nextSlide} className="absolute right-4 lg:right-8 top-1/2 w-14 h-14 bg-white/20 backdrop-blur-md rounded-full text-white text-2xl flex justify-center items-center opacity-0 group-hover:opacity-100 transition"><FiChevronRight /></button>
                            <div className="absolute bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2 flex gap-3">
                                {carouselSlides.map((_, i) => (
                                    <button key={i} onClick={() => setCurrentSlide(i)} className={`h-3 rounded-full transition-all ${currentSlide === i ? 'w-12 bg-emerald-500' : 'w-3 bg-white/50'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* VIDEO PROMOCIONAL */}
                <section id="video-promo" className="py-24 bg-emerald-900/5 dark:bg-emerald-900/10 relative overflow-hidden">
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase text-emerald-800 dark:text-emerald-400">
                                Conoce <span className="text-slate-900 dark:text-white">O.A.S.Y.S</span> en acción
                            </h2>
                            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                                Descubre cómo nuestro sistema inteligente transforma y optimiza el riego agrícola con tecnología de vanguardia.
                            </p>
                        </div>

                        <div className="relative max-w-5xl mx-auto group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative glass rounded-3xl overflow-hidden shadow-2xl bg-slate-900 ring-1 ring-slate-800/50 aspect-video flex items-center justify-center">
                                {PROMO_VIDEO_URL ? (
                                    <iframe
                                        src={PROMO_VIDEO_URL}
                                        title="O.A.S.Y.S Promo"
                                        className="w-full h-full border-0 absolute inset-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen>
                                    </iframe>
                                ) : (
                                    <div className="text-center p-8 relative z-10">
                                        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex justify-center items-center mx-auto mb-4 border border-emerald-500/30">
                                            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-2">Video Promocional</h3>
                                        <p className="text-slate-400">
                                            Agrega el enlace en <code>src/config.js</code> en la variable <code>PROMO_VIDEO_URL</code>.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ABOUT */}
                <section id="nosotros" className="py-24 bg-white/40 dark:bg-slate-900/20">
                    <div className="max-w-7xl mx-auto px-4">
                        <h2 className="text-4xl font-black text-center mb-16 uppercase text-slate-900 dark:text-white">Quiénes Somos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                            <div className="glass p-10 rounded-3xl shadow-xl flex flex-col items-center text-center bg-white/50 dark:bg-slate-800/50 hover:-translate-y-2 transition">
                                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex justify-center items-center text-white text-4xl mb-6 shadow-lg"><FiTarget /></div>
                                <h3 className="text-3xl font-bold mb-4">Misión</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Crear sistemas eficientes y accesibles que optimicen recursos y mejoren la producción agrícola apoyando un entorno sostenible.</p>
                            </div>
                            <div className="glass p-10 rounded-3xl shadow-xl flex flex-col items-center text-center bg-white/50 dark:bg-slate-800/50 hover:-translate-y-2 transition">
                                <div className="w-20 h-20 bg-sky-500 rounded-2xl flex justify-center items-center text-white text-4xl mb-6 shadow-lg"><HiOutlineLightBulb /></div>
                                <h3 className="text-3xl font-bold mb-4">Visión</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Ser pioneros en tecnología agrícola mundial, logrando que el "riego inteligente" sea el estándar de la industria.</p>
                            </div>
                            <div className="glass p-10 rounded-3xl shadow-xl flex flex-col items-center text-center bg-white/50 dark:bg-slate-800/50 hover:-translate-y-2 transition">
                                <div className="w-20 h-20 bg-indigo-500 rounded-2xl flex justify-center items-center text-white text-4xl mb-6 shadow-lg"><FiCheckCircle /></div>
                                <h3 className="text-3xl font-bold mb-4">Propósitos</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Democratizar la tecnología IoT para reducir desperdicios de agua con IA y big data.</p>
                            </div>
                        </div>

                        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-50 to-sky-50 dark:from-slate-800 dark:to-slate-900 border border-emerald-100 dark:border-slate-700">
                            <div className="relative grid grid-cols-1 lg:grid-cols-2 text-slate-800 dark:text-white">
                                <div className="p-12 lg:border-r border-emerald-200/50 dark:border-slate-700/50">
                                    <h3 className="text-4xl font-bold flex items-center gap-4 mb-6"><FaHandshakeAngle className="text-emerald-500" /> Valores</h3>
                                    <ul className="space-y-4 text-xl">
                                        <li className="flex items-center gap-3"><FiCheckCircle className="text-emerald-500" /> Innovación Continua</li>
                                        <li className="flex items-center gap-3"><FiCheckCircle className="text-emerald-500" /> Sostenibilidad</li>
                                        <li className="flex items-center gap-3"><FiCheckCircle className="text-emerald-500" /> Eficiencia Operativa</li>
                                    </ul>
                                </div>
                                <div className="p-12">
                                    <h3 className="text-4xl font-bold flex items-center gap-4 mb-6"><FiTarget className="text-sky-500" /> Metas</h3>
                                    <ul className="space-y-4 text-xl">
                                        <li className="flex items-center gap-3"><FiCheckCircle className="text-sky-500" /> Ahorro de 40% de agua</li>
                                        <li className="flex items-center gap-3"><FiCheckCircle className="text-sky-500" /> Robusta IA Predictiva</li>
                                        <li className="flex items-center gap-3"><FiCheckCircle className="text-sky-500" /> Cero mantenimiento</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* NORMAS */}
                <section id="normas" className="py-24 relative">
                    <div className="absolute inset-0 z-0 bg-slate-900">
                        <img src="https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=2000" className="w-full h-full object-cover opacity-10 grayscale" alt="nature rules" />
                    </div>
                    <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">
                        <FaScaleBalanced className="text-6xl text-emerald-500 mx-auto mb-6" />
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-white uppercase">Nuestras Normas</h2>
                        <p className="text-xl text-slate-400 mb-16">Estándares de calidad tecnológica, seguridad de datos y protección ambiental.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                            <div className="glass p-10 rounded-3xl bg-slate-800/80 border border-slate-700 shadow-xl flex gap-6 hover:-translate-y-2 transition text-white">
                                <FiShield className="text-6xl text-emerald-400 flex-shrink-0" />
                                <div>
                                    <h4 className="text-2xl font-bold mb-3">Protección de Datos</h4>
                                    <p className="text-slate-300">Telemetría e información vital cifrada en todo momento con algoritmos empresariales.</p>
                                </div>
                            </div>
                            <div className="glass p-10 rounded-3xl bg-slate-800/80 border border-slate-700 shadow-xl flex gap-6 hover:-translate-y-2 transition text-white">
                                <FiBookOpen className="text-6xl text-sky-400 flex-shrink-0" />
                                <div>
                                    <h4 className="text-2xl font-bold mb-3">IoT Industrial</h4>
                                    <p className="text-slate-300">Redes encriptadas, eficiencia energética e interoperabilidad segura de hardware a nube.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CONTACTO */}
                <section id="contacto" className="py-24 relative overflow-hidden bg-slate-900 border-t border-slate-800 text-white">
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-emerald-600 rounded-full blur-[100px]" />
                        <div className="absolute top-40 -right-40 w-[400px] h-[400px] bg-sky-600 rounded-full blur-[100px]" />
                    </div>
                    <div className="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 drop-shadow-md">¿Tienes alguna duda o propuesta?</h2>
                            <p className="text-xl md:text-2xl text-slate-300 mb-8 drop-shadow-sm">Nuestro equipo está listo para ayudarte a revolucionar tu forma de cultivo. Déjanos tus datos y nos pondremos en contacto contigo.</p>
                            <div className="flex items-center gap-4 text-emerald-400 font-bold text-xl bg-slate-800/50 p-6 rounded-2xl w-fit border border-slate-700">
                                <FiMail className="text-3xl" /> {CONTACT_EMAIL}
                            </div>
                        </div>
                        <div className="glass bg-slate-800/60 border border-slate-700 p-8 md:p-10 rounded-3xl shadow-2xl">
                            <form onSubmit={handleContactSubmit} className="flex flex-col gap-6 text-left">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="nombre" className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Nombre</label>
                                        <input
                                            id="nombre"
                                            type="text"
                                            value={contactForm.nombre}
                                            onChange={(e) => setContactForm({ ...contactForm, nombre: e.target.value })}
                                            placeholder="Tu nombre completo"
                                            required
                                            className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label htmlFor="email" className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Correo</label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                            placeholder="tu@correo.com"
                                            required
                                            className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label htmlFor="mensaje" className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Mensaje</label>
                                    <textarea
                                        id="mensaje"
                                        value={contactForm.mensaje}
                                        onChange={(e) => setContactForm({ ...contactForm, mensaje: e.target.value })}
                                        placeholder="¿En qué podemos ayudarte?"
                                        required
                                        rows={4}
                                        className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition resize-none"
                                    />
                                </div>
                                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2 text-lg">
                                    Enviar Mensaje <FiArrowRight />
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 pt-16">
                <div className="max-w-7xl mx-auto px-4 pb-10">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <h3 className="text-2xl font-bold text-white mb-4 uppercase">{PROJECT_NAME}</h3>
                            <p className="text-slate-400 max-w-sm">Revolucionando la agricultura gracias al internet de las cosas e inteligencia predictiva.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Secciones</h4>
                            <ul className="space-y-2">
                                {navLinks.map(link => <li key={link.name}><a href={link.href} className="hover:text-emerald-400">{link.name}</a></li>)}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Legales</h4>
                            <ul className="space-y-2 mb-6">
                                <li><a href="#" className="hover:text-emerald-400">Privacidad</a></li>
                                <li><a href="#" className="hover:text-emerald-400">Términos</a></li>
                                <li><a href="#" className="hover:text-emerald-400">Derechos de Autor</a></li>
                            </ul>
                            <h4 className="font-bold text-white mb-4">Síguenos</h4>
                            <div className="flex items-center gap-4">
                                {SOCIAL_FACEBOOK && (
                                    <a href={SOCIAL_FACEBOOK} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-emerald-600 transition hover:-translate-y-1">
                                        <FaFacebookF />
                                    </a>
                                )}
                                {SOCIAL_INSTAGRAM && (
                                    <a href={SOCIAL_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-emerald-600 transition hover:-translate-y-1">
                                        <FaInstagram />
                                    </a>
                                )}
                                {SOCIAL_TIKTOK && (
                                    <a href={SOCIAL_TIKTOK} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-emerald-600 transition hover:-translate-y-1">
                                        <FaTiktok />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                        <p>© {new Date().getFullYear()} {PROJECT_NAME}. Todos los derechos reservados.</p>
                        <p>Ing. de software</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
