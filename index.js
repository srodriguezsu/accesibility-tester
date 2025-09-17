const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

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
                key: API_KEY
            }
        });

        const audits = data.lighthouseResult.audits;

        const evaluacion = [
            {
                index: "a",
                pregunta: "¿Los elementos no textuales tienen texto alternativo?",
                estado: getStatus(audits, "image-alt"),
                detalles: audits["image-alt"]
            },
            {
                index: "b",
                pregunta: "¿Los videos o elementos multimedia tienen subtítulos y audio descripción?",
                estado: "N/A - Requiere análisis manual",
                detalles: []
            },
            {
                index: "c",
                pregunta: "¿El texto cumple con contraste y escalabilidad?",
                estado: getStatus(audits, "color-contrast"),
                detalles: audits["color-contrast"]
            },
            {
                index: "d",
                pregunta: "¿El código está ordenado con lenguaje marcado bien utilizado?",
                estado: getStatus(audits, "aria-valid-attr"),
                detalles: [
                    { criterio: "Idioma", estado: getStatus(audits, "html-has-lang") },
                    { criterio: "Encabezados vacíos", estado: getStatus(audits, "empty-heading") },
                    { criterio: "Roles ARIA válidos", estado: getStatus(audits, "aria-valid-attr") }
                ]
            },
            {
                index: "e",
                pregunta: "¿Los formularios tienen advertencias o instrucciones claras?",
                estado: "Parcial - Requiere análisis de contexto",
                detalles: [
                    { criterio: "Etiquetas", estado: getStatus(audits, "label") },
                    { criterio: "Nombres de inputs", estado: getStatus(audits, "input-has-name") }
                ]
            },
            {
                index: "f",
                pregunta: "¿Tabulación ordenada?",
                estado: "Parcial - Requiere análisis manual",
                detalles: []
            },
            {
                index: "g",
                pregunta: "¿Control de contenidos con movimientos/parpadeos?",
                estado: getStatus(audits, "blink"),
                detalles: audits["blink"]
            },
            {
                index: "h",
                pregunta: "¿Lenguaje claro en títulos, enlaces y formularios?",
                estado: "Parcial - Requiere análisis manual",
                detalles: [
                    { criterio: "Título del documento", estado: getStatus(audits, "document-title") },
                    { criterio: "Nombres de enlaces", estado: getStatus(audits, "link-name") }
                ]
            },
            {
                index: "i",
                pregunta: "¿Documentos externos cumplen accesibilidad?",
                estado: "N/A - Manual",
                detalles: []
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
