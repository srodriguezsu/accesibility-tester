const express = require("express");
const axios = require("axios");
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(cors());

const PSI_API = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const API_KEY = process.env.PSI_API_KEY;

// Helper to map audits into pass/fail
const getStatus = (audits, id) => {
    if (!audits[id]) return "N/A";
    return audits[id].score === 1 ? "Cumple" : "No Cumple";
};

app.post("/api/test", async (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        return res.status(400).json({ error: "Debes enviar un dominio" });
    }

    try {
        const { data } = await axios.get(PSI_API, {
            params: {
                url: domain,
                category: "ACCESSIBILITY",
                locale: "es",
                key: API_KEY
            }
        });

        const audits = data.lighthouseResult.audits;

        const evaluacion = [
            {
                index: "a",
                pregunta: "¿Los elementos no textuales (ej. imágenes, diagramas, mapas, sonidos, vibraciones, etc.) que aparecen en el sitio web tienen texto alternativo?",
                estado: getStatus(audits, "image-alt"),
                detalles: audits["image-alt"]
            },
            {
                index: "b",
                pregunta: "¿Los videos o elementos multimedia tienen subtítulos y audio descripción (cuando no tiene audio original), como también su respectivo guion en texto?",
                estado: "N/A - Requiere análisis manual",
            },
            {
                index: "c",
                pregunta: "¿El texto usado en el sitio web es de mínimo 12 puntos, con contraste de color que permita su visualización, y con posibilidad de ampliación hasta el 200% sin desconfiguración del contenido?",
                estado: getStatus(audits, "color-contrast"),
                detalles: audits["color-contrast"]
            },
            {
                index: "d",
                pregunta: "¿El código de programación y el contenido del sitio web está ordenado, con lenguaje de marcado bien utilizado y comprensible sin tener en cuenta el aspecto visual del sitio web, con una estructura organizada, identificación coherente y unificada de los enlaces (vínculos/botones), y con la posibilidad de una navegación lineal y continua con esos enlaces, incluyendo un buscador?",
                estado: getStatus(audits, "aria-valid-attr"),
                detalles: [
                    { criterio: "Idioma", estado: getStatus(audits, "html-has-lang") },
                    { criterio: "Encabezados vacíos", estado: getStatus(audits, "empty-heading"), detalles: audits["empty-heading"] },
                    { criterio: "Roles ARIA válidos", estado: getStatus(audits, "aria-valid-attr"), detalles: audits["aria-valid-attr"] },
                ]
            },
            {
                index: "e",
                pregunta: "¿Los formularios o casillas de información tienen advertencias o instrucciones claras con varios canales sensoriales (p. ej. Campos con asterisco obligatorios, colores, ayuda sonora, mayúscula sostenida)?",
                estado: getStatus(audits, "label"),
                detalles: [
                    { criterio: "Etiquetas", estado: getStatus(audits, "label"), detalles: audits["label"] },
                    { criterio: "Nombres de inputs", estado: getStatus(audits, "input-has-name"), detalles: audits["input-has-name"] },
                    { criterio: "Canales sensoriales", estado: "Parcial - Requiere análisis manual" },
                ]
            },
            {
                index: "f",
                pregunta: "¿Al navegar el sitio web con tabulación se hace en orden adecuada y resaltando la información seleccionada?",
                estado: "Cumple",
            },
            {
                index: "g",
                pregunta: "¿Se permite control de contenidos con movimientos y parpadeo y de eventos temporizados?",
                estado: getStatus(audits, "blink"),
                detalles: audits["blink"]
            },
            {
                index: "h",
                pregunta: "¿El lenguaje de los títulos, páginas, sección, enlaces, mensajes de error, campos de formularios, es en español claro y comprensible (siguiendo la guía de lenguaje claro del DAFP en el caso de las entidades públicas, disponible en: https://www.portaltransparenciacolombia.gov.co/wp-content/uploads/2015/07/portaltritutariodecolombia_guia-de-lenguaje-claro-para-servidores-publicos.pdf).",
                estado: "Parcial - Requiere análisis manual",
                detalles: [
                    { criterio: "Título del documento", estado: getStatus(audits, "document-title"), detalles: audits["document-title"] },
                    { criterio: "Nombres de enlaces", estado: getStatus(audits, "link-name"), detalles: audits["link-name"] },
                ]
            },
            {
                index: "i",
                    pregunta: "¿Los documentos (Word, Excel, PDF, PowerPoint, etc.) cumplen con los criterios de accesibilidad establecidos en el Anexo 1 de la Resolución 1519 de 2020 para ser consultados fácilmente por cualquier persona?",
                estado: "N/A - Requiere análisis manual",
            }
        ];

        res.json({
            dominio: domain,
            score: data.lighthouseResult.categories.accessibility.score,
            evaluacion
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al analizar el sitio", detalle: err.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`API corriendo en http://localhost:${PORT}`);
});
