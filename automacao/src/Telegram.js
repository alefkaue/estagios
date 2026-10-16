/** Integração com o Telegram: envio de avisos, webhook de comandos e registro manual.
 * Responde apenas ao chat autorizado. Token e chat ficam nas Propriedades privadas do script.
 */
var TELEGRAM_API = 'https://api.telegram.org/bot';

function configTelegram_(props) {
  return {
    token: props.getProperty('TELEGRAM_TOKEN') || '',
    chatId: props.getProperty('TELEGRAM_CHAT_ID') || '',
    segredo: props.getProperty('TELEGRAM_WEBHOOK_SECRET') || ''
  };
}
function validarTelegram_(props) {
  const c = configTelegram_(props);
  if (!/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(c.token)) throw new Error('Configure TELEGRAM_TOKEN válido nas Propriedades do script.');
  if (!/^-?\d{1,20}$/.test(c.chatId)) throw new Error('Configure TELEGRAM_CHAT_ID (somente dígitos) nas Propriedades do script.');
  return c;
}
function chamarTelegram_(token, metodo, payload) {
  const resp = UrlFetchApp.fetch(TELEGRAM_API + token + '/' + metodo, {
    method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), muteHttpExceptions: true
  });
  const code = resp.getResponseCode();
  // Não registrar o corpo: pode conter dados privados.
  if (code < 200 || code >= 300) throw new Error('Telegram retornou HTTP ' + code + ' em ' + metodo + '.');
  const dados = JSON.parse(resp.getContentText());
  if (!dados.ok) throw new Error('Telegram não confirmou ' + metodo + '.');
  return dados.result;
}
function enviarTelegram_(props, chatId, texto, teclado) {
  const c = validarTelegram_(props);
  const alvo = chatId || c.chatId;
  const payload = { chat_id: alvo, text: String(texto || '').slice(0, 4000), disable_web_page_preview: true };
  if (teclado) payload.reply_markup = { inline_keyboard: teclado };
  return chamarTelegram_(c.token, 'sendMessage', payload);
}
function corpoTelegram_(empresa, acao, planilhaId) {
  const link = planilhaId ? '\n🔗 Planilha: https://docs.google.com/spreadsheets/d/' + planilhaId + '/edit' : '';
  return '📩 Atualização de candidatura\n🏢 ' + empresa + '\n📊 ' + acao + '\n📨 Origem: Gmail' + link +
    '\n\nConfira a mensagem original antes de confirmar qualquer etapa.';
}
/** Mensagem detalhada para o Telegram: busca os dados da vaga na planilha pelo ID. */
function corpoTelegramRico_(ss, empresa, acao, idVaga, planilhaId) {
  let v = null;
  try { const aba = ss.getSheetByName(ABA_VAGAS); if (aba) v = lerVagasParaBot_(aba).find(x => x.id === idVaga); } catch (e) {}
  const linhas = ['📩 Atualização de candidatura', '🏢 ' + ((v && v.empresa) ? v.empresa : empresa), '📊 ' + acao];
  if (v) {
    if (v.localModelo) linhas.push('📍 ' + v.localModelo);
    if (v.bolsa) linhas.push('💰 Bolsa anunciada: ' + v.bolsa);
    if (v.beneficios) linhas.push('🎁 ' + v.beneficios);
    if (v.situacao) linhas.push('🗂️ Situação: ' + v.situacao);
    if (v.link) linhas.push('🔗 ' + v.link);
  }
  linhas.push('📨 Origem: Gmail — confira a mensagem original antes de confirmar.');
  if (planilhaId) linhas.push('📋 Planilha: https://docs.google.com/spreadsheets/d/' + planilhaId + '/edit');
  return linhas.join('\n');
}

