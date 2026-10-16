const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');

function ambiente() {
 const props=new Map([
  ['PLANILHA_ID','planilha-privada'],
  ['TELEGRAM_TOKEN','1234567:ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'],
  ['TELEGRAM_CHAT_ID','555'],
  ['TELEGRAM_WEBHOOK_SECRET','segredo123']
 ]);
 const ps={getProperty:k=>props.has(k)?props.get(k):null,setProperty:(k,v)=>props.set(k,String(v)),deleteProperty:k=>props.delete(k)};
 const grid=[
  ['Inscrito?','Prioridade','Empresa / vaga','Link','Bolsa (R$/mês)','Benefícios','Local / modelo','Jornada','Currículo','Situação','ID','Verificado em'],
  [true,'P1','Webmotors — Data Analytics','https://stefanini.gupy.io/jobs/12411574','R$ 2.200','VR; VT','Vila Olímpia — SP | Híbrido','6h','TI','Entrevista identificada','W1','agora']
 ];
 let alteracoes=0;
 const getRange=(r,c,n=1,m=1)=>({getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>grid[r+i-1]?.[c+j-1]??'')),setValues:vs=>{alteracoes++;vs.forEach((row,i)=>row.forEach((v,j)=>{grid[r+i-1]??=[];grid[r+i-1][c+j-1]=v;}));},getCell:()=>({setNote:()=>{}})});
 const aba={getDataRange:()=>({getValues:()=>grid}),getRange,getMaxColumns:()=>14,insertColumnsAfter:()=>{}};
 const backing={'_Historico':[],'_Notificacoes':[]};const vivas={};
 const fazerAba=nome=>{const rows=backing[nome];return {getLastRow:()=>rows.length,getRange:(r,c,n,m)=>({getValues:()=>rows.slice(1).map(x=>x.slice())}),appendRow:row=>{rows.push(row);},hideSheet:()=>{}};};
 const ss={getSheetByName:nome=>nome==='Estágios'?aba:(vivas[nome]||null),insertSheet:nome=>{backing[nome]=backing[nome]||[];vivas[nome]=fazerAba(nome);return vivas[nome];}};
 const sends=[];
 const UrlFetchApp={fetch:(url,cfg)=>{const corpo=JSON.parse(cfg.payload);const metodo=url.split('/').pop();sends.push({metodo,corpo,url});return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({ok:true,result:{message_id:sends.length}})};}};
 const ctx=vm.createContext({Date,Set,Map,JSON,console:{log:()=>{}},
  PropertiesService:{getScriptProperties:()=>ps},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  SpreadsheetApp:{openById:()=>ss,flush:()=>{}},
  UrlFetchApp,
  ContentService:{createTextOutput:t=>({_t:t})},
  ScriptApp:{getService:()=>({getUrl:()=>'https://script.google.com/exec'})},
  Utilities:{getUuid:()=>'uuid-uuid'}});
 for(const name of ['Logica.js','Bot.js','Notificacoes.js','Telegram.js','Assistente.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',name),'utf8'),ctx);
 return {ctx,props,grid,backing,sends,get alteracoes(){return alteracoes;}};
}
function evento(update,secret='segredo123'){return {parameter:{s:secret},postData:{contents:JSON.stringify(update)}};}

test('segredo errado no webhook não responde nada',()=>{
 const a=ambiente();a.ctx.doPost(evento({message:{chat:{id:555},text:'/vagas'}},'errado'));
 assert.equal(a.sends.length,0);
});
test('chat não autorizado recebe recusa sem vazar dados',()=>{
 const a=ambiente();a.ctx.doPost(evento({message:{chat:{id:999},text:'/vagas'}}));
 assert.equal(a.sends.length,1);assert.match(a.sends[0].corpo.text,/privado/);assert.ok(!/Webmotors/.test(a.sends[0].corpo.text));
});
test('comando /empresa autorizado responde com os campos da vaga',()=>{
 const a=ambiente();a.ctx.doPost(evento({message:{chat:{id:555},text:'/empresa Webmotors'}}));
 assert.equal(a.sends.length,1);assert.match(a.sends[0].corpo.text,/Bolsa anunciada: R\$ 2\.200/);assert.match(a.sends[0].corpo.text,/Webmotors/);
});
test('registro manual pede confirmação e só altera após confirmar',()=>{
 const a=ambiente();
 a.ctx.doPost(evento({message:{chat:{id:555},text:'atualizar Webmotors para entrevista agendada'}}));
 assert.match(a.sends[0].corpo.text,/Confirmar registro manual/);
 assert.ok(a.sends[0].corpo.reply_markup,'deve vir com botões');
 assert.ok(a.props.get('PENDENTE_UPDATE'),'pendência registrada');
 // Ainda não alterou a planilha.
 assert.equal(a.grid[1][12],undefined);
 a.ctx.doPost(evento({callback_query:{id:'cq1',from:{id:555},data:'confirmar'}}));
 assert.equal(a.grid[1][12],'entrevista agendada');
 assert.equal(a.backing['_Historico'].length,2);
 assert.equal(a.backing['_Historico'][1][4],'Telegram (manual)');
 assert.equal(a.props.has('PENDENTE_UPDATE'),false);
});
test('cancelar não altera a planilha',()=>{
 const a=ambiente();
 a.ctx.doPost(evento({message:{chat:{id:555},text:'atualizar Webmotors para teste'}}));
 a.ctx.doPost(evento({callback_query:{id:'cq2',from:{id:555},data:'cancelar'}}));
 assert.equal(a.grid[1][12],undefined);assert.equal(a.props.has('PENDENTE_UPDATE'),false);
});
test('callback de pessoa não autorizada não aplica',()=>{
 const a=ambiente();
 a.ctx.doPost(evento({message:{chat:{id:555},text:'atualizar Webmotors para teste'}}));
 a.ctx.doPost(evento({callback_query:{id:'cq3',from:{id:999},data:'confirmar'}}));
 assert.equal(a.grid[1][12],undefined);assert.ok(a.props.get('PENDENTE_UPDATE'));
});
test('canal Telegram entra na fila e é aceito pelo serviço',()=>{
 const a=ambiente();
 const props=new Map([['AVISAR_TELEGRAM','true'],['TELEGRAM_TOKEN','1234567:ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'],['TELEGRAM_CHAT_ID','555'],['PLANILHA_ID','p']]);
 const p={getProperty:k=>props.has(k)?props.get(k):null,setProperty:(k,v)=>props.set(k,String(v))};
 const dados=[];
 const f={getLastRow:()=>dados.length+1,getRange:(r,c)=>({getValues:()=>dados.map(x=>x.slice()),setValue:v=>{dados[r-2][c-1]=v;}}),appendRow:row=>dados.push(row),hideSheet:()=>{}};
 const ss={getSheetByName:()=>f,insertSheet:()=>f};
 a.ctx.enfileirarAvisos_({mensagem:'m1',acao:'Conferir convite de entrevista',idVaga:'W1',vaga:{empresa:'Webmotors'}},p,ss);
 assert.equal(dados.length,1);assert.equal(dados[0][1],'telegram');
 a.ctx.enviarPendentes_(ss,p);
 const tg=a.sends.filter(s=>s.metodo==='sendMessage');
 assert.ok(tg.length>=1);assert.match(tg[0].corpo.text,/Atualização de candidatura/);
 assert.equal(dados[0][2],'Aceito pelo serviço');
 // Reenvio não duplica.
 a.ctx.enviarPendentes_(ss,p);
 assert.equal(a.sends.filter(s=>s.metodo==='sendMessage').length,tg.length);
});
