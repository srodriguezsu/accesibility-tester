const express = require("express");
const axios = require("axios");
const cors = require('cors');
const {getStatus, getMultipleStatus, getLighthouse} = require("./services");

const app = express();

app.use(express.json());
app.use(cors());



app.post("/api/test", async (req, res) => {
    const { domain } = req.body;
    if (!domain) {
        return res.status(400).json({ error: "Debes enviar un dominio" });
    }
    const { audits, categories } = await getLighthouse(domain);
    try {


        const evaluacion = [
            {
                index: "1.1.A",
                pregunta: "¿Los elementos no textuales (ej. imágenes, diagramas, mapas, sonidos, vibraciones, etc.) que aparecen en el sitio web tienen texto alternativo?",
                estado: getMultipleStatus(audits, ["image-alt", "image-redundant-alt"]),
                auditorias: [audits["image-alt"], audits["image-redundant-alt"]]
            },
            {
                index: "1.1.B",
                pregunta: "¿Los videos o elementos multimedia tienen subtítulos y audio descripción (cuando no tiene audio original), como también su respectivo guion en texto?",
                estado: "N/A - Requiere análisis manual",
            },
            {
                index: "1.1.C",
                pregunta: "¿El texto usado en el sitio web es de mínimo 12 puntos, con contraste de color que permita su visualización, y con posibilidad de ampliación hasta el 200% sin desconfiguración del contenido?",
                estado: getStatus(audits, "color-contrast"),
                auditorias: [audits["color-contrast"]]
            },
            {
                index: "1.1.D",
                pregunta: "¿El código de programación y el contenido del sitio web está ordenado, con lenguaje de marcado bien utilizado y comprensible sin tener en cuenta el aspecto visual del sitio web, con una estructura organizada, identificación coherente y unificada de los enlaces (vínculos/botones), y con la posibilidad de una navegación lineal y continua con esos enlaces, incluyendo un buscador?",
                estado: getMultipleStatus(audits, ["html-has-lang", "aria-valid-attr", "aria-deprecated-role"]),
                auditorias: [
                    audits["html-has-lang"],
                    audits["aria-valid-attr"],
                    audits["aria-deprecated-role"],
                ]
            },
            {
                index: "1.1.E",
                pregunta: "¿Los formularios o casillas de información tienen advertencias o instrucciones claras con varios canales sensoriales (p. ej. Campos con asterisco obligatorios, colores, ayuda sonora, mayúscula sostenida)?",
                estado: getStatus(audits, "label"),
                auditorias: [
                    audits["label"]
                ]
            },
            {
                index: "1.1.F",
                pregunta: "¿Al navegar el sitio web con tabulación se hace en orden adecuada y resaltando la información seleccionada?",
                estado: getStatus(audits, "tabindex"),
                auditorias: [audits["tabindex"]]
            },
            {
                index: "1.1.G",
                pregunta: "¿Se permite control de contenidos con movimientos y parpadeo y de eventos temporizados?",
                estado: getStatus(audits, "blink"),
                auditorias: [audits["blink"]]
            },
            {
                index: "1.1.H",
                pregunta: "¿El lenguaje de los títulos, páginas, sección, enlaces, mensajes de error, campos de formularios, es en español claro y comprensible (siguiendo la guía de lenguaje claro del DAFP en el caso de las entidades públicas, disponible en: https://www.portaltransparenciacolombia.gov.co/wp-content/uploads/2015/07/portaltritutariodecolombia_guia-de-lenguaje-claro-para-servidores-publicos.pdf).",
                estado: getMultipleStatus(audits, ["document-title", "link-name", "button-name", "aria-hidden-body", "aria-hidden-focus"]),
                auditorias: [
                    audits["document-title"],
                    audits["link-name"],
                    audits["button-name"],
                    audits["aria-hidden-body"],
                    audits["aria-hidden-focus"],
                ]
            },
            {
                index: "1.1.I",
                    pregunta: "¿Los documentos (Word, Excel, PDF, PowerPoint, etc.) cumplen con los criterios de accesibilidad establecidos en el Anexo 1 de la Resolución 1519 de 2020 para ser consultados fácilmente por cualquier persona?",
                estado: "N/A - Requiere análisis manual",
            },
        ];

        res.json({
            dominio: domain,
            score: categories.accessibility.score,
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
