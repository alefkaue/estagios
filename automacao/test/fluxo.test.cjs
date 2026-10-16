const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
function ambiente({erro=false,truncado=false,manual=false,novoLayout=false}={}) {
 const props=new Map([['PLANILHA_ID','privada']]);let alteracoes=0,abertas=0;
 const grid=[['Inscrito?','Prioridade','Empresa / vaga','Link','','','','','','','ID','Verificado em'],[true,'P1','Empresa','https://stefanini.gupy.io/jobs/12411574','','','','','','','ID-1','agora']];
 if(manual)grid[0][12]='Minhas notas';
 if(novoLayout) grid.forEach(row=>{const check=row.shift();row.splice(9,0,check);});
 const getRange=(r,c,n=1,m=1)=>({getValues:()=>Array.from({length:n},(_,i)=>Array.from({length:m},(_,j)=>grid[r+i-1]?.[c+j-1]??'')),setValues:vs=>{alteracoes++;vs.forEach((row,i)=>row.forEach((v,j)=>{grid[r+i-1]??=[];grid[r+i-1][c+j-1]=v;}));},getCell:()=>({setNote:()=>{alteracoes++;}})});
 const logRows=[['ID mensagem','Recebida em','ID vaga','Ação','Processada em']];
 const log={getLastRow:()=>logRows.length,getRange:()=>({getValues:()=>logRows.slice(1).map(r=>[r[0]])}),appendRow:r=>{alteracoes++;logRows.push(r);},hideSheet:()=>{}};
 let temLog=false;
 const aba={getDataRange:()=>({getValues:()=>grid}),getRange,getMaxColumns:()=>14};
 const ss={getSheetByName:name=>name==='Estágios'?aba:(temLog?log:null),insertSheet:()=>{temLog=true;return {...log,appendRow:r=>{alteracoes++;if(logRows.length===1&&r[0]==='ID mensagem')return;logRows.push(r);}};}};
 const ctx=vm.createContext({Date,Set,Map,console:{log:()=>{}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock:()=>{}})},SpreadsheetApp:{openById:()=>{abertas++;return ss;}},Gmail:{Users:{Messages:{list:()=>({messages:truncado?Array.from({length:30},(_,i)=>({id:'msg'+i})):[{id:'msg1'}],...(truncado?{nextPageToken:'outra'}:{})}),get:()=>{if(erro)throw Error('Gmail indisponível');return {internalDate:'1792100000000',payload:{headers:[{name:'Subject',value:'Entrevista vaga 12411574'}]}};}}}},Utilities:{}});
 for(const name of ['Logica.js','Notificacoes.js','Assistente.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',name),'utf8'),ctx);
 return {ctx,props,grid,logRows,get alteracoes(){return alteracoes;}};
}
test('prévia não escreve em planilha, log ou marco',()=>{
 const a=ambiente();const r=a.ctx.conferirAgora();assert.equal(r.relacionadas,1);assert.equal(a.alteracoes,0);assert.equal(a.props.has('ULTIMO_SUCESSO'),false);
});
test('aplicação preserva checkbox/ID e deduplica mensagem',()=>{
 const a=ambiente();a.ctx.atualizarAgora();assert.equal(a.grid[1][0],true);assert.equal(a.grid[1][10],'ID-1');assert.equal(a.grid[1][12],'Conferir convite de entrevista');assert.ok(a.props.has('ULTIMO_SUCESSO'));
 assert.equal(a.ctx.atualizarAgora().encontradas,0);assert.equal(a.logRows.length,2);
});
test('falha no Gmail não muda dados ou marco',()=>{
 const a=ambiente({erro:true});assert.throws(()=>a.ctx.atualizarAgora(),/indisponível/);assert.equal(a.alteracoes,0);assert.equal(a.props.has('ULTIMO_SUCESSO'),false);
});
test('colunas manuais à direita não são sobrescritas',()=>{
 const a=ambiente({manual:true});assert.throws(()=>a.ctx.atualizarAgora(),/M:N/);assert.equal(a.grid[0][12],'Minhas notas');assert.equal(a.alteracoes,0);
});
test('paginação truncada não avança marco de sucesso',()=>{
 const a=ambiente({truncado:true});assert.equal(a.ctx.conferirAgora().truncado,true);assert.equal(a.props.has('ULTIMO_SUCESSO'),false);
});
test('checkbox no final é preservado; vínculo depende de cabeçalho',()=>{
 const a=ambiente({novoLayout:true});a.ctx.atualizarAgora();assert.equal(a.grid[1][9],true);assert.equal(a.grid[1][10],'ID-1');assert.equal(a.grid[1][12],'Conferir convite de entrevista');
});
