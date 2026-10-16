# Entrega — Integração com Telegram e evolução do motor

Data: 16/10/2026. Esta entrega preserva tudo o que já funcionava (monitor de Gmail, planilha, avisos por e-mail/WhatsApp, instalador, testes) e acrescenta o Telegram como canal principal de avisos e consultas, além de melhorar o reconhecimento de e-mails e criar o histórico cronológico.

## 1. Arquitetura implementada

```
Gmail (somente leitura, marcador Vagas)
        │
        ▼
Apps Script  ──► Motor de análise (Logica.js)  ──► Planilha (aba Estágios: A:L + M:N + _Historico)
        │                                                   │
        │                                                   ▼
        └──► Fila de avisos (_Notificacoes) ──► E-mail / WhatsApp / Telegram (opcionais, 1 destinatário)
                                                            ▲
Telegram Bot (webhook doPost) ──► comandos e registro manual ─┘  (responde só ao chat autorizado)
```

Roda no Google Apps Script: funciona com o computador desligado. Nenhum serviço pago é necessário.

## 2. Problemas encontrados e corrigidos

- Vínculo de e-mails limitado a códigos numéricos de Gupy/Greenhouse. Agora reconhece também **LinkedIn** (`/jobs/view/<id>`), **InHire** (UUID da vaga) e padrões `vacancy/id` de Pandapé/InfoJobs, mantendo a regra de só vincular com **um** código de alta confiança.
- Classificação não distinguia **convite** de **entrevista agendada**; agora distingue, e acrescenta *banco de talentos* e *possível aprovação* — sempre sem presumir contratação/recusa.
- Faltava histórico cronológico por candidatura (exigência da seção 9). Criada a aba oculta **`_Historico`** (acrescida, nunca sobrescrita).
- Correção de espaços ausentes em `automacao.md`.

## 3. Funcionalidades novas

- **Telegram como canal de aviso** reaproveitando a fila idempotente existente (dedup por `mensagem+canal`, sem reenvio automático em resultado incerto).
- **Bot do Telegram** (`doPost`): comandos `/inicio /ajuda /vagas /entrevistas /testes /prazos /status /resumo /empresa <nome> /beneficios <nome>`, texto livre como busca por empresa.
- **Registro manual com confirmação** por botões: localiza a vaga, mostra o registro atual e só grava a coluna *Próxima ação* (e registra no histórico) após **Confirmar**. Preserva A:L e o histórico.
- **Segurança do bot:** responde apenas ao `TELEGRAM_CHAT_ID` autorizado; webhook exige segredo na URL; token/chat só nas Propriedades privadas; conteúdo de erro das APIs nunca é registrado.

## 4. Arquivos modificados/criados

- Novos: `automacao/src/Bot.js` (lógica pura), `automacao/src/Telegram.js` (API/webhook/registro manual/histórico), `automacao/test/bot.test.cjs`, `automacao/test/telegram.test.cjs`, este relatório.
- Alterados: `src/Logica.js` (plataformas e sinais), `src/Notificacoes.js` (canal Telegram na fila), `src/Assistente.js` (reset do novo canal + histórico), `Instalar.ps1` (copia os novos fontes e orienta Telegram), `test/fluxo.test.cjs` e `test/logica.test.cjs` (novos casos), `README.md`, `automacao.md`, `.gitignore`.

## 5. Testes executados

`npm test` → **40 testes aprovados, 0 falhas** (eram 20). APIs externas simuladas. Cobrem, além do que já havia: LinkedIn/InHire, convite × agendada, banco de talentos, aprovação, histórico acrescido, autorização por chat/segredo no webhook, roteamento de comandos, resumo e o fluxo de confirmação do registro manual (confirmar/cancelar/não autorizado) e a não duplicação de avisos no Telegram.

## 6. Integrações: estado

| Integração | Estado |
|---|---|
| Gmail (leitura) | Implementada; **aguarda sua autorização** |
| Planilha (Estágios + _Historico) | Implementada; **aguarda sua planilha privada** |
| Avisos por e-mail | Implementado; aguarda `ativarAvisosEmail` |
| Avisos por WhatsApp Cloud API | Implementado; aguarda conta/credenciais Meta |
| **Avisos e consultas por Telegram** | **Implementado e testado; aguarda token/chat, App da Web e `configurarWebhook`** |
| Google Calendar | **Não implementado** (próxima etapa) |
| Camada de IA opcional | **Não implementado** (próxima etapa) |

Nada acima está “funcionando nas suas contas” só porque os testes passaram: os testes usam simulações.

## 7. Limitações conhecidas

- Consultas do bot exigem publicar como **App da Web** (passo seu, no editor). Sem isso, os avisos funcionam, mas os comandos não.
- Prazos aparecem no `/prazos` apenas se houver uma coluna `Prazo` com data; hoje muitos prazos ficam em notas.
- Vínculo continua conservador: várias mensagens cairão em “Revisar vínculo”, por segurança.
- Telegram Bot API não lê o seu WhatsApp pessoal; registre por lá manualmente.

## 8. Próximas etapas sugeridas

1. **Google Calendar** opcional: sugerir (não criar automaticamente) eventos de entrevista/teste/prazo, sem duplicar, com lembretes avisados pelo Telegram — requer adicionar o escopo Calendar e sua decisão sobre criação automática.
2. **Resumo diário** opcional por Telegram (itens que precisam de atenção) via gatilho.
3. **Coluna `Prazo`** estruturada na planilha para alimentar `/prazos` e o Calendar.
4. **Camada de IA opcional** (nível 2), só para mensagens difíceis, com saída estruturada e validada antes de gravar, sem enviar dados sensíveis.

## 9. Passo a passo para ativar o Telegram

Ver a seção “Avisos e consultas pelo Telegram” no [README](README.md). Resumo: criar bot no BotFather → preencher `TELEGRAM_TOKEN` e `TELEGRAM_CHAT_ID` nas Propriedades → `/start` ao bot → `ativarAvisosTelegram` → publicar App da Web → `configurarWebhook`.
