/** Monitor privado; avisos opcionais apenas ao destinatário configurado. */
const ABA_VAGAS = 'Estágios';
const ABA_LOG = '_Automacao';

function prepararEConferir() {
  if (typeof CONFIG_LOCAL === 'undefined' || !CONFIG_LOCAL.planilhaId) throw new Error('Execute o instalador para configurar a planilha.');
  const props=PropertiesService.getScriptProperties();
  if (props.getProperty('PLANILHA_ID')!==CONFIG_LOCAL.planilhaId) {
    props.deleteProperty('ULTIMO_SUCESSO');
    props.setProperty('AVISAR_EMAIL','false');props.setProperty('AVISAR_WHATSAPP','false');
  }
  props.setProperty('PLANILHA_ID', CONFIG_LOCAL.planilhaId);
  const marcador=String(CONFIG_LOCAL.marcadorGmail||'').trim();
  if ((props.getProperty('GMAIL_LABEL')||'')!==marcador) props.deleteProperty('ULTIMO_SUCESSO');
  props.setProperty('GMAIL_LABEL',marcador);
  if (CONFIG_LOCAL.avisosPermitidos!==true) { props.setProperty('AVISAR_EMAIL','false');props.setProperty('AVISAR_WHATSAPP','false'); }
  if (CONFIG_LOCAL.emailDestino) props.setProperty('EMAIL_DESTINO',CONFIG_LOCAL.emailDestino);
  return conferirAgora();
}
function conferirAgora() { return processar_(true); }
function atualizarAgora() { return processar_(false); }

function ativarAutomatico() {
  // Executar explicitamente após conferir a prévia. Gatilho diário, hora aproximada.
  atualizarAgora();
  const anteriores = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'atualizarAgora');
  if (!anteriores.length) ScriptApp.newTrigger('atualizarAgora').timeBased().atHour(9).everyDays(1).inTimezone('America/Sao_Paulo').create();
  console.log('Verificação diária habilitada na faixa das 9h. Avisos apenas nos canais explicitamente habilitados; sem eventos.');
}
function ativarAvisosEmail() {
  const p=PropertiesService.getScriptProperties();
  if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(p.getProperty('EMAIL_DESTINO')||'')) throw new Error('Configure EMAIL_DESTINO primeiro.');
  p.setProperty('AVISAR_EMAIL','true');
}
function ativarAvisosWhatsApp() { const p=PropertiesService.getScriptProperties();validarWhatsApp_(p);p.setProperty('AVISAR_WHATSAPP','true'); }
function desativarAvisos() { const p=PropertiesService.getScriptProperties();p.setProperty('AVISAR_EMAIL','false');p.setProperty('AVISAR_WHATSAPP','false'); }
function desativarAutomatico() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'atualizarAgora').forEach(t => ScriptApp.deleteTrigger(t));
}

