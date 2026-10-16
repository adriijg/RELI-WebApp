<#
.SYNOPSIS
    Configura los secretos y variables de GitHub Actions para el CD de RELI-WebApp.
.DESCRIPTION
    Pide los valores por consola (los sensibles en modo seguro) y los sube al repo
    con "gh secret set", sin escribirlos en el historial ni en la linea de comandos.
    Requiere haber hecho antes: gh auth login
.EXAMPLE
    .\scripts\setup-cicd.ps1
#>

param(
    [string]$Repo = "adriijg/RELI-WebApp"
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    $candidate = "C:\Program Files\GitHub CLI\gh.exe"
    if (Test-Path $candidate) { Set-Alias gh $candidate } else {
        Write-Host "[ERROR] gh no esta instalado. Ejecuta: winget install --id GitHub.cli -e" -ForegroundColor Red
        exit 1
    }
}

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] No hay sesion en gh. Ejecuta primero: gh auth login" -ForegroundColor Red
    exit 1
}

function Set-GhSecret {
    param([string]$Name, [switch]$Secure, [string]$Default)
    $prompt = if ($Secure) { "valor de $Name (oculto)" } else { "valor de $Name" }
    if ($Secure) {
        $sec = Read-Host -Prompt $prompt -AsSecureString
        $val = [System.Net.NetworkCredential]::new("", $sec).Password
    } else {
        $val = Read-Host -Prompt $prompt
    }
    if ([string]::IsNullOrWhiteSpace($val)) {
        $val = $Default
        Write-Host "  (vacio -> usando por defecto: $Default)"
    }
    $val | gh secret set $Name --repo $Repo
    Write-Host "  [OK] secret $Name" -ForegroundColor Green
}

Write-Host "== Configurando secretos en $Repo ==" -ForegroundColor Cyan
Set-GhSecret -Name "DOCKERHUB_USERNAME"
Set-GhSecret -Name "DOCKERHUB_TOKEN" -Secure
Set-GhSecret -Name "VITE_SUPABASE_URL"
Set-GhSecret -Name "VITE_SUPABASE_ANON_KEY" -Secure
Set-GhSecret -Name "VITE_SUPABASE_BUCKET" -Default "images"

Write-Host "== Variables (opcionales) ==" -ForegroundColor Cyan
$deployPath = Read-Host -Prompt "DEPLOY_PATH [Enter = /volume1/docker/reli-app]"
if ([string]::IsNullOrWhiteSpace($deployPath)) { $deployPath = "/volume1/docker/reli-app" }
$deployPath | gh variable set DEPLOY_PATH --repo $Repo
Write-Host "  [OK] variable DEPLOY_PATH" -ForegroundColor Green

Write-Host ""
Write-Host "== Listo. Estado actual ==" -ForegroundColor Cyan
gh secret list --repo $Repo
gh variable list --repo $Repo

Write-Host ""
Write-Host "Siguiente paso: levantar el runner en el NAS (ver nas-deploy/README.md)." -ForegroundColor Yellow
