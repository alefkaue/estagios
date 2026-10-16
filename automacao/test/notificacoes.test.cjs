const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function ambiente({whatsapp=false,erro=false}={}) {
 let enviados=0;
 const data=[['msg|'+(whatsapp?'whatsapp':'email'),whatsapp?'whatsapp':'email','Pendente','Empresa','Conferir entrevista','ID',new Date()]];
 const props=new Map([['PLANILHA_ID','privada'],['EMAIL_DESTINO','pessoa@example.org'],['WA_TOKEN','teste-nao-real'],['WA_PHONE_ID','123'],['WA_DESTINO','5511999999999'],['WA_TEMPLATE','atualizacao_estagio'],['WA_VERSAO','v23.0']]);
 const p={getProperty:k=>props.get(k)};
 const f={getLastRow:()=>2,getRange:(row,col,n,m)=>({getValues:()=>data.map(x=>x.slice()),setValue:v=>{data[row-2][col-1]=v;}})};
 const ctx=vm.createContext({Date,Set,Map,SpreadsheetApp:{flush:()=>{}},MailApp:{getRemainingDailyQuota:()=>10,sendEmail:()=>{enviados++;if(erro)throw Error('timeout');}},UrlFetchApp:{fetch:(url,config)=>{enviados++;assert.ok(url.startsWith('https://graph.facebook.com/'));assert.equal(JSON.parse(config.payload).type,'template');if(erro)throw Error('timeout');return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({messages:[{id:'aceito'}]})};}}});
 for(const name of ['Logica.js','Notificacoes.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',name),'utf8'),ctx);
 return {ctx,p,props,data,ss:{getSheetByName:()=>f},get enviados(){return enviados;}};
}
test('sem habilitação explícita não envia',()=>{const a=ambiente();a.ctx.enviarPendentes_(a.ss,a.p);assert.equal(a.enviados,0);});
test('e-mail aceito é registrado e não repetido',()=>{const a=ambiente();a.props.set('AVISAR_EMAIL','true');a.ctx.enviarPendentes_(a.ss,a.p);a.ctx.enviarPendentes_(a.ss,a.p);assert.equal(a.enviados,1);assert.equal(a.data[0][2],'Aceito pelo serviço');});
test('WhatsApp usa template e não confunde aceitação com entrega',()=>{const a=ambiente({whatsapp:true});a.props.set('AVISAR_WHATSAPP','true');a.ctx.enviarPendentes_(a.ss,a.p);assert.equal(a.enviados,1);assert.equal(a.data[0][2],'Aceito pelo serviço');});
test('timeout requer revisão sem reenvio automático',()=>{const a=ambiente({erro:true});a.props.set('AVISAR_EMAIL','true');assert.throws(()=>a.ctx.enviarPendentes_(a.ss,a.p),/não confirmado/);a.ctx.enviarPendentes_(a.ss,a.p);assert.equal(a.enviados,1);assert.equal(a.data[0][2],'Revisar envio');});
test('WhatsApp rejeita telefone fora do formato antes de enviar',()=>{const a=ambiente({whatsapp:true});a.props.set('AVISAR_WHATSAPP','true');a.props.set('WA_DESTINO','inválido');assert.throws(()=>a.ctx.enviarPendentes_(a.ss,a.p),/Destino/);assert.equal(a.enviados,0);assert.equal(a.data[0][2],'Pendente');});
