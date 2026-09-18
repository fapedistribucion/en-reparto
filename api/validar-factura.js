// Función serverless de Vercel -- corre en el servidor, nunca en el navegador.
// La API key de Google Cloud Vision vive solo aquí (variable de entorno
// GOOGLE_CLOUD_VISION_API_KEY), jamás se expone al frontend.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { imagenBase64, numeroFactura } = req.body ?? {};

  if (!imagenBase64 || !numeroFactura) {
    return res.status(400).json({ error: "Faltan datos (imagenBase64, numeroFactura)" });
  }

  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Falta configurar GOOGLE_CLOUD_VISION_API_KEY en Vercel" });
  }

  try {
    const respuesta = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: imagenBase64 },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      }),
    });

    const resultado = await respuesta.json();
    const textoDetectado = resultado?.responses?.[0]?.fullTextAnnotation?.text ?? "";

    // Comparación tolerante: solo los últimos 6 dígitos (el número de
    // comprobante en sí, sin el código de serie), ignorando guiones,
    // espacios y cualquier ruido que meta el OCR.
    const soloDigitosFactura = numeroFactura.replace(/\D/g, "").slice(-6);
    const soloDigitosTexto = textoDetectado.replace(/\D/g, "");
    const coincide = soloDigitosFactura.length === 6 && soloDigitosTexto.includes(soloDigitosFactura);

    return res.status(200).json({ coincide, textoDetectado });
  } catch (error) {
    return res.status(500).json({ error: "Error al procesar la imagen", detalle: error.message });
  }
}
