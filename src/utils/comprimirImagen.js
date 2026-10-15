// Patrón de PharmaSPOT: comprime en el navegador antes de subir.
// Novedad: soporta fotos HEIC/HEIF (formato "alta eficiencia" de algunas cámaras de celular).
// Chrome en Android no puede abrir HEIC, así que se convierten a JPG con heic2any, una librería
// que se descarga solo cuando llega una foto HEIC (no pesa nada para el resto de fotos).

const MAX_MB = 10;
const MAX_DIM = 1800;
const MAX_PESO_BYTES = 800 * 1024;
const CALIDAD_INICIAL = 0.85;
const CALIDAD_MINIMA = 0.3;
const URL_HEIC2ANY = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";

function esHeic(file) {
  return /image\/hei[cf]/i.test(file.type || "") || /\.hei[cf]$/i.test(file.name || "");
}

function cargarHeic2any() {
  if (typeof window !== "undefined" && window.heic2any) return Promise.resolve(window.heic2any);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = URL_HEIC2ANY;
    s.onload = () => (window.heic2any ? resolve(window.heic2any) : reject(new Error("conversor no disponible")));
    s.onerror = () => reject(new Error("no se pudo descargar el conversor"));
    document.head.appendChild(s);
  });
}

async function convertirHeicAJpg(file) {
  const heic2any = await cargarHeic2any();
  const salida = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  return Array.isArray(salida) ? salida[0] : salida;
}

function cargarImagen(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = e.target.result;
    };
    reader.readAsDataURL(blob);
  });
}

async function abrirImagen(file) {
  // 1) Si es HEIC se convierte directo; 2) si no, se abre normal y, si falla, se reintenta como HEIC.
  if (esHeic(file)) {
    try {
      return await cargarImagen(await convertirHeicAJpg(file));
    } catch (e) {
      throw new Error(
        "La foto está en formato HEIC y no se pudo convertir. Toma la foto de nuevo con la cámara " +
          "(o cambia el formato de la cámara a JPG) e inténtalo otra vez."
      );
    }
  }
  try {
    return await cargarImagen(file);
  } catch (errorNormal) {
    try {
      return await cargarImagen(await convertirHeicAJpg(file));
    } catch {
      throw errorNormal;
    }
  }
}

export async function comprimirImagen(file) {
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`El archivo supera los ${MAX_MB} MB.`);
  }

  const img = await abrirImagen(file);

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    let { width, height } = img;

    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);

    let calidad = CALIDAD_INICIAL;

    const intentarComprimir = () => {
      canvas.toBlob(
        (blob) => {
          if (blob.size > MAX_PESO_BYTES && calidad > CALIDAD_MINIMA) {
            calidad -= 0.1;
            intentarComprimir();
          } else {
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                type: "image/jpeg",
              })
            );
          }
        },
        "image/jpeg",
        calidad
      );
    };

    intentarComprimir();
  });
}
