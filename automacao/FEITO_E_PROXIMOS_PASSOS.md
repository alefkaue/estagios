# Entrega da automação — 16/10/2026

## Atualização: marcador de vagas e caminho para WhatsApp

Novas instalações agora usam o marcadorGmail **Vagas** por padrão, configurável no instalador. O monitor rejeita marcador inexistente, preserva a sobreposição e reinicia o marco ao trocar de marcador. Nenhum rótulo/filtro foi criado na conta do usuário: essa organização deve ser configurada antes da primeira leitura.

20testesNode e testeisolado do instalador aprovados. OREADME explica como começar a integraçãoMeta, a diferença entreGmailcomo origem eWhatsAppcomo destino, e a exigência de template compatível. Recebimento peloWhatsApp ainda não foi validado numa conta real; aguarda configuração/autorização do usuário. Os relatos e dados pessoais continuam fora doGitHub.

## Implementado

- Scripts do Google Apps Script para leitura restrita do Gmail, vínculo por requisição e próximas ações na mesma planilha.
- Modo de conferência sem escrita/avisos; aplicação manual e gatilho diário opcional.
- Preservação de inscrições, IDs e notas; nenhum envio de candidatura ou resposta a recrutadores.
- Marco de sucesso com 48 horas de sobreposição, paginação, limite por lote e retomada; IDs persistidos para evitar repetição.
- Avisos opcionais por e-mail ao destinatário configurado e adaptador oficial de WhatsApp Cloud API com template.
- Fila privada por mensagem/canal; envio incerto exige revisão, sem afirmar garantia de entrega única.
- Instalador Windows por terminal e arquivo Instalar.cmd, configuração independente por pessoa, sem credenciais públicas.
- Manifest mínimo e permissões adicionais de avisos somente quando selecionadas na instalação.
- Documentação para instalação, configuração da Meta, interrupção, privacidade e limites reais.

## Arquivos

- `Instalar.cmd` / `Instalar.ps1`: instalação local, autenticação oficial do Google e envio do código para projeto privado.
- `src/Assistente.js`: orquestração de leitura/aplicação e gatilhos.
- `src/Logica.js`: associação/classificação sem serviços externos de IA.
- `src/Notificacoes.js`: fila e transportes opcionais de e-mail/WhatsApp.
- `src/appsscript.json`: permissões padrão; exemplo de avisos fora da pasta src.
- `test/`: testes com dados fictícios, sem credenciais e sem envios reais.
- `package.json` / `package-lock.json`: instalação reproduzível do CLI.
- `README.md`: instruções e referência para cada amigo instalar na própria conta.

## Validado

16 testes locais aprovados com Node 24, sintaxe JavaScript/PowerShell conferida e comandos do clasp verificados na versão 3.4.1. O instalador também passou por um teste isolado, sem autenticação ou rede. Scripts não possuem IDs de planilha, tokens, destinatários reais ou conteúdo de e-mails. A publicação mantém a planilha/lista pública anterior intacta.

Auditoria de dependências: 3 alertas altos transitivos na ferramenta CLI, documentados no README. O código em nuvem não carrega essas dependências NPM. Não afirmar auditoria limpa nem aplicar correção forçada que troque o clasp por uma versão antiga vulnerável.

## O que ainda precisa do usuário

1. Ter Node.js LTS e sua própria planilha Google no formato indicado.
2. Executar Instalar.cmd, autorizar o Google e eventualmente habilitar a API Apps Script.
3. Executar prepararEConferir, revisar a prévia e decidir ativar a rotina.
4. Para e-mail, informar o destino e ativar os avisos; para WhatsApp, providenciar conta Meta, número, token, template/idioma e configurações privadas.

Não foram acessadas contas, enviadas mensagens ou criados gatilhos reais nesta execução. Nenhuma conta foi autorizada enquanto o usuário estava ausente. As conexões deste chat não viram automaticamente credenciais do projeto instalado.

## Fora desta primeira versão

Busca automática de vagas, monitor de login em portais/CAPTCHA, Agenda, despertador, leitura de conversas recebidas no WhatsApp e publicação de dados pessoais no GitHub. Bolsa/presença/formatura e elegibilidade seguem exigindo checagem de anúncio. Adições futuras devem manter bancos/empresas grandes e remoto/híbrido como prioridades, sem excluir presencial.

## Para continuar depois

Leia este MD e o README, rode os testes e verifique o projeto privado autorizado. Não commitar ConfigLocal.js, .clasp.json, .clasprc.json, .env, logs ou snapshots. Melhorar a detecção de requisição por portal antes de assumir vínculos por nome da empresa; incluir novas integrações em passos separados e testáveis. Avisos recebidos só pelo WhatsApp ainda precisam de registro manual.
