const express = require("express");
const puppeteer = require("puppeteer");
const axeCore = require("axe-core");

const app = express();
app.use(express.json());

// Function to map axe-core violations to a pass/fail/partial status
const getStatus = (violations, ruleId) => {
    return violations.some(v => v.id === ruleId) ? "No Cumple" : "Cumple";
};

// Main route for accessibility evaluation
app.post("/api/test", async (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        return res.status(400).json({ error: "Debes enviar un dominio" });
    }

    let browser;
    try {
        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();
        await page.goto(domain, { waitUntil: "networkidle2" });

        // Inject axe-core into the page
        await page.addScriptTag({ path: require.resolve("axe-core") });
        const results = await page.evaluate(async () => {
            return await axe.run();
        });

        const { violations } = results;

        const evaluacion = [
            {
                index: 'a',
                pregunta: "¿Los elementos no textuales (ej. imágenes, diagramas, mapas, sonidos, vibraciones, etc.) que aparecen en el sitio web tienen texto alternativo?",
                estado: getStatus(violations, "image-alt"),
                detalles: violations
                    .filter(v => v.id === "image-alt")
            },
            {
                index: 'b',
                pregunta: "¿Los videos o elementos multimedia tienen subtítulos y audio descripción (cuando no tiene audio original), como también su respectivo guion en texto?",
                estado: "N/A - Requiere análisis manual",
                detalles: []
            },
            {
                index: 'c',
                pregunta: "¿El texto usado en el sitio web es de mínimo 12 puntos, con contraste de color que permita su visualización, y con posibilidad de ampliación hasta el 200% sin desconfiguración del contenido?",
                estado: getStatus(violations, "color-contrast"),
                detalles: violations
                    .filter(v => v.id === "color-contrast")
            },
            {
                index: 'd',
                pregunta: "¿El código de programación y el contenido del sitio web está ordenado, con lenguaje de marcado bien utilizado y comprensible sin tener en cuenta el aspecto visual del sitio web, con una estructura organizada, identificación coherente y unificada de los enlaces (vínculos/botones), y con la posibilidad de una navegación lineal y continua con esos enlaces, incluyendo un buscador?",
                estado: getStatus(violations, "aria-valid-attr"),
                detalles: [
                    { criterio: "Idioma", estado: getStatus(violations, "html-has-lang") },
                    { criterio: "Encabezados", estado: getStatus(violations, "empty-heading") },
                    { criterio: "Etiquetas y roles", estado: getStatus(violations, "aria-valid-attr") }
                ]
            },
            {
                index: 'e',
                pregunta: "¿Los formularios o casillas de información tienen advertencias o instrucciones claras con varios canales sensoriales (p. ej. Campos con asterisco obligatorios, colores, ayuda sonora, mayúscula sostenida)?",
                estado: "Parcial - Requiere análisis de contexto",
                detalles: [
                    { criterio: "Etiquetas", estado: getStatus(violations, "label") },
                    { criterio: "Nombres de inputs", estado: getStatus(violations, "input-has-name") }
                ]
            },
            {
                index: 'f',
                pregunta: "¿Al navegar el sitio web con tabulación se hace en orden adecuada y resaltando la información seleccionada?",
                estado: "Parcial - Requiere análisis manual de tabulación",
                detalles: [
                ]
            },
            {
                index: 'g',
                pregunta: "¿Se permite control de contenidos con movimientos y parpadeo y de eventos temporizados?",
                estado: getStatus(violations, "blink"),
                detalles: violations
                    .filter(v => v.id === "blink")
            },
            {
                index: 'h',
                pregunta: "¿El lenguaje de los títulos, páginas, sección, enlaces, mensajes de error, campos de formularios, es en español claro y comprensible (siguiendo la guía de lenguaje claro del DAFP en el caso de las entidades públicas, disponible en: https://www.portaltransparenciacolombia.gov.co/wp-content/uploads/2015/07/portaltritutariodecolombia_guia-de-lenguaje-claro-para-servidores-publicos.pdf).",
                estado: "Parcial - Requiere análisis manual de semántica",
                detalles: [
                    { criterio: "Título del documento", estado: getStatus(violations, "document-title") },
                    { criterio: "Nombres de enlaces", estado: getStatus(violations, "link-name") }
                ]
            },
            {
                index: 'i',
                pregunta: "¿Los documentos (Word, Excel, PDF, PowerPoint, etc.) cumplen con los criterios de accesibilidad establecidos en el Anexo 1 de la Resolución 1519 de 2020 para ser consultados fácilmente por cualquier persona?",
                estado: "N/A - Requiere análisis manual de documentos externos",
                detalles: []
            }
        ]


        res.json({
            dominio: domain,
            evaluacion,
            results
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al analizar el sitio", detalle: err.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});