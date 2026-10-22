import { crearZip, guardarBlob } from "./descargarFotos";

// Exporta tablas a un archivo Excel (.xlsx) real, sin librerías externas: un .xlsx es un ZIP con unos
// pocos XML (se reutiliza crearZip, el mismo de las fotos). Lo que se obtiene en Excel:
//  - encabezado en negrita con color y primera fila fija, con filtros de Excel activados,
//  - ancho de cada columna ajustado a su contenido,
//  - fechas como fechas reales de Excel mostradas DD/MM/AAAA (o DD/MM/AAAA HH:MM), no como texto,
//  - números como números; todo lo demás (facturas, pedidos, códigos) como texto, para no perder ceros.
//
// `columnas`: [{ titulo, tipo, valor }]
//    tipo  = "texto" (por defecto) | "numero" | "fecha" (solo el día) | "fechahora" (día y hora)
//    valor = (fila) => dato. Para "fecha" / "fechahora": un ISO ("2026-10-17" o "2026-10-17T15:04:00Z") o null.
// `filas`: lo que se exportará, ya filtrado y ordenado como se ve en pantalla.

const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const OFFSET_LIMA_MS = 5 * 60 * 60 * 1000; // Perú: UTC-5 todo el año (sin horario de verano)
const MS_DIA = 86400000;
const EPOCA_EXCEL = 25569; // días entre 1899-12-30 (origen de Excel) y 1970-01-01

// Estilos (posición dentro de cellXfs en styles.xml)
const ESTILO_ENCABEZADO = 1;
const ESTILO_FECHA = 2;
const ESTILO_FECHA_HORA = 3;

function escaparXml(texto) {
  return String(texto)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "") // caracteres que el XML no admite
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A, B, ..., Z, AA, AB...
function letraColumna(indice) {
  let n = indice + 1;
  let letras = "";
  while (n > 0) {
    const resto = (n - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    n = Math.floor((n - 1) / 26);
  }
  return letras;
}

// ISO -> número de serie de Excel en hora de Lima. Devuelve null si no se puede leer.
// Un "2026-10-17" (fecha sin hora) es el día tal cual; un instante con hora se pasa a hora de Lima.
export function serieExcel(valor, conHora) {
  if (valor === null || valor === undefined || valor === "") return null;

  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [a, m, d] = valor.split("-").map(Number);
    return Date.UTC(a, m - 1, d) / MS_DIA + EPOCA_EXCEL;
  }

  const instante = valor instanceof Date ? valor.getTime() : new Date(valor).getTime();
  if (Number.isNaN(instante)) return null;
  const serie = (instante - OFFSET_LIMA_MS) / MS_DIA + EPOCA_EXCEL;
  if (conHora) return Math.round(serie * 1440) / 1440; // al minuto
  return Math.floor(serie + 1e-9);
}

// Lo mismo que se verá en la celda, para medir el ancho de la columna.
function textoFecha(serie, conHora) {
  const ms = Math.round((serie - EPOCA_EXCEL) * MS_DIA);
  const f = new Date(ms);
  const dd = String(f.getUTCDate()).padStart(2, "0");
  const mm = String(f.getUTCMonth() + 1).padStart(2, "0");
  const base = `${dd}/${mm}/${f.getUTCFullYear()}`;
  if (!conHora) return base;
  return `${base} ${String(f.getUTCHours()).padStart(2, "0")}:${String(f.getUTCMinutes()).padStart(2, "0")}`;
}

function celdaTexto(referencia, texto, estilo = 0) {
  const s = estilo ? ` s="${estilo}"` : "";
  return `<c r="${referencia}"${s} t="inlineStr"><is><t xml:space="preserve">${escaparXml(texto)}</t></is></c>`;
}

