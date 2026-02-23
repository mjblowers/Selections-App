# Build script to create a single-file bundled version of the Selections App
# Run: .\build-bundle.ps1

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Read the source files with UTF-8 encoding
$html = Get-Content "$scriptDir\alt-spreadsheet-viewer.html" -Raw -Encoding UTF8
$css = Get-Content "$scriptDir\css\alt-styles.css" -Raw -Encoding UTF8
$js = Get-Content "$scriptDir\js\alt-app.js" -Raw -Encoding UTF8

# Read the external libraries (downloaded locally)
$xlsx = Get-Content "$scriptDir\libs\xlsx.full.min.js" -Raw -Encoding UTF8
$exceljs = Get-Content "$scriptDir\libs\exceljs.min.js" -Raw -Encoding UTF8
$filesaver = Get-Content "$scriptDir\libs\FileSaver.min.js" -Raw -Encoding UTF8

# Replace external library CDN links with inline scripts (using .Replace() for literal strings)
$html = $html.Replace('<script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>', "<script>$xlsx</script>")
$html = $html.Replace('<script src="https://cdn.jsdelivr.net/npm/exceljs/dist/exceljs.min.js"></script>', "<script>$exceljs</script>")
$html = $html.Replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js"></script>', "<script>$filesaver</script>")

# Replace the CSS link with inline styles
$html = $html.Replace('<link rel="stylesheet" href="css/alt-styles.css" />', "<style>`n$css`n    </style>")

# Replace the JS script src with inline script
$html = $html.Replace('<script src="js/alt-app.js"></script>', "<script>`n$js`n    </script>")

# Write the bundled file with proper UTF-8 encoding (with BOM for browser compatibility)
$outputPath = "$scriptDir\selections-app-bundled.html"
[System.IO.File]::WriteAllText($outputPath, $html, [System.Text.UTF8Encoding]::new($true))

Write-Host "Bundle created: $outputPath" -ForegroundColor Green
Write-Host "File size: $([math]::Round((Get-Item $outputPath).Length / 1KB, 2)) KB"
