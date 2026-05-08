#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Bootstraps the HealthCare-App monorepo: verifies tools, installs deps,
  prepares the database, runs migrations + seed, and starts dev servers.

.DESCRIPTION
  Idempotent. Safe to re-run. Use -SkipDev to set up without starting servers.
#>

[CmdletBinding()]
param(
  [switch]$SkipDev,
  [string]$DbUser = 'postgres',
  [string]$DbPassword = 'admin',
  [string]$DbName = 'healthcare_db',
  [int]$DbPort = 5432
)

$ErrorActionPreference = 'Stop'

function Write-Step  ([string]$m) { Write-Host "▶ $m" -ForegroundColor Cyan }
function Write-Ok    ([string]$m) { Write-Host "✓ $m" -ForegroundColor Green }
function Write-Warn2 ([string]$m) { Write-Host "! $m" -ForegroundColor Yellow }
function Write-Err2  ([string]$m) { Write-Host "✗ $m" -ForegroundColor Red }

function Require-Cmd([string]$Name, [string]$VersionFlag = '--version') {
  $cmd = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $cmd) { Write-Err2 "$Name not found on PATH"; exit 1 }
  $v = & $Name $VersionFlag 2>$null | Select-Object -First 1
  Write-Ok "$Name → $v"
}

Write-Host ""
Write-Host "═════════ HealthCare-App setup ═════════" -ForegroundColor Magenta
Write-Host ""

Write-Step "Verifying prerequisites"
Require-Cmd node
Require-Cmd pnpm
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
if (-not (Test-Path $psql)) {
  Write-Warn2 "psql not at $psql — falling back to PATH"
  Require-Cmd psql
  $psql = 'psql'
}

Write-Step "Checking PostgreSQL on localhost:$DbPort"
$tcp = Test-NetConnection -ComputerName localhost -Port $DbPort -WarningAction SilentlyContinue
if (-not $tcp.TcpTestSucceeded) { Write-Err2 "PostgreSQL not listening on $DbPort"; exit 1 }
Write-Ok "PostgreSQL reachable"

Write-Step "Ensuring database '$DbName' exists"
$env:PGPASSWORD = $DbPassword
$exists = & $psql -U $DbUser -h localhost -p $DbPort -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DbName'"
if ($exists -ne '1') {
  & $psql -U $DbUser -h localhost -p $DbPort -d postgres -c "CREATE DATABASE $DbName;" | Out-Null
  Write-Ok "Database '$DbName' created"
} else {
  Write-Ok "Database '$DbName' already exists"
}

Write-Step "Installing dependencies (pnpm install)"
pnpm install
Write-Ok "Dependencies installed"

Write-Step "Generating Prisma client"
pnpm --filter '@hc/server' exec prisma generate | Out-Null
Write-Ok "Prisma client generated"

Write-Step "Applying migrations"
pnpm --filter '@hc/server' exec prisma migrate deploy | Out-Null
Write-Ok "Migrations applied"

Write-Step "Seeding database"
pnpm db:seed | Out-Null
Write-Ok "Seed complete"

Write-Host ""
Write-Host "═════════ Ready ═════════" -ForegroundColor Magenta
Write-Host ""
Write-Host "Test accounts:" -ForegroundColor Cyan
Write-Host "  Admin     : admin@clinique.ma / Admin123!"
Write-Host "  Secrétaire: fatima@clinique.ma / Secret123!"
Write-Host "  Docteur   : dr.alaoui@clinique.ma / Doctor123!"
Write-Host "  Patient   : patient1@clinique.ma / Patient123!"
Write-Host ""

if (-not $SkipDev) {
  Write-Step "Starting dev servers (Ctrl+C to stop)"
  Write-Host ""
  pnpm dev
}
