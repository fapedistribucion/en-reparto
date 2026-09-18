# actualizar.ps1
# Colocar este archivo UNA VEZ en la raíz del proyecto (junto a package.json).
#
# Uso, cada vez que Claude te pase un zip nuevo:
#   1. Descarga el zip (se va a tu carpeta de Descargas, con o sin sufijo (1), (2)...)
#   2. Abre PowerShell en la carpeta del proyecto
#   3. Corre:  .\actualizar.ps1 "mensaje corto de que cambiaste"
#
# El script busca el zip que empiece con "en-reparto" más reciente en Descargas,
# lo extrae, sobrescribe los archivos del proyecto, y hace git add + commit + push.

param(
    [string]$Mensaje = "Actualizacion desde Claude"
)

$carpetaDescargas = "$env:USERPROFILE\Downloads"
$carpetaProyecto = Get-Location

# 1. Buscar el zip mas reciente que empiece con "en-reparto"
$zip = Get-ChildItem -Path $carpetaDescargas -Filter "en-reparto*.zip" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $zip) {
    Write-Host "No se encontro ningun zip 'en-reparto*.zip' en Descargas." -ForegroundColor Red
    exit 1
}

Write-Host "Usando: $($zip.Name)" -ForegroundColor Cyan

# 2. Extraer a una carpeta temporal (limpia, para no arrastrar restos de una corrida anterior)
$temp = Join-Path $env:TEMP "en-reparto-extraccion"
if (Test-Path $temp) { Remove-Item $temp -Recurse -Force }
Expand-Archive -Path $zip.FullName -DestinationPath $temp

# 3. Si el zip trae una sola carpeta contenedora (ej. "en-reparto-cambios/"),
#    usar esa como origen real -- si no, usar la raiz de la extraccion tal cual.
$items = Get-ChildItem $temp
if ($items.Count -eq 1 -and $items[0].PSIsContainer) {
    $origen = $items[0].FullName
} else {
    $origen = $temp
}

# 4. Copiar hacia la carpeta del proyecto, sobrescribiendo lo que ya existe
robocopy $origen $carpetaProyecto /E /NFL /NDL /NJH /NJS | Out-Null

# 5. Mover el zip ya procesado, para no confundirlo con uno nuevo la proxima vez
$carpetaProcesados = Join-Path $carpetaDescargas "en-reparto-procesados"
if (-not (Test-Path $carpetaProcesados)) { New-Item -ItemType Directory -Path $carpetaProcesados | Out-Null }
Move-Item $zip.FullName -Destination $carpetaProcesados -Force

# 6. Git add, commit, push
git add -A
git commit -m $Mensaje
git push

Write-Host "Listo. Cambios aplicados y subidos con el mensaje: $Mensaje" -ForegroundColor Green
