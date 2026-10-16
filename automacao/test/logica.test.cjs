const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/Logica.js'),'utf8'),ctx);
const vagas=[{id:'A',url:'https://stefanini.gupy.io/jobs/12411574'},{id:'B',url:'https://carreiras.btgpactual.com/vagas?gh_jid=6133390004'}];
test('número completo relaciona, número parcial ou empresa sozinha não',()=>{
 assert.equal(ctx.relacionarMensagem('Vaga12411574',vagas),null);
 assert.equal(ctx.relacionarMensagem('Vaga 12411574: entrevista',vagas).id,'A');
 assert.equal(ctx.relacionarMensagem('Stefanini 124115',vagas),null);
});
test('dois códigos não dão vínculo automático',()=>assert.equal(ctx.relacionarMensagem('12411574 e 6133390004',vagas),null));
test('URL BTG preserva o código de requisição',()=>assert.equal(ctx.relacionarMensagem('6133390004',vagas).id,'B'));
test('negação não vira aprovação ou convite',()=>assert.equal(ctx.sinalDaMensagem('Você não foi selecionado para entrevista.'),'Revisar retorno do processo'));
test('vários sinais viram revisão, sem inventar etapa',()=>assert.equal(ctx.sinalDaMensagem('Entrevista e teste disponíveis'),'Revisar mensagem de recrutamento'));
test('conteúdo externo não vira fórmula',()=>assert.equal(ctx.textoSeguroCelula('=IMPORTDATA("url")'),'\'=IMPORTDATA("url")'));