/** Ativação explícita, depois de configurar token/chat e de enviar /start ao bot. */
function ativarAvisosTelegram() {
  const p = PropertiesService.getScriptProperties();
  const c = validarTelegram_(p);
  enviarTelegram_(p, c.chatId, '✅ Avisos pelo Telegram ativados. Você receberá aqui as atualizações das candidaturas.');
  p.setProperty('AVISAR_TELEGRAM', 'true');
}
function desativarAvisosTelegram() { PropertiesService.getScriptProperties().setProperty('AVISAR_TELEGRAM', 'false'); }

/** Descobre o seu chat id a partir do /start enviado ao bot. Nunca expõe o token. */
function detectarChatId() {
  const p = PropertiesService.getScriptProperties();
  const token = p.getProperty('TELEGRAM_TOKEN');
  if (!/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(token || '')) throw new Error('Cole TELEGRAM_TOKEN nas Propriedades antes de detectar o chat.');
  const resp = UrlFetchApp.fetch(TELEGRAM_API + token + '/getUpdates', { muteHttpExceptions: true });
  const d = JSON.parse(resp.getContentText());
  if (!d.ok) throw new Error('Não consegui ler as mensagens do bot (um webhook já ativo bloqueia getUpdates). Remova o webhook ou informe o chat manualmente.');
  let chatId = '';
  for (let i = (d.result || []).length - 1; i >= 0; i--) {
    const m = d.result[i].message || d.result[i].edited_message;
    if (m && m.chat && m.chat.id) { chatId = String(m.chat.id); break; }
  }
  if (!chatId) throw new Error('Nenhuma mensagem encontrada. Abra o seu bot no Telegram e envie /start, depois rode de novo.');
  p.setProperty('TELEGRAM_CHAT_ID', chatId);
  console.log('Chat detectado e salvo.');
  return chatId;
}

/** Faz tudo de uma vez: detecta o chat, liga os avisos, configura o webhook e roda a primeira verificação. */
function ativarTudoTelegram() {
  const p = PropertiesService.getScriptProperties();
  if (!/^\d{6,}:[A-Za-z0-9_-]{20,}$/.test(p.getProperty('TELEGRAM_TOKEN') || '')) throw new Error('Cole TELEGRAM_TOKEN nas Propriedades do script primeiro.');
  if (!/^-?\d{1,20}$/.test(p.getProperty('TELEGRAM_CHAT_ID') || '')) detectarChatId();
  ativarAvisosTelegram();
  configurarWebhook();
  const resumo = atualizarAgora();
  console.log('Telegram ativado, webhook configurado e verificação executada.');
  return resumo;
}

/** Registra o webhook apontando para este Web App publicado, com segredo na URL. */
function configurarWebhook() {
  const p = PropertiesService.getScriptProperties();
  const c = validarTelegram_(p);
  let segredo = c.segredo;
  if (!segredo) { segredo = Utilities.getUuid().replace(/-/g, ''); p.setProperty('TELEGRAM_WEBHOOK_SECRET', segredo); }
  // Prefere a URL /exec publicada (WEBAPP_URL); getService().getUrl() pode devolver a /dev, que o Telegram não acessa.
  const url = p.getProperty('WEBAPP_URL') || ScriptApp.getService().getUrl();
  if (!url) throw new Error('Publique como Web App (Implantar > Nova implantação > App da Web) antes de configurar o webhook.');
  if (!/\/exec(\?|$)/.test(url)) throw new Error('A URL do Web App precisa terminar em /exec. Defina WEBAPP_URL nas Propriedades com a URL da implantação.');
  chamarTelegram_(c.token, 'setWebhook', {
    url: url + '?s=' + segredo,
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true
  });
  console.log('Webhook configurado. Envie /inicio ao bot para testar.');
}
/** Diagnóstico: mostra se o webhook está saudável, sem expor token nem a URL completa. */
function verificarWebhook() {
  const p = PropertiesService.getScriptProperties();
  const c = validarTelegram_(p);
  const info = chamarTelegram_(c.token, 'getWebhookInfo', {});
  const terminaExec = /\/exec(\?|$)/.test(info.url || '');
  console.log('Webhook definido: ' + Boolean(info.url) + ' | termina em /exec: ' + terminaExec +
    ' | updates pendentes: ' + (info.pending_update_count || 0) + ' | último erro: ' + (info.last_error_message || 'nenhum'));
  return info.last_error_message || 'sem erro';
}
function removerWebhook() {
  const p = PropertiesService.getScriptProperties();
  const c = validarTelegram_(p);
  chamarTelegram_(c.token, 'deleteWebhook', { drop_pending_updates: false });
}

