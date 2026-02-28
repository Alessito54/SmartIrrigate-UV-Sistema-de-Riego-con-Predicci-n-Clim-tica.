import LegalLayout, { LegalSection } from "../components/LegalLayout";
import { PROJECT_NAME, CONTACT_EMAIL } from "../config";

export default function TerminosUso() {
    return (
        <LegalLayout title="Términos de Uso"  lastUpdated="28 de febrero de 2026">

            <LegalSection title="1. Aceptación de los términos">
                <p>
                    Al acceder y utilizar <strong>{PROJECT_NAME}</strong> aceptas estos Términos de Uso en su totalidad.
                    Si no estás de acuerdo con alguna parte de estos términos, debes dejar de usar el servicio.
                    El uso continuado de la plataforma implica la aceptación de cualquier actualización publicada.
                </p>
            </LegalSection>

            <LegalSection title="2. Descripción del servicio">
                <p>
                    {PROJECT_NAME} es una plataforma de monitoreo y automatización agrícola que permite:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Visualizar datos de sensores climáticos en tiempo real mediante el módulo OASYS.</li>
                    <li>Gestionar invernaderos, secciones y cultivos de forma digital.</li>
                    <li>Automatizar y registrar eventos de riego y control de malla sombra.</li>
                    <li>Consultar el pronóstico meteorológico de la ubicación del usuario y del módulo físico.</li>
                    <li>Revisar el historial de actividad de riego por sección.</li>
                </ul>
            </LegalSection>

            <LegalSection title="3. Creación de cuenta">
                <p>
                    Para utilizar las funciones principales es necesario registrarse con una dirección de correo electrónico válida.
                    Eres responsable de:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
                    <li>Todas las actividades realizadas desde tu cuenta.</li>
                    <li>Notificarnos inmediatamente si sospechas acceso no autorizado a tu cuenta.</li>
                    <li>Proveer información veraz al registrarte.</li>
                </ul>
                <p className="mt-2">Nos reservamos el derecho de suspender cuentas que violen estos términos sin previo aviso.</p>
            </LegalSection>

            <LegalSection title="4. Uso aceptable">
                <p>Al usar {PROJECT_NAME} te comprometes a no:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Intentar acceder a datos de otros usuarios sin autorización.</li>
                    <li>Usar el servicio para actividades ilegales o que dañen a terceros.</li>
                    <li>Realizar ingeniería inversa, descompilar o desensamblar cualquier parte del software.</li>
                    <li>Sobrecargar deliberadamente los servidores o la base de datos de Firebase.</li>
                    <li>Compartir credenciales de acceso con personas no autorizadas.</li>
                    <li>Publicar o transmitir contenido malicioso a través de la plataforma.</li>
                </ul>
            </LegalSection>

            <LegalSection title="5. Módulo OASYS — hardware de terceros">
                <p>
                    El módulo OASYS Climático es un dispositivo de hardware que se registra directamente en nuestra base de datos.
                    El usuario es responsable de:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>La correcta instalación y mantenimiento del módulo físico.</li>
                    <li>Asegurar que el módulo tenga conexión a Internet para operar.</li>
                    <li>No modificar el firmware del módulo de forma que interfiera con la plataforma.</li>
                </ul>
                <p className="mt-2">
                    {PROJECT_NAME} no se hace responsable de fallos de automatización derivados de pérdida de conexión, hardware defectuoso o configuraciones incorrectas del módulo.
                </p>
            </LegalSection>

            <LegalSection title="6. Disponibilidad del servicio">
                <p>
                    Nos esforzamos por mantener {PROJECT_NAME} disponible las 24 horas, pero no garantizamos disponibilidad ininterrumpida.
                    Podemos interrumpir el servicio temporalmente por mantenimiento, actualizaciones o causas de fuerza mayor sin previo aviso.
                    No somos responsables de pérdidas derivadas de interrupciones del servicio.
                </p>
            </LegalSection>

            <LegalSection title="7. Limitación de responsabilidad">
                <p>
                    {PROJECT_NAME} se proporciona <strong>"tal cual"</strong> y <strong>"según disponibilidad"</strong>.
                    En ningún caso seremos responsables por:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Pérdidas de cosecha o daños agrícolas derivados del uso o mal uso del sistema.</li>
                    <li>Daños indirectos, incidentales o consecuentes.</li>
                    <li>Pérdida de datos por fallos de Firebase o de la conexión a Internet.</li>
                    <li>Decisiones agronómicas tomadas con base en los datos mostrados por la plataforma.</li>
                </ul>
            </LegalSection>

            <LegalSection title="8. Modificaciones al servicio">
                <p>
                    Nos reservamos el derecho de modificar, suspender o discontinuar cualquier parte del servicio
                    en cualquier momento y sin responsabilidad ante el usuario. Publicaremos cambios relevantes
                    en esta página o mediante notificación dentro de la aplicación.
                </p>
            </LegalSection>

            <LegalSection title="9. Legislación aplicable">
                <p>
                    Estos términos se rigen por las leyes vigentes en los Estados Unidos Mexicanos.
                    Cualquier controversia derivada del uso del servicio será sometida a los tribunales competentes
                    de la República Mexicana, renunciando a cualquier otro fuero que pudiera corresponder.
                </p>
            </LegalSection>

            <LegalSection title="10. Contacto">
                <p>Para preguntas sobre estos términos contáctanos en:</p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 mt-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                    {CONTACT_EMAIL}
                </a>
            </LegalSection>

        </LegalLayout>
    );
}
