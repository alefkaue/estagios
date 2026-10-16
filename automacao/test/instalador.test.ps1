$ErrorActionPreference='Stop'
$origemTeste=Split-Path -Parent $PSScriptRoot
$pastaTeste=Join-Path ([IO.Path]::GetTempPath()) ('estagios-instalador-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $pastaTeste | Out-Null
Copy-Item -LiteralPath (Join-Path $origemTeste 'Instalar.ps1') -Destination $pastaTeste
Copy-Item -LiteralPath (Join-Path $origemTeste 'src') -Destination $pastaTeste -Recurse
$manifestoAntes=Get-Content -Raw -LiteralPath (Join-Path $pastaTeste 'src/appsscript.json')
# Simulacoes locais: nao faz login, nao baixa pacotes e nao acessa contas.
function global:npm.cmd { $global:LASTEXITCODE=0 }
function global:npx.cmd {
  if ($args -contains 'create') { [IO.File]::WriteAllText((Join-Path (Get-Location) '.clasp.json'),'{"scriptId":"projeto-ficticio","rootDir":".deploy/src"}') }
  $global:LASTEXITCODE=0
}
& (Join-Path $pastaTeste 'Instalar.ps1') -Planilha 'planilha_ficticia_para_testes_0001' -ComAvisos -EmailDestino 'teste@example.org'
$manifestoDepois=Get-Content -Raw -LiteralPath (Join-Path $pastaTeste 'src/appsscript.json')
if ($manifestoAntes -ne $manifestoDepois) { throw 'Fonte publica foi modificada.' }
$enviado=Get-Content -Raw -LiteralPath (Join-Path $pastaTeste '.deploy/src/appsscript.json') | ConvertFrom-Json
if ($enviado.oauthScopes -notcontains 'https://www.googleapis.com/auth/script.send_mail') { throw 'Permissao de avisos ausente.' }
$config=Get-Content -Raw -LiteralPath (Join-Path $pastaTeste '.deploy/src/ConfigLocal.js')
if ($config -notmatch 'planilha_ficticia_para_testes_0001') { throw 'Configuracao privada ausente.' }
& (Join-Path $pastaTeste 'Instalar.ps1') -Planilha 'planilha_ficticia_para_testes_0001' -ComAvisos:$false
$minimo=Get-Content -Raw -LiteralPath (Join-Path $pastaTeste '.deploy/src/appsscript.json') | ConvertFrom-Json
if ($minimo.oauthScopes -contains 'https://www.googleapis.com/auth/script.send_mail') { throw 'Permissoes opcionais nao foram removidas.' }
Write-Output 'OK: instalador isolado, fontes preservadas e permissoes opcionais corretas. Nenhum acesso externo.'
Remove-Item -LiteralPath (Join-Path $pastaTeste '.clasp.json')
function global:npx.cmd { $global:LASTEXITCODE=0 }
$falhaEsperada=$false
try {
  & (Join-Path $pastaTeste 'Instalar.ps1') -Planilha 'planilha_ficticia_para_testes_0001' -ComAvisos:$false
} catch {
  if ($_.Exception.Message -like '*nao criou .clasp.json*') { $falhaEsperada=$true } else { throw }
}
if (-not $falhaEsperada) { throw 'Criacao sem arquivo deveria interromper a instalacao.' }
Write-Output 'OK: criacao sem .clasp.json interrompida com orientacao clara.'
Set-Location -LiteralPath $origemTeste
# Arquivos ficticios permanecem na pasta temporaria para diagnostico; sem exclusao recursiva.