function lerVagas_(aba) {
  const dados = aba.getDataRange().getValues();
  if (!dados.length) throw new Error('Cabeçalhos inesperados. Nenhuma alteração realizada.');
  const cab=dados[0], campos=['Inscrito?','ID','Link','Empresa / vaga'];
  if (campos.some(c=>cab.indexOf(c)<0 || cab.indexOf(c)!==cab.lastIndexOf(c))) throw new Error('Cabeçalhos ausentes ou duplicados. Nenhuma alteração realizada.');
  const idCol=cab.indexOf('ID'), linkCol=cab.indexOf('Link'), empresaCol=cab.indexOf('Empresa / vaga');
  const ids = new Set();
  return dados.slice(1).map((r,i) => ({id:r[idCol], url:r[linkCol], empresa:r[empresaCol], linha:i+2})).filter(v => {
    if (!v.id) return false;
    if (ids.has(v.id)) throw new Error('ID duplicado; corrigir antes de executar.');
    ids.add(v.id);return true;
  });
}
function extrairTexto_(payload) {
  if (!payload) return '';
  let partes = [];
  if (!payload.filename && payload.body && payload.body.data && /^text\/(plain|html)$/.test(payload.mimeType || '')) {
    partes.push(Utilities.newBlob(Utilities.base64DecodeWebSafe(payload.body.data)).getDataAsString('UTF-8').replace(/<[^>]*>/g, ' '));
  }
  (payload.parts || []).forEach(p => { if (!p.filename) partes.push(extrairTexto_(p)); });
  return partes.join('\n').slice(0,150000);
}
function processar_(previa) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return {ignorado:'Outra execução em andamento'};
  try {
    const props = PropertiesService.getScriptProperties();
    const id = props.getProperty('PLANILHA_ID');
    if (!id) throw new Error('Execute prepararEConferir primeiro.');
    const ss = SpreadsheetApp.openById(id), aba = ss.getSheetByName(ABA_VAGAS);
    if (!aba) throw new Error('Aba Estágios não encontrada.');
    const vagas = lerVagas_(aba), inicio = Date.now();
    let log = ss.getSheetByName(ABA_LOG);
    const vistos = new Set(log && log.getLastRow()>1 ? log.getRange(2,1,log.getLastRow()-1,1).getValues().flat().map(String) : []);
    const marco = Number(props.getProperty('ULTIMO_SUCESSO') || 0);
    const marcador=props.getProperty('GMAIL_LABEL')||'';
    if (marcador) {
      const labels=Gmail.Users.Labels.list('me').labels||[];
      if (!labels.some(l=>l.name===marcador)) throw new Error('Marcador Gmail não encontrado. Crie/aplique o marcador configurado antes de executar.');
    }
    const q = montarConsultaGmail_(marco,marcador);
    let page, ids=[], truncado=false, paginas=0;
    do {
      const resp = Gmail.Users.Messages.list('me',{q:q,maxResults:100,...(page?{pageToken:page}:{})});
      ids = ids.concat((resp.messages || []).map(m=>m.id).filter(mid=>!vistos.has(mid)));page=resp.nextPageToken;paginas++;
      if (ids.length>=25) { truncado=ids.length>25 || Boolean(page); ids=ids.slice(0,25); break; }
      if (paginas>=10 && page) { truncado=true;break; }
    } while(page);
    const propostas=[];
    for (const mid of ids) {
      if (vistos.has(mid)) continue;
      if (Date.now()-inicio>240000) { truncado=true; break; }
      const m=Gmail.Users.Messages.get('me',mid,{format:'full'});
      const headers=m.payload.headers||[];
      const assunto=(headers.find(h=>h.name.toLowerCase()==='subject')||{}).value||'';
      const texto=assunto+'\n'+extrairTexto_(m.payload);
      const vaga=relacionarMensagem(texto,vagas);
      propostas.push({mensagem:mid,recebida:Number(m.internalDate),idVaga:vaga?vaga.id:'',acao:sinalDaMensagem(texto),vaga:vaga});
    }
    propostas.sort((a,b)=>a.recebida-b.recebida);
    if (!previa) {
      // Só duas colunas novas, à direita dos IDs existentes. A:L e notas ficam intactas.
      if (aba.getMaxColumns()<14) aba.insertColumnsAfter(aba.getMaxColumns(),14-aba.getMaxColumns());
      const cab=aba.getRange(1,13,1,2).getValues()[0];
      if ((cab[0] && cab[0]!=='Próxima ação') || (cab[1] && cab[1]!=='Atualização do e-mail')) throw new Error('M:N já contêm dados. Não sobrescrever.');
      aba.getRange(1,13,1,2).setValues([['Próxima ação','Atualização do e-mail']]);
      if (!log) { log=ss.insertSheet(ABA_LOG);log.appendRow(['ID mensagem','Recebida em','ID vaga','Ação','Processada em']);log.hideSheet(); }
      for (const p of propostas) {
        if (p.vaga) {
          // Refazer vínculo porID caso a tabela tenha sido ordenada durante a leitura.
          const vagaAtual=lerVagas_(aba).find(v=>v.id===p.idVaga);
          if (!vagaAtual) throw new Error('Vaga removida durante a execução; nenhuma outra linha será usada.');
          const alvo=aba.getRange(vagaAtual.linha,13,1,2), anterior=alvo.getValues()[0];
          // Mensagem mais antiga nunca substitui novidade posterior.
          if (!(anterior[1] instanceof Date) || anterior[1].getTime()<=p.recebida) {
            alvo.setValues([[p.acao,new Date(p.recebida)]]);
            alvo.getCell(1,1).setNote('Conferir a mensagem original: https://mail.google.com/mail/u/0/#all/'+p.mensagem);
          }
        }
        enfileirarAvisos_(p,props,ss);
        log.appendRow([p.mensagem,new Date(p.recebida),p.idVaga,p.acao,new Date()]);
      }
      enviarPendentes_(ss,props);
      if (!truncado) props.setProperty('ULTIMO_SUCESSO',String(inicio));
    }
    const resumo={modo:previa?'CONFERÊNCIA — sem alteração na planilha':'APLICADO',encontradas:propostas.length,relacionadas:propostas.filter(p=>p.vaga).length,revisarSemVinculo:propostas.filter(p=>!p.vaga).length,truncado:truncado,acoes:propostas.map(p=>({idVaga:p.idVaga||'Revisar vínculo',acao:p.acao}))};
    console.log(JSON.stringify(resumo));return resumo;
  } finally { lock.releaseLock(); }
}
