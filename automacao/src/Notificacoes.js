/** Avisos somente ao destinatário configurado. Desativados por padrão. */
function corpoAviso_(empresa, acao, planilhaId) {
  return 'Atualização de candidatura\n'+empresa+'\n'+acao+'\nConfira a fonte na sua planilha: https://docs.google.com/spreadsheets/d/'+planilhaId+'/edit';
}
function mensagemWhatsApp_(config, resumo) {
  if (!/^\d{10,15}$/.test(config.destino||'')) throw new Error('Destino WhatsApp inválido.');
  if (!/^[a-z0-9_]+$/.test(config.template||'')) throw new Error('Template WhatsApp inválido.');
  return {messaging_product:'whatsapp',to:config.destino,type:'template',template:{name:config.template,language:{code:config.idioma||'pt_BR'},components:[{type:'body',parameters:[{type:'text',text:resumo.replace(/[\r\n\t]+/g,' ').slice(0,800)}]}]}};
}
function validarWhatsApp_(props) {
  const c={token:props.getProperty('WA_TOKEN'),telefoneId:props.getProperty('WA_PHONE_ID'),destino:props.getProperty('WA_DESTINO'),template:props.getProperty('WA_TEMPLATE'),idioma:props.getProperty('WA_IDIOMA')||'pt_BR',versao:props.getProperty('WA_VERSAO')};
  if (!c.token || !/^\d+$/.test(c.telefoneId||'') || !/^v\d+\.\d+$/.test(c.versao||'')) throw new Error('Configure WA_TOKEN, WA_PHONE_ID e WA_VERSAO nas propriedades privadas.');
  mensagemWhatsApp_(c,'Verificação de configuração');return c;
}
function filaAvisos_(ss,criar) {
  let f=ss.getSheetByName('_Notificacoes');
  if (!f && criar) { f=ss.insertSheet('_Notificacoes');f.appendRow(['Chave','Canal','Estado','Empresa','Ação','ID vaga','Atualizado em']);f.hideSheet(); }
  return f;
}
function enfileirarAvisos_(proposta,props,ss) {
  const canais=[];
  if (props.getProperty('AVISAR_EMAIL')==='true') canais.push('email');
  if (props.getProperty('AVISAR_WHATSAPP')==='true') canais.push('whatsapp');
  if (!canais.length)return;
  const f=filaAvisos_(ss,true);
  const chaves=new Set(f.getLastRow()>1?f.getRange(2,1,f.getLastRow()-1,1).getValues().flat():[]);
  canais.forEach(canal=>{
    const chave=proposta.mensagem+'|'+canal;
    if (!chaves.has(chave)) f.appendRow([chave,canal,'Pendente',textoSeguroCelula(proposta.vaga?proposta.vaga.empresa:'Vínculo da vaga a revisar'),proposta.acao,proposta.idVaga,new Date()]);
  });
}
function enviarPendentes_(ss,props) {
  const f=filaAvisos_(ss,false);if(!f || f.getLastRow()<2)return;
  const dados=f.getRange(2,1,f.getLastRow()-1,7).getValues();let enviados=0;
  for(let i=0;i<dados.length && enviados<20;i++) {
    const r=dados[i];if(r[2]!=='Pendente')continue;
    const canal=r[1];if(props.getProperty(canal==='email'?'AVISAR_EMAIL':'AVISAR_WHATSAPP')!=='true')continue;
    let config;
    // Validação antes de iniciar o envio: falha aqui mantém item pendente.
    if(canal==='email') {
      config=props.getProperty('EMAIL_DESTINO');
      if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(config||''))throw new Error('Configure um único EMAIL_DESTINO válido.');
      if(MailApp.getRemainingDailyQuota()<1)throw new Error('Cota diária de e-mail esgotada; avisos continuam pendentes.');
    } else if(canal==='whatsapp') config=validarWhatsApp_(props);
    else throw new Error('Canal desconhecido na fila.');
    f.getRange(i+2,3).setValue('Enviando');SpreadsheetApp.flush();
    try {
      if(canal==='email') MailApp.sendEmail({to:config,subject:'[Assistente Estagios] Atualização de candidatura',body:corpoAviso_(r[3],r[4],props.getProperty('PLANILHA_ID')),name:'Assistente de estágios'});
      else {
        const resp=UrlFetchApp.fetch('https://graph.facebook.com/'+config.versao+'/'+config.telefoneId+'/messages',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+config.token},payload:JSON.stringify(mensagemWhatsApp_(config,r[3]+': '+r[4])),muteHttpExceptions:true});
        const code=resp.getResponseCode();
        // Não imprimir corpo de erro/headers: podem conter dados privados.
        if(code<200 || code>=300)throw new Error('WhatsApp retornou HTTP'+code+'.');
        const resposta=JSON.parse(resp.getContentText());
        if(!resposta.messages || !resposta.messages[0] || !resposta.messages[0].id)throw new Error('WhatsApp não confirmou aceitação.');
      }
      f.getRange(i+2,3).setValue('Aceito pelo serviço');f.getRange(i+2,7).setValue(new Date());enviados++;
    } catch(e) {
      // Não repetir automaticamente um envio de resultado incerto.
      f.getRange(i+2,3).setValue('Revisar envio');f.getRange(i+2,7).setValue(new Date());
      throw new Error('Envio não confirmado. Item mantido para revisão privada, sem repetição automática.');
    }
  }
}
