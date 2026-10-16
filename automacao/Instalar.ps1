param([Parameter(Mandatory=$true)][string]$Planilha,[string]$EmailDestino,[switch]$ComAvisos,[string]$MarcadorGmail='Vagas')
$ErrorActionPreference='Stop'
Set-Location -LiteralPath $PSScriptRoot
if ($Planilha -match '/spreadsheets/d/([a-zA-Z0-9_-]+)') { $Planilha=$Matches[1] }
if ($Planilha -notmatch '^[a-zA-Z0-9_-]{20,}$') { throw 'Informe a URL ou ID valido da planilha.' }
if (-not $PSBoundParameters.ContainsKey('ComAvisos')) {
  $respostaAvisos=Read-Host 'Preparar permissoes para avisos opcionais por e-mail/WhatsApp? (s/N)'
  $ComAvisos=$respostaAvisos -match '^(s|sim)$'
}
if ($ComAvisos -and -not $EmailDestino) { $EmailDestino=Read-Host 'Seu e-mail para receber avisos (Enter para deixar desativado)' }
if ($EmailDestino -and $EmailDestino -notmatch '^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$') { throw 'Informe somente um endereco de e-mail valido.' }
function Clasp { & npx --no-install clasp @args; if ($LASTEXITCODE -ne 0) { throw 'O clasp falhou. Confira a autorizacao do Google e a API Apps Script.' } }
& npm ci --ignore-scripts --fetch-retries=1 --fetch-timeout=30000
if ($LASTEXITCODE -ne 0) { throw 'Falha ao instalar dependencias.' }
& npm test
if ($LASTEXITCODE -ne 0) { throw 'Testes falharam.' }
# Autorizacao exclusivamente no navegador oficial. Sem senha no terminal.
Clasp login
$pastaDeploy=Join-Path $PSScriptRoot '.deploy/src'
New-Item -ItemType Directory -Force -Path $pastaDeploy | Out-Null
if (-not (Test-Path -LiteralPath '.clasp.json')) {
  # Cria/puxa arquivos somente na pasta privada; fontes publicas ficam intactas.
  Clasp create --type standalone --title 'Assistente privado de estagios' --rootDir '.deploy/src'
}
$projeto=Get-Content -Raw -LiteralPath '.clasp.json' | ConvertFrom-Json
if (-not $projeto.scriptId) { throw 'Projeto sem scriptId; interrompendo.' }
$projeto | Add-Member -NotePropertyName rootDir -NotePropertyValue '.deploy/src' -Force
[IO.File]::WriteAllText((Join-Path $PSScriptRoot '.clasp.json'),($projeto|ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
foreach ($fonte in @('Assistente.js','Logica.js','Notificacoes.js')) {
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot ('src/'+$fonte)) -Destination (Join-Path $pastaDeploy $fonte)
}
$manifesto=Get-Content -Raw -LiteralPath (Join-Path $PSScriptRoot 'src/appsscript.json') | ConvertFrom-Json
if ($ComAvisos) { $manifesto.oauthScopes+=@('https://www.googleapis.com/auth/script.send_mail','https://www.googleapis.com/auth/script.external_request') }
[IO.File]::WriteAllText((Join-Path $pastaDeploy 'appsscript.json'),($manifesto|ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
$config='const CONFIG_LOCAL = '+(@{planilhaId=$Planilha;emailDestino=$EmailDestino;avisosPermitidos=[bool]$ComAvisos;marcadorGmail=$MarcadorGmail}|ConvertTo-Json -Compress)+';'
[IO.File]::WriteAllText((Join-Path $pastaDeploy 'ConfigLocal.js'),$config,[Text.UTF8Encoding]::new($false))
Clasp push
Write-Host 'Codigo enviado. No editor, execute prepararEConferir e autorize o acesso.'
Write-Host 'Confira o registro de execucao. Depois use atualizarAgora ou ativarAutomatico.'
if ($ComAvisos) { Write-Host 'Avisos ainda desativados. Use ativarAvisosEmail ou configure a Meta antes de ativarAvisosWhatsApp.' }
Clasp open-script
