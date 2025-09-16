# 
# Author: Cascade using Claude 3.5 Sonnet
# Date: 2025-09-14T22:52:58-04:00
# Purpose: Generate all required favicon files from the existing SVG
# 
# This script converts the assessment-favicon.svg into multiple PNG formats
# and creates a multi-size favicon.ico file for comprehensive browser support.
# Requires ImageMagick to be installed and available in PATH.
#

# Check if ImageMagick is available
if (-not (Get-Command "magick" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: ImageMagick is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install ImageMagick from https://imagemagick.org/" -ForegroundColor Yellow
    exit 1
}

# Set paths
$svgSource = "d:\1Projects\sfmc\client\public\assessment-favicon.svg"
$publicDir = "d:\1Projects\sfmc\client\public"

Write-Host "Generating favicon files from $svgSource..." -ForegroundColor Green

# Create individual PNG files for different use cases
Write-Host "Creating PNG variants..." -ForegroundColor Cyan

# Standard favicon sizes
& magick convert "$svgSource" -resize 16x16 "$publicDir\favicon-16x16.png"
& magick convert "$svgSource" -resize 32x32 "$publicDir\favicon-32x32.png"

# Android/PWA sizes
& magick convert "$svgSource" -resize 192x192 "$publicDir\favicon-192x192.png"
& magick convert "$svgSource" -resize 512x512 "$publicDir\favicon-512x512.png"

# Apple touch icon (180x180 with rounded corners for iOS)
& magick convert "$svgSource" -resize 180x180 "$publicDir\apple-touch-icon.png"

# Create multi-size favicon.ico (16x16 and 32x32 combined)
Write-Host "Creating favicon.ico with multiple sizes..." -ForegroundColor Cyan
& magick convert "$publicDir\favicon-16x16.png" "$publicDir\favicon-32x32.png" "$publicDir\favicon.ico"

Write-Host "Favicon generation complete!" -ForegroundColor Green
Write-Host "Generated files:" -ForegroundColor White
Write-Host "  - favicon.ico (16x16, 32x32)" -ForegroundColor Gray
Write-Host "  - favicon-16x16.png" -ForegroundColor Gray
Write-Host "  - favicon-32x32.png" -ForegroundColor Gray
Write-Host "  - favicon-192x192.png" -ForegroundColor Gray
Write-Host "  - favicon-512x512.png" -ForegroundColor Gray
Write-Host "  - apple-touch-icon.png" -ForegroundColor Gray
