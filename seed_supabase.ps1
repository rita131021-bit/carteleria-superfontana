# =========================================================================
# SCRIPT DE CARGA INICIAL (SEED) - SUPER FONTANA DESIGNER
# Ejecutar en PowerShell para subir los 63 carteles históricos a Supabase
# =========================================================================

Clear-Host
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host "       SUPER FONTANA DESIGNER - INICIALIZADOR          " -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
Write-Host ""

# 1. Solicitar credenciales de Supabase
$supabaseUrl = Read-Host "Ingresa la URL de tu proyecto Supabase (ej: https://xxxx.supabase.co)"
$serviceKey = Read-Host "Ingresa tu Supabase Service Role Key (secret key para subir archivos)"

if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($serviceKey)) {
    Write-Error "La URL y la Service Role Key son requeridas."
    exit 1
}

# Normalizar URL
$supabaseUrl = $supabaseUrl.Trim().TrimEnd('/')

# 2. Definir rutas y categorías
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$refDir = Join-Path $scriptDir "referencias"

if (-not (Test-Path $refDir)) {
    Write-Error "No se encontró la carpeta 'referencias' al lado del script."
    exit 1
}

$categorias = @(
    "01_marcas",
    "02_gondola_producto",
    "03_precio_mayorista",
    "04_variedades_mismo_precio",
    "05_sin_imagen_solo_texto",
    "06_logo_plantilla"
)

# 3. Función para subir archivo a Supabase Storage
function Upload-FileToStorage {
    param (
        [string]$Bucket,
        [string]$StoragePath,
        [string]$LocalFilePath
    )

    $mimeType = "image/png"
    if ($LocalFilePath.EndsWith(".jpg") -or $LocalFilePath.EndsWith(".jpeg")) {
        $mimeType = "image/jpeg"
    } elseif ($LocalFilePath.EndsWith(".webp")) {
        $mimeType = "image/webp"
    }

    $uploadUrl = "$supabaseUrl/storage/v1/object/$Bucket/$StoragePath"
    $headers = @{
        "Authorization" = "Bearer $serviceKey"
        "apikey" = $serviceKey
        "Content-Type" = $mimeType
    }

    try {
        $response = Invoke-RestMethod -Uri $uploadUrl -Method Post -Headers $headers -InFile $LocalFilePath -ErrorAction Stop
        $publicUrl = "$supabaseUrl/storage/v1/object/public/$Bucket/$StoragePath"
        return $publicUrl
    }
    catch {
        # Si ya existe, podemos intentar obtener la URL pública
        if ($_.Exception.Message -match "409" -or $_.Exception.Message -match "Already exists") {
            return "$supabaseUrl/storage/v1/object/public/$Bucket/$StoragePath"
        }
        throw $_
    }
}

# 4. Función para insertar registro en la base de datos
function Insert-DatabaseRecord {
    param (
        [string]$Table,
        [hashtable]$Record
    )

    $dbUrl = "$supabaseUrl/rest/v1/$Table"
    $headers = @{
        "Authorization" = "Bearer $serviceKey"
        "apikey" = $serviceKey
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    }

    $body = $Record | ConvertTo-Json -Depth 5
    try {
        $response = Invoke-RestMethod -Uri $dbUrl -Method Post -Headers $headers -Body $body -ErrorAction Stop
        return $response
    }
    catch {
        throw $_
    }
}

# 5. Cargar Logo Oficial de Supermercado Fontana
$logoFile = Join-Path $scriptDir "logo_super_fontana.jpg"
if (Test-Path $logoFile) {
    Write-Host "Subiendo logo oficial de Supermercado Fontana..." -ForegroundColor Cyan
    try {
        $logoUrl = Upload-FileToStorage -Bucket "identidad" -StoragePath "logo_super_fontana.jpg" -LocalFilePath $logoFile
        Write-Host "Logo oficial subido con éxito: $logoUrl" -ForegroundColor Green
    }
    catch {
        Write-Warning "No se pudo subir el logo oficial a Storage: $_"
    }
} else {
    Write-Warning "No se encontró el archivo logo_super_fontana.jpg en el directorio raíz."
}

# 6. Procesar y subir plantillas
Write-Host "`nIniciando carga de las 63 plantillas históricas..." -ForegroundColor Cyan
$total = 0
$exitos = 0
$fallas = 0

foreach ($cat in $categorias) {
    $catDir = Join-Path $refDir $cat
    if (-not (Test-Path $catDir)) {
        Write-Host "Saltando carpeta inexistente: $cat" -ForegroundColor Yellow
        continue
    }

    $files = Get-ChildItem -Path $catDir -File | Where-Object { $_.Extension -match "\.(png|jpg|jpeg|webp)$" }
    
    foreach ($file in $files) {
        $total++
        $storagePath = "$cat/$($file.Name)"
        Write-Host "[Cargando ($total)] $cat -> $($file.Name)... " -NoNewline

        try {
            # Subir a storage
            $imageUrl = Upload-FileToStorage -Bucket "diseños" -StoragePath $storagePath -LocalFilePath $file.FullName

            # Mapear estilo por defecto
            $estilo = "General"
            if ($cat -eq "02_gondola_producto") {
                if ($file.Name -match "vino" -or $file.Name -match "colón" -or $file.Name -match "selecto") {
                    $estilo = "Elegante"
                } elseif ($file.Name -match "detergente" -or $file.Name -match "limpieza" -or $file.Name -match "signo") {
                    $estilo = "Confianza"
                } elseif ($file.Name -match "banana" -or $file.Name -match "fruta" -or $file.Name -match "verdura") {
                    $estilo = "Fresco"
                } else {
                    $estilo = "Familiar"
                }
            }

            # Crear configuración de parches inicial vacía
            $configParches = @{}

            # Insertar en base de datos
            $record = @{
                "nombre" = $file.BaseName
                "imagen_url" = $imageUrl
                "categoria_cartel" = $cat
                "estilo" = $estilo
                "config_parches" = $configParches
            }

            $dbRes = Insert-DatabaseRecord -Table "diseños_base" -Record $record
            Write-Host "OK" -ForegroundColor Green
            $exitos++
        }
        catch {
            Write-Host "ERROR: $_" -ForegroundColor Red
            $fallas++
        }
    }
}

Write-Host "`nProceso Finalizado." -ForegroundColor Yellow
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
Write-Host "Total Procesados: $total"
Write-Host "Subidos Correctamente: $exitos" -ForegroundColor Green
Write-Host "Fallidos: $fallas" -ForegroundColor (if ($fallas -gt 0) { "Red" } else { "Gray" })
Write-Host "--------------------------------------------------------" -ForegroundColor Yellow
Write-Host "`nCopia estos valores de configuración para tu proyecto:"
Write-Host "SUPABASE_URL: $supabaseUrl" -ForegroundColor Cyan
Write-Host "SUPABASE_KEY: (Tu clave anónima pública)" -ForegroundColor Cyan
Write-Host ""
