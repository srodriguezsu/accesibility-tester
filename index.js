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
        browser = await puppeteer.launch({ headless: "new" });
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
                pregunta: "Los elementos no textuales (ej. imágenes, diagramas, mapas, sonidos, vibraciones, etc.) que aparecen en el sitio web tienen texto alternativo?",
                estado: getStatus(violations, "image-alt"),
                detalles: violations.filter(v => v.id === "image-alt").map(v => v.description)
            },
            {
                index: 'b',
                pregunta: "Los videos o elementos multimedia tienen subtítulos y audio descripción (cuando no tiene audio original), como también su respectivo guion en texto?",
                estado: "N/A - Requiere análisis manual",
                detalles: "La validación de subtítulos y descripciones de audio no puede ser completamente automatizada por esta herramienta."
            },
            {
                index: 'c',
                pregunta: "El texto usado en el sitio web es de mínimo 12 puntos, con contraste de color que permita su visualización, y con posibilidad de ampliación hasta el 200% sin desconfiguración del contenido?",
                estado: getStatus(violations, "color-contrast"),
                detalles: violations.filter(v => v.id === "color-contrast").map(v => v.description)
            },
            {
                index: 'd',
                pregunta: "El código de programación y el contenido del sitio web está ordenado, con lenguaje de marcado bien utilizado y comprensible sin tener en cuenta el aspecto visual del sitio web, con una estructura organizada, identificación coherente y unificada de los enlaces (vínculos/botones), y con la posibilidad de una navegación lineal y continua con esos enlaces, incluyendo un buscador?",
                estado: "Parcial - Cubre múltiples reglas",
                detalles: {
                    idioma: getStatus(violations, "html-has-lang"),
                    encabezados: getStatus(violations, "empty-heading"),
                    etiquetas_y_roles: getStatus(violations, "aria-valid-attr")
                }
            },
            {
                index: 'e',
                pregunta: "Los formularios o casillas de información tienen advertencias o instrucciones claras con varios canales sensoriales (p. ej. Campos con asterisco obligatorios, colores, ayuda sonora, mayúscula sostenida)?",
                estado: "Parcial - Requiere análisis de contexto",
                detalles: {
                    etiquetas: getStatus(violations, "label"),
                    nombres_inputs: getStatus(violations, "input-has-name")
                }
            },
            {
                index: 'f',
                pregunta: "Al navegar el sitio web con tabulación se hace en orden adecuada y resaltando la información seleccionada?",
                estado: "Parcial - Requiere análisis dinámico",
                detalles: "La validación completa del orden de tabulación requiere simulación de la interacción del usuario."
            },
            {
                index: 'g',
                pregunta: "Se permite control de contenidos con movimientos y parpadeo y de eventos temporizados?",
                estado: getStatus(violations, "blink"),
                detalles: "Se validan etiquetas de parpadeo y animaciones básicas."
            },
            {
                index: 'h',
                pregunta: "El lenguaje de los títulos, páginas, sección, enlaces, mensajes de error, campos de formularios, es en español claro y comprensible (siguiendo la guía de lenguaje claro del DAFP en el caso de las entidades públicas, disponible en: https://www.portaltransparenciacolombia.gov.co/wp-content/uploads/2015/07/portaltritutariodecolombia_guia-de-lenguaje-claro-para-servidores-publicos.pdf).",
                estado: "Parcial - Requiere análisis manual de semántica",
                detalles: {
                    titulo_documento: getStatus(violations, "document-title"),
                    nombres_enlaces: getStatus(violations, "link-name")
                }
            },
            {
                index: 'i',
                pregunta: "Los documentos (Word, Excel, PDF, PowerPoint, etc.) cumplen con los criterios de accesibilidad establecidos en el Anexo 1 de la Resolución 1519 de 2020 para ser consultados fácilmente por cualquier persona?",
                estado: "N/A - Requiere análisis manual de documentos externos",
                detalles: "Axe-core no analiza la accesibilidad de documentos externos al HTML."
            }
        ];

        res.json({
            dominio: domain,
            evaluacion,
            detalles_completos: results
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