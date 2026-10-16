Correção do instalador no Windows PowerShell

O instalador usa agora npm.cmd e npx.cmd explicitamente. O wrapper npx.ps1 instalado pode reinterpretar os argumentos encaminhados por @args, impedindo a execução correta do comando clasp.

Também foi adicionada uma verificação depois da criação do projeto: se .clasp.json não existir, a instalação para com uma orientação clara, antes de tentar ler o arquivo.

Validação: teste isolado do instalador, incluindo criação sem arquivo e permissões opcionais. Não houve login, envio de mensagens nem criação de projetos reais durante os testes.

Para tentar novamente, execute .\Instalar.cmd na pasta automacao. A autorização ocorre no navegador do Google. Se a criação indicar API desativada, habilite Google Apps Script API em https://script.google.com/home/usersettings e repita.
