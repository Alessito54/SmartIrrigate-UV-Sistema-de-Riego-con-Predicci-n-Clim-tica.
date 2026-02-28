import LegalLayout, { LegalSection } from "../components/LegalLayout";
import { PROJECT_NAME, CONTACT_EMAIL } from "../config";

export default function DerechosAutor() {
    return (
        <LegalLayout title="Derechos de Autor" icon="©" lastUpdated="28 de febrero de 2026">

            <LegalSection title="1. Titularidad">
                <p>
                    Todo el contenido, código fuente, diseño, logotipos, gráficos, textos y demás elementos que conforman
                    la plataforma <strong>{PROJECT_NAME}</strong> son propiedad intelectual de sus autores y están
                    protegidos por las leyes de derechos de autor vigentes en los Estados Unidos Mexicanos y por
                    los tratados internacionales de propiedad intelectual.
                </p>
                <p>
                    Este proyecto fue desarrollado en el marco de la <strong>Universidad Veracruzana</strong>,
                    Facultad de Ingeniería de Software, y los derechos corresponden a sus creadores conforme
                    a los acuerdos institucionales aplicables.
                </p>
            </LegalSection>

            <LegalSection title="2. Software y código fuente">
                <p>
                    El código fuente de {PROJECT_NAME} — incluyendo componentes de frontend en React, servicios
                    de Firebase, lógica de automatización y configuración del módulo OASYS — está protegido como
                    obra literaria bajo la Ley Federal del Derecho de Autor (LFDA) de México.
                </p>
                <p>Queda expresamente <strong>prohibido</strong>:</p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Copiar, reproducir o distribuir el código fuente sin autorización escrita de los autores.</li>
                    <li>Modificar, adaptar o crear obras derivadas con fines comerciales sin licencia.</li>
                    <li>Descompilar o realizar ingeniería inversa del software.</li>
                    <li>Eliminar o alterar los avisos de copyright presentes en el código.</li>
                </ul>
            </LegalSection>

            <LegalSection title="3. Marca y nombre comercial">
                <p>
                    El nombre <strong>O.A.S.Y.S</strong>, el logotipo asociado y el nombre <strong>OASYS Módulo Climático</strong>
                    son marcas de los autores del proyecto. Su uso no autorizado —incluyendo reproducción, imitación
                    o asociación— en productos, servicios o materiales de comunicación queda expresamente prohibido.
                </p>
            </LegalSection>

            <LegalSection title="4. Contenido generado por el usuario">
                <p>
                    Los datos ingresados por los usuarios (nombres de invernaderos, secciones, cultivos, etc.)
                    son de su propiedad. Al almacenarlos en {PROJECT_NAME} otorgas una licencia limitada, no exclusiva
                    y revocable para procesarlos con el único fin de prestar el servicio descrito.
                </p>
                <p>
                    No reclamamos propiedad sobre tus datos de cultivo ni los usamos con fines distintos
                    al funcionamiento de la plataforma.
                </p>
            </LegalSection>

            <LegalSection title="5. Recursos y bibliotecas de terceros">
                <p>
                    {PROJECT_NAME} hace uso de las siguientes bibliotecas y servicios de código abierto,
                    cada una con su propia licencia:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li><strong>React</strong> — MIT License (Meta Platforms, Inc.)</li>
                    <li><strong>Vite</strong> — MIT License</li>
                    <li><strong>Tailwind CSS</strong> — MIT License</li>
                    <li><strong>Firebase SDK</strong> — Apache 2.0 License (Google LLC)</li>
                    <li><strong>React Router</strong> — MIT License</li>
                    <li><strong>react-icons</strong> — MIT License</li>
                    <li><strong>Open-Meteo API</strong> — CC BY 4.0 (uso no comercial gratuito)</li>
                    <li><strong>ipapi.co</strong> — Servicio de geolocalización por IP (uso bajo sus propios términos)</li>
                </ul>
                <p className="mt-2">
                    El uso de estas bibliotecas no implica ninguna afiliación o respaldo por parte de sus autores.
                </p>
            </LegalSection>

            <LegalSection title="6. Fotografías e imágenes">
                <p>
                    Las imágenes utilizadas en la landing page provienen de:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Fotografías propias del equipo de desarrollo, todos los derechos reservados.</li>
                    <li>Imágenes de <strong>Unsplash</strong> bajo la licencia Unsplash License (gratuita para uso comercial y no comercial).</li>
                </ul>
            </LegalSection>

            <LegalSection title="7. Uso permitido">
                <p>
                    Se permite el uso personal y académico no comercial del conocimiento técnico descrito públicamente
                    en este proyecto, siempre que se cite adecuadamente la fuente:
                </p>
                <blockquote className="mt-2 pl-4 border-l-4 border-emerald-500 italic text-gray-500 dark:text-slate-400">
                    "{PROJECT_NAME} — Sistema de Riego Inteligente con Monitoreo IoT. Universidad Veracruzana, Ingeniería de Software. {new Date().getFullYear()}."
                </blockquote>
            </LegalSection>

            <LegalSection title="8. Infracción y reporte">
                <p>
                    Si consideras que algún contenido de {PROJECT_NAME} infringe tus derechos de autor,
                    contáctanos con la información necesaria para evaluar tu solicitud:
                </p>
                <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center gap-2 mt-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                    {CONTACT_EMAIL}
                </a>
                <p className="mt-2">
                    Atenderemos las solicitudes de buena fe conforme a la legislación aplicable.
                </p>
            </LegalSection>

        </LegalLayout>
    );
}