function construirHoja(columnas, filas) {
  const anchos = columnas.map((c) => String(c.titulo).length + 4);
  const xmlFilas = [];

  // Encabezado
  const celdasEncabezado = columnas.map((c, i) => celdaTexto(`${letraColumna(i)}1`, c.titulo, ESTILO_ENCABEZADO));
  xmlFilas.push(`<row r="1" ht="30" customHeight="1">${celdasEncabezado.join("")}</row>`);

  filas.forEach((fila, f) => {
    const r = f + 2;
    const celdas = [];
    columnas.forEach((c, i) => {
      const ref = `${letraColumna(i)}${r}`;
      const crudo = c.valor ? c.valor(fila) : fila[c.clave];
      if (crudo === null || crudo === undefined || crudo === "") return;

      const tipo = c.tipo ?? "texto";
      if (tipo === "fecha" || tipo === "fechahora") {
        const conHora = tipo === "fechahora";
        const serie = serieExcel(crudo, conHora);
        if (serie !== null) {
          celdas.push(`<c r="${ref}" s="${conHora ? ESTILO_FECHA_HORA : ESTILO_FECHA}"><v>${serie}</v></c>`);
          anchos[i] = Math.max(anchos[i], textoFecha(serie, conHora).length + 2);
          return;
        }
      } else if (tipo === "numero") {
        const n = Number(crudo);
        if (Number.isFinite(n)) {
          celdas.push(`<c r="${ref}"><v>${n}</v></c>`);
          anchos[i] = Math.max(anchos[i], String(n).length + 2);
          return;
        }
      }
      const texto = String(crudo);
      celdas.push(celdaTexto(ref, texto));
      // El ancho se mide con la línea más larga (por si el texto trae saltos de línea)
      const largo = Math.max(...texto.split("\n").map((l) => l.length));
      anchos[i] = Math.max(anchos[i], largo + 2);
    });
    xmlFilas.push(`<row r="${r}">${celdas.join("")}</row>`);
  });

  const cols = anchos
    .map((a, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.min(Math.max(a, 10), 60)}" customWidth="1"/>`)
    .join("");

  const ultimaColumna = letraColumna(Math.max(columnas.length - 1, 0));
  const ultimaFila = filas.length + 1;

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<dimension ref="A1:${ultimaColumna}${ultimaFila}"/>` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    `<cols>${cols}</cols>` +
    `<sheetData>${xmlFilas.join("")}</sheetData>` +
    `<autoFilter ref="A1:${ultimaColumna}${ultimaFila}"/>` +
    `</worksheet>`
  );
}

const ESTILOS =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy\\ hh:mm"/></numFmts>` +
  `<fonts count="2">` +
  `<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>` +
  `<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font>` +
  `</fonts>` +
  `<fills count="3">` +
  `<fill><patternFill patternType="none"/></fill>` +
  `<fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFC8302A"/><bgColor indexed="64"/></patternFill></fill>` +
  `</fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="4">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>` +
  `<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>` +
  `<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="center"/></xf>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`;

function nombreHoja(texto) {
  // Excel: máximo 31 caracteres y sin : \ / ? * [ ]
  return String(texto || "Datos").replace(/[:\\/?*[\]]/g, " ").slice(0, 31);
}

// Arma el .xlsx y devuelve el Blob (separado de la descarga para poder probarlo).
export function construirExcel(columnas, filas, hoja = "Datos") {
  const codificador = new TextEncoder();
  const archivo = (nombre, contenido) => ({ nombre, datos: codificador.encode(contenido) });

  const zip = crearZip([
    archivo(
      "[Content_Types].xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`
    ),
    archivo(
      "_rels/.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`
    ),
    archivo(
      "xl/workbook.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${escaparXml(nombreHoja(hoja))}" sheetId="1" r:id="rId1"/></sheets>` +
        `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${escaparXml(nombreHoja(hoja))}'!$A$1:$${letraColumna(Math.max(columnas.length - 1, 0))}$${filas.length + 1}</definedName></definedNames>` +
        `</workbook>`
    ),
    archivo(
      "xl/_rels/workbook.xml.rels",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`
    ),
    archivo("xl/styles.xml", ESTILOS),
    archivo("xl/worksheets/sheet1.xml", construirHoja(columnas, filas)),
  ]);

  return new Blob([zip], { type: TIPO_XLSX });
}

// Fecha de hoy en Lima como AAAA-MM-DD, para el nombre del archivo.
function hoyLima() {
  return new Date(Date.now() - OFFSET_LIMA_MS).toISOString().slice(0, 10);
}

// Genera y descarga el Excel. `nombreArchivo` sin extensión; se le agrega la fecha de hoy.
export function exportarExcel(nombreArchivo, columnas, filas, hoja) {
  const blob = construirExcel(columnas, filas, hoja);
  guardarBlob(blob, `${nombreArchivo}_${hoyLima()}.xlsx`);
}
