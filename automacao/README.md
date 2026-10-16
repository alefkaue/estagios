# Assistente privado de candidaturas

Script instalável para cada pessoa acompanhar **os próprios e-mails e a própria planilha**. Executa no Google Apps Script depois de instalado/autorizado; não precisa deixar o PC ligado. Código implementado e testado localmente; nenhuma conta foi conectada nem rotina ativada nesta entrega.

## Instalar no Windows

1. Instale o [Node.js LTS](https://nodejs.org/) se ainda não tiver. Testado com Node 24 e PowerShell 5.1.
2. Baixe este repositório ou faça `git clone https://github.com/alefkaue/estagios.git`.
3. Use uma cópia **privada** de `Estagios.xlsx`, convertida para Google Planilhas. Mantenha a aba `Estágios`, coluna A `Inscrito?`, coluna K `ID` e os IDs preenchidos. Cada amigo usa sua própria cópia/conta; não compartilhar uma pasta já configurada com outra pessoa.
4. Na pasta `automacao`, execute **Instalar.cmd**. Ele solicita a URL da sua planilha e pergunta se deseja preparar os avisos. Não pede senha no terminal.
5. Faça login na página oficial do Google quando ela abrir. Pode ser necessário habilitar a [API Apps Script](https://script.google.com/home/usersettings). Essa autorização pertence à sua conta e não pode ser substituída pelo acesso do assistente na conversa.
6. No editor aberto ao final, execute **prepararEConferir** e autorize as permissões. Confira o registro de execução: é uma prévia, sem alterar sua planilha, enviar avisos ou criar gatilhos.
7. Depois de conferir, execute **atualizarAgora** para aplicar uma vez ou **ativarAutomatico** para aplicar e executar diariamente, aproximadamente na faixa das 9h de São Paulo.

O Windows pode bloquear scripts baixados conforme a política local. Não altere a política global: confira a origem e desbloqueie somente os arquivos que você revisou, quando permitido pelo administrador. O instalador não contorna políticas.

Alternativa pelo PowerShell, já dentro da pasta:

```powershell
.\Instalar.ps1 -Planilha 'SUA_URL' -ComAvisos -EmailDestino 'SEU_EMAIL'
```

Para preparar somente o monitor, sem permissões de envio:

```powershell
.\Instalar.ps1 -Planilha 'SUA_URL' -ComAvisos:$false
```

O instalador usa `npm ci`, executa os testes, autentica o `clasp`, cria um projeto privado independente e envia o código. Ele abre o editor para a autorização/primeira execução; não promete instalação silenciosa sem consentimento do Google. Se utilizar projeto Cloud próprio em vez do padrão, pode ser necessário habilitar também a Gmail API.

## Avisos por e-mail

Instale com `-ComAvisos` e informe **seu próprio e-mail** como destinatário. Depois de `prepararEConferir`, execute **ativarAvisosEmail**. As próximas execuções aplicadas poderão enviar notificações a esse endereço. A função de ativação não envia uma mensagem de teste.

O Gmail é somente leitura. O envio de notificações é feito separadamente por MailApp; não responde a recrutadores nem encaminha a mensagem completa. Não há lista de distribuição ou envio automático aos amigos: cada instalação tem seu próprio destinatário.

## Avisos por WhatsApp — opcional

É necessário ter a **WhatsApp Business Platform / Cloud API oficial da Meta**, número remetente configurado, token válido, destinatário autorizado e template aprovado com **um parâmetro de texto no corpo**. Pode haver custos e limitações da Meta. Este código não transforma uma conta pessoal comum em API e não automatiza WhatsApp Web.

Depois de instalar com `-ComAvisos`, configure **somente nas Propriedades do script privado**:

| Propriedade | Conteúdo |
|---|---|
| WA_TOKEN | Token privado da Meta |
| WA_PHONE_ID | Identificador do número remetente |
| WA_DESTINO | Seu número com país/DDD, somente dígitos |
| WA_TEMPLATE | Nome do template aprovado com um parâmetro no corpo |
| WA_IDIOMA | Idioma aprovado, por exemplo `pt_BR` |
| WA_VERSAO | Versão suportada da Graph API, no formato `vNN.N` |

Não colocar token em código público, planilha ou README. Execute **ativarAvisosWhatsApp** depois de configurar. Não é possível habilitar o recebimento sem a conta/configuração da Meta. Ver [referência oficial de templates](https://www.postman.com/meta/whatsapp-business-platform/request/o65u5m5/send-message-template-text).

## O que acontece na execução

- Pesquisa inicial nos últimos14 dias; depois, sobreposição de48 h desde o último sucesso.
- Processa até25 mensagens novas por execução, com até10 páginas de busca e limite de tempo. Ignora IDs já processados ao paginar. Se houver mais, não avança o marco: rode novamente para continuar. Falhas também preservam o marco anterior.
- Relaciona a vaga somente por código completo extraído de URL Gupy/Greenhouse/BTG. Empresa sozinha, número parcial ou vários códigos deixam o vínculo para revisão. Outros portais exigem extensão do identificador.
- Usa regras simples para apontar confirmação, teste, entrevista ou documentos. Não presume contratação, recusa, data ou horário; mensagens ambíguas pedem conferência da fonte.
- Preserva A:L, checkbox, IDs, linhas, notas e candidaturas. Adiciona M:N: **Próxima ação** e **Atualização do e-mail**. Se essas colunas tiverem outro conteúdo, para sem sobrescrever. As colunas novas ficam ao lado da tabela nativa existente.
- Reconsulta os IDs antes de escrever, caso as linhas tenham sido ordenadas durante a busca. Mensagem antiga não substitui novidade posterior.
- `_Automacao` é um log oculto privado com IDs/ações, sem corpo completo ou anexos. Mensagens sem vínculo também ficam ali para revisão; para reprocessar uma delas após corrigir o vínculo, remova somente sua linha de controle, após conferência, e rode uma busca que ainda inclua sua data.
- `_Notificacoes` é uma fila oculta privada, criada somente quando avisos estiverem habilitados. Até20 envios por execução. A chave mensagem+canal evita reenfileirar a mesma novidade.
- **Aceito pelo serviço** significa aceitação pela API, não confirmação de entrega/leitura. Falha após tentativa vira **Revisar envio**, sem reenvio automático para evitar duplicatas. Confira o serviço e só volte a `Pendente` se desejar tentar outra vez; há possibilidade de duplicata em resultado incerto. Enviando após interrupção também exige revisão manual.
- Avisos do próprio assistente são excluídos da pesquisa. Não marca e-mails como lidos.
- Não gera nova aba visível para preencher. Os logs podem ser reexibidos para diagnóstico. O link da mensagem fica na nota da ação; em contas múltiplas, abra-o no Gmail da conta correta.

## Desativar

- **desativarAutomatico:** remove os gatilhos deste monitor.
- **desativarAvisos:** desliga e-mail e WhatsApp sem apagar a fila.
- Também é possível revogar o acesso do projeto nas configurações de segurança da sua conta Google.

## Permissões e dados

O manifest padrão solicita Gmail somente leitura, planilhas e gatilhos. Com `-ComAvisos`, inclui envio via MailApp e requisições HTTPS para a Meta. Sem permissões de Agenda. O código usa somente a planilha configurada, mas o escopo Sheets autoriza tecnicamente acesso às planilhas da conta; revise antes de autorizar.

Arquivos `.clasprc.json`, `.clasp.json`, `.deploy/`, ConfigLocal.js, node_modules, logs, tokens e configurações pessoais ficam fora do Git. `.clasprc.json` pode ser salvo pelo clasp na pasta do usuário; nunca compartilhe essa pasta de credenciais.

O código Google Apps Script não depende de pacote NPM em execução. O CLI de instalação está fixado em clasp 3.4.1. A auditoria NPM desta entrega apontou 3 alertas altos na cadeia micromatch/braces do CLI; não existe versão posterior de braces publicada no registro consultado. Não foi feito downgrade para versão antiga vulnerável do clasp nem foi ocultado o alerta. Atualize a dependência quando houver correção e não processe projetos/padrões de origem desconhecida. `npm audit fix --force` não deve ser aplicado sem rever a compatibilidade/segurança.

## Testes e limites

```powershell
npm ci --ignore-scripts
npm test
```

16 testes locais aprovados: classificação, vínculo, prévia, preservação, deduplicação, falha de Gmail, paginação, avisos desligados, validação de WhatsApp, aceitação e timeout. APIs externas foram simuladas: não há teste real de recebimento nem ativação nas contas.

Pesquisa automática de novas vagas, sincronização com GitHub, eventos na Agenda, leitura do WhatsApp recebido e despertadores do Relógio **não estão implementados**. Os avisos atuais acompanham retornos por Gmail; o fato de um recrutador falar só por WhatsApp não alimenta este monitor. A lista pública de vagas não é atualização automática dos processos pessoais.

Detalhes da entrega: [FEITO_E_PROXIMOS_PASSOS.md](FEITO_E_PROXIMOS_PASSOS.md).
