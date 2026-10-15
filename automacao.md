# Ideia: assistente de vagas e rotina

Proposta para implementação futura. Nenhuma automação está ativada.

## Objetivo

Acompanhar candidaturas, identificar pendências e entrevistas,
organizar a agenda e enviar atualizações sem precisar conferir
cada plataforma manualmente.

## Fluxo proposto

1. Executar uma verificação diária em horário configurável.
2. Consultar e-mails relacionados às candidaturas.
3. Consultar os portais de recrutamento quando houver acesso.
4. Comparar as informações com a última verificação.
5. Atualizar a planilha preservando todas as vagas, inscrições e notas.
6. Avisar sobre novidades, testes, documentos e entrevistas.
7. Criar eventos e lembretes conforme as regras definidas pelo usuário.

## Integrações

- Gmail: identificar mensagens de recrutadores e mudanças de etapa.
- Google Planilhas: manter o acompanhamento das candidaturas.
- Google Agenda: registrar entrevistas, testes e prazos.
- WhatsApp: enviar resumos por uma integração oficial.
- Celular: avaliar integração específica para alarmes do Relógio.

## Primeira versão

Começar com Gmail, planilha, agenda e notificações no celular.
Acrescentar WhatsApp e alarmes depois de validar o acompanhamento.

A pesquisa de novas vagas deve priorizar bolsa mínima de R$ 2 mil,
trabalho remoto ou híbrido e deslocamento viável entre casa,
trabalho e faculdade. Presenciais continuam como alternativas.

## Regras de acompanhamento

- Nunca remover ou substituir uma vaga ao acrescentar outra.
- Preservar marcações de inscrição e anotações.
- Registrar a fonte e a data de cada mudança.
- Não interpretar ausência de resposta como recusa.
- Se o acesso falhar, informar "não foi possível verificar".
- Evitar notificações repetidas sobre a mesma atualização.
- Não enviar candidaturas nem responder a recrutadores sem autorização.
- Evitar eventos duplicados ao reler o mesmo convite.

## Execução e limitações

A conversa sozinha não mantém uma verificação contínua.
Será necessário configurar uma tarefa recorrente e suas integrações.

Se a execução depender do computador, ele precisará estar ligado
e com o serviço responsável em funcionamento. Para funcionar com
o computador desligado, será necessário um ambiente hospedado
ou uma tarefa compatível com execução em nuvem.

Portais podem exigir novo login, autenticação adicional ou CAPTCHA.
Uma página pública informa sobre a vaga, mas não necessariamente
sobre o andamento da candidatura individual.

WhatsApp exige integração própria, configuração e eventual custo.
Lembretes da agenda não equivalem ao despertador do aplicativo Relógio.

## Proteção dos dados

O repositório público deve conter apenas documentação e código.
Senhas, tokens, conteúdo de e-mails, dados pessoais e histórico
privado das candidaturas devem ficar fora do GitHub.

## Decisões antes da implementação

- Android ou iPhone.
- Contas de e-mail e portais utilizados.
- Horário e frequência das verificações.
- Necessidade de funcionar com o computador desligado.
- Canal de notificação e orçamento disponível.
- Quais eventos podem ser criados automaticamente.
