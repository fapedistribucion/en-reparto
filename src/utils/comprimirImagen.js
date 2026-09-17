// Patrón de PharmaSPOT: comprime en el navegador antes de subir, sin
// librerías externas. Ver Compresion_Imagenes_PharmaSPOT.md para el
// razonamiento completo detrás de los números usados acá.

const MAX_MB = 10;
const MAX_DIM = 1800;
const MAX_PESO_BYTES = 800 * 1024;
const CALIDAD_INICIAL = 0.85;
const CALIDAD_MINIMA = 0.3;

export async function comprimirImagen(file) {
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`El archivo supera los ${MAX_MB} MB.`);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
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
      };

      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}