function abrirPlanilha_(props) {
  const id = props.getProperty('PLANILHA_ID');
  if (!id) throw new Error('Execute prepararEConferir primeiro.');
  const ss = SpreadsheetApp.openById(id), aba = ss.getSheetByName(ABA_VAGAS);
  if (!aba) throw new Error('Aba Estágios não encontrada.');
  return { ss: ss, aba: aba };
}
/** Lê a aba Estágios por cabeçalho, em objetos para o bot. Tolerante a colunas ausentes. */
function lerVagasParaBot_(aba) {
  const dados = aba.getDataRange().getValues();
  if (dados.length < 1) return [];
  const cab = dados[0];
  const col = nome => cab.indexOf(nome);
  const ler = (linha, nome) => { const i = col(nome); return i >= 0 ? linha[i] : ''; };
  return dados.slice(1).filter(r => r.some(c => c !== '' && c != null)).map(r => {
    const prazo = ler(r, 'Prazo');
    return {
      inscrito: ler(r, 'Inscrito?'),
      prioridade: ler(r, 'Prioridade'),
      empresa: ler(r, 'Empresa / vaga'),
      link: ler(r, 'Link'),
      bolsa: ler(r, 'Bolsa (R$/mês)') || ler(r, 'Bolsa'),
      beneficios: ler(r, 'Benefícios'),
      localModelo: ler(r, 'Local / modelo'),
      jornada: ler(r, 'Jornada'),
      curriculo: ler(r, 'Currículo'),
      situacao: ler(r, 'Situação'),
      id: ler(r, 'ID'),
      proximaAcao: ler(r, 'Próxima ação'),
      prazo: prazo instanceof Date ? prazo : ''
    };
  });
}

/** Histórico cronológico, acrescido e nunca sobrescrito. */
function registrarHistorico_(ss, idVaga, empresa, evento, origem) {
  let h = ss.getSheetByName('_Historico');
  if (!h) { h = ss.insertSheet('_Historico'); h.appendRow(['Registrado em', 'ID vaga', 'Empresa', 'Evento', 'Origem']); h.hideSheet(); }
  h.appendRow([new Date(), idVaga || '', textoSeguroCelula(empresa || ''), textoSeguroCelula(evento || ''), origem || '']);
}

/** Aplica um registro manual confirmado: escreve a Próxima ação e acrescenta ao histórico. */
function aplicarRegistroManual_(pendente) {
  const p = PropertiesService.getScriptProperties();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) throw new Error('Outra execução em andamento. Tente de novo em instantes.');
  try {
    const ctx = abrirPlanilha_(p), aba = ctx.aba;
    const vaga = lerVagas_(aba).find(v => v.id === pendente.id);
    if (!vaga) throw new Error('Não encontrei mais essa vaga na planilha (o ID pode ter mudado).');
    if (aba.getMaxColumns() < 14) aba.insertColumnsAfter(aba.getMaxColumns(), 14 - aba.getMaxColumns());
    const cab = aba.getRange(1, 13, 1, 2).getValues()[0];
    if ((cab[0] && cab[0] !== 'Próxima ação') || (cab[1] && cab[1] !== 'Atualização do e-mail')) throw new Error('Colunas M:N têm outro conteúdo; não vou sobrescrever.');
    aba.getRange(1, 13, 1, 2).setValues([['Próxima ação', 'Atualização do e-mail']]);
    const alvo = aba.getRange(vaga.linha, 13, 1, 2);
    alvo.setValues([[textoSeguroCelula(pendente.status), new Date()]]);
    alvo.getCell(1, 1).setNote('Registro manual pelo Telegram em ' + new Date().toLocaleString('pt-BR'));
    registrarHistorico_(ctx.ss, vaga.id, pendente.empresa, pendente.status, 'Telegram (manual)');
    return vaga;
  } finally { lock.releaseLock(); }
}

