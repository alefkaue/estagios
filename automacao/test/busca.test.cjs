const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');

function carregar(ctx){for(const n of ['Logica.js','Telegram.js','Assistente.js','Notificacoes.js','Busca.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',n),'utf8'),ctx);}

test('vagaRelevante_ aceita estágio TI/geral e rejeita não-TI',()=>{
 const ctx=vm.createContext({});carregar(ctx);
 const r=ctx.vagaRelevante_;
 assert.equal(r('Estágio Short Job | Automation - Development'),true);
 assert.equal(r('Programa de Estágio C6 Bank 2027.1'),true);
 assert.equal(r('Banco de Talentos | Pessoa Estagiária'),true);
 assert.equal(r('Estágio em Desenvolvimento de Software'),true);
 assert.equal(r('Estágio em Equity Research'),false);
 assert.equal(r('Estágio em Marketing Digital'),false);
 assert.equal(r('Analista de Controles Internos | Tecnologia'),false);
});

function ambiente(){
 const props=new Map([['PLANILHA_ID','p'],['GREENHOUSE_EMPRESAS','co1,co2']]);
 const ps={getProperty:k=>props.has(k)?props.get(k):null,setProperty:(k,v)=>props.set(k,String(v)),deleteProperty:k=>props.delete(k)};
 const vistas=[]; // vazio: abaVistas_ cria o cabeçalho via insertSheet
 const aba={getLastRow:()=>vistas.length,getRange:(r,c,n,m)=>({getValues:()=>vistas.slice(1).map(x=>[x[c-1]])}),appendRow:row=>vistas.push(row),hideSheet:()=>{}};
 let temAba=false;
 const ss={getSheetByName:nome=>nome==='_VagasVistas'?(temAba?aba:null):null,insertSheet:()=>{temAba=true;return aba;}};
 const jobs=[{id:1,title:'Estágio em Dados',location:{name:'São Paulo'},absolute_url:'https://u/1'},{id:2,title:'Estágio em Marketing',location:{name:'SP'},absolute_url:'https://u/2'}];
 const ctx=vm.createContext({Date,Set,Map,JSON,console:{log:()=>{}},
  PropertiesService:{getScriptProperties:()=>ps},
  LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},
  SpreadsheetApp:{openById:()=>ss},
  UrlFetchApp:{fetch:()=>({getResponseCode:()=>200,getContentText:()=>JSON.stringify({jobs})})}});
 carregar(ctx);
 return {ctx,vistas};
}
test('semeadura registra relevantes e deduplica na 2ª vez',()=>{
 const a=ambiente();
 const r1=a.ctx.buscarVagasNovas_(false);
 assert.equal(r1.novas,2); // 1 relevante (Dados) x 2 empresas; Marketing é descartada
 assert.equal(r1.avisadas,0); // semeadura não avisa
 assert.equal(a.vistas.length,3); // cabeçalho + 2
 const r2=a.ctx.buscarVagasNovas_(false);
 assert.equal(r2.novas,0); // já vistas
});
