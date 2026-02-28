import LegalLayout, { LegalSection } from "../components/LegalLayout";
import { PROJECT_NAME, CONTACT_EMAIL } from "../config";

export default function Privacidad() {
    return (
        <LegalLayout title="Política de Privacidad"  lastUpdated="28 de febrero de 2026">

            <LegalSection title="1. Introducción">
                <p>
                    En <strong>{PROJECT_NAME}</strong> nos comprometemos a proteger la privacidad de nuestros usuarios.
                    Esta política describe qué información recopilamos, cómo la usamos y qué derechos tienes sobre ella
                    en el contexto de nuestro sistema de riego inteligente con monitoreo IoT.
                </p>
            </LegalSection>

            <LegalSection title="2. Información que recopilamos">
                <p>Recopilamos los siguientes tipos de datos al usar {PROJECT_NAME}:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>Datos de cuenta:</strong> nombre de usuario y correo electrónico (provistos al registrarse con Firebase Authentication).</li>
                    <li><strong>Datos del módulo OASYS:</strong> dirección IP pública del módulo y marca de tiempo (timestamp) de actividad, guardados en Firebase Realtime Database sin autenticación del dispositivo.</li>
                    <li><strong>Datos de sensores:</strong> temperatura, humedad relativa, radiación solar (UV) y velocidad del viento, asociados a las secciones de tu invernadero.</li>
                    <li><strong>Datos de invernaderos y secciones:</strong> nombres, cultivos y configuraciones que tú mismo introduces.</li>
                    <li><strong>Datos de geolocalización aproximada:</strong> ubicación estimada a partir de la IP pública (ciudad y país) mediante el servicio <code>ipapi.co</code>, usada únicamente para mostrar el pronóstico meteorológico local. No almacenamos esta información.</li>
                </ul>
            </LegalSection>

            <LegalSection title="3. Cómo usamos tu información">
                <ul className="list-disc pl-5 space-y-1">
                    <li>Autenticar tu identidad y proteger el acceso a tu cuenta.</li>
                    <li>Mostrar los datos de tus invernaderos y módulos en el dashboard en tiempo real.</li>
                    <li>Determinar si un módulo OASYS está activo basándonos en el timestamp recibido.</li>
                    <li>Obtener el pronóstico meteorológico de la ubicación del módulo a través de su IP pública.</li>
                    <li>Registrar el historial de eventos de riego para tu consulta.</li>
                </ul>
                <p className="mt-2">No vendemos, alquilamos ni compartimos tu información personal con terceros para fines comerciales.</p>
            </LegalSection>

            <LegalSection title="4. Firebase y servicios de terceros">
                <p>
                    {PROJECT_NAME} utiliza <strong>Firebase Realtime Database</strong> y <strong>Firebase Authentication</strong> de Google LLC para el almacenamiento y autenticación en tiempo real.
                    Los datos se almacenan en servidores de Google Cloud bajo los términos de servicio de Firebase.
                </p>
                <p>
                    Para la geolocalización por IP se usa el servicio <strong>ipapi.co</strong>, que puede procesar la IP pública de forma temporal para devolver la ubicación aproximada.
                    No se almacenan IPs en nuestros servidores propios.
                </p>
                <p>
                    Para el pronóstico meteorológico se usa la API pública de <strong>Open-Meteo</strong>, que no requiere datos personales.
                </p>
            </LegalSection>

            <LegalSection title="5. Seguridad de los datos">
                <p>
                    Implementamos reglas de seguridad en Firebase Realtime Database que restringen el acceso a los datos de cada usuario únicamente a su propia cuenta autenticada.
                    Los campos técnicos del módulo OASYS (<code>timestamp</code> e <code>ip</code>) son escribibles sin autenticación para permitir la telemetría del hardware, pero la lectura de estos datos requiere sesión activa.
                </p>
            </LegalSection>

            <LegalSection title="6. Tus derechos">
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Acceso:</strong> puedes consultar todos tus datos desde el dashboard de la aplicación.</li>
                    <li><strong>Rectificación:</strong> puedes modificar tu nombre desde la sección de Ajustes.</li>
                    <li><strong>Eliminación:</strong> puedes solicitar la eliminación de tu cuenta y datos escribiéndonos a <strong>{CONTACT_EMAIL}</strong>.</li>
                    <li><strong>Portabilidad:</strong> puedes solicitar una exportación de tus datos por correo electrónico.</li>
                </ul>
            </LegalSection>

            <LegalSection title="7. Cambios a esta política">
                <p>
                    Podemos actualizar esta política en cualquier momento. Te notificaremos de cambios significativos
                    mediante un aviso en la aplicación o por correo electrónico. El uso continuado del servicio
                    después de publicadas las actualizaciones implica tu aceptación.
                </p>
            </LegalSection>

            <LegalSection title="8. Contacto">
                <p>
                    Para cualquier consulta sobre esta política de privacidad escríbenos a:
                </p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 mt-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                    {CONTACT_EMAIL}
                </a>
            </LegalSection>

        </LegalLayout>
    );
}