/** Webhook. Responde somente ao chat autorizado e exige o segredo na URL. */
function doPost(e) {
  const vazio = ContentService.createTextOutput('');
  try {
    const p = PropertiesService.getScriptProperties();
    const c = configTelegram_(p);
    if (!c.token || !c.chatId) return vazio;
    if (c.segredo && (!e || !e.parameter || e.parameter.s !== c.segredo)) return vazio;
    if (!e || !e.postData || !e.postData.contents) return vazio;
    const update = JSON.parse(e.postData.contents);
    if (update.callback_query) { tratarCallback_(p, c, update.callback_query); return vazio; }
    const msg = update.message;
    if (!msg || !msg.chat) return vazio;
    if (String(msg.chat.id) !== String(c.chatId)) {
      // Pessoa não autorizada: não revela dados, apenas recusa.
      try { enviarTelegram_(p, msg.chat.id, 'Este assistente é privado.'); } catch (x) {}
      return vazio;
    }
    tratarMensagem_(p, c, String(msg.text || ''));
  } catch (err) { console.log('doPost erro: ' + err.message); }
  return vazio;
}
function tratarMensagem_(p, c, texto) {
  const inp = interpretarComando(texto);
  const vagas = lerVagasParaBot_(abrirPlanilha_(p).aba);
  const resp = responderComando(inp, { vagas: vagas, hoje: new Date() });
  if (resp.pendente) {
    p.setProperty('PENDENTE_UPDATE', JSON.stringify({ id: resp.pendente.id, empresa: resp.pendente.empresa, status: resp.pendente.status, ts: Date.now() }));
  } else if (inp.comando === 'atualizar') {
    p.deleteProperty('PENDENTE_UPDATE');
  }
  enviarTelegram_(p, c.chatId, resp.texto, resp.teclado);
}
function tratarCallback_(p, c, cq) {
  const token = c.token;
  const responder = txt => { try { chamarTelegram_(token, 'answerCallbackQuery', { callback_query_id: cq.id, text: txt || '' }); } catch (x) {} };
  if (!cq.from || String(cq.from.id) !== String(c.chatId)) { responder('Não autorizado.'); return; }
  const dado = cq.data || '';
  const bruto = p.getProperty('PENDENTE_UPDATE');
  if (!bruto) { responder('Nada pendente.'); enviarTelegram_(p, c.chatId, 'Não há registro manual pendente.'); return; }
  let pend; try { pend = JSON.parse(bruto); } catch (x) { p.deleteProperty('PENDENTE_UPDATE'); responder('Pedido inválido.'); return; }
  if (Date.now() - Number(pend.ts || 0) > 900000) { p.deleteProperty('PENDENTE_UPDATE'); responder('Expirado.'); enviarTelegram_(p, c.chatId, 'A confirmação expirou. Envie o pedido novamente.'); return; }
  if (dado === 'cancelar') { p.deleteProperty('PENDENTE_UPDATE'); responder('Cancelado.'); enviarTelegram_(p, c.chatId, '❌ Registro manual cancelado. Nada foi alterado.'); return; }
  if (dado === 'confirmar') {
    try {
      const vaga = aplicarRegistroManual_(pend);
      p.deleteProperty('PENDENTE_UPDATE');
      responder('Registrado.');
      enviarTelegram_(p, c.chatId, '✅ Registrado: ' + vaga.empresa + '\n➡️ ' + pend.status + '\nO histórico anterior foi preservado.');
    } catch (err) {
      responder('Falhou.');
      enviarTelegram_(p, c.chatId, '⚠️ Não consegui registrar: ' + err.message);
    }
    return;
  }
  responder('');
}
