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
test('marcador limita consulta sem palavras-chave genéricas',()=>{
 const q=ctx.montarConsultaGmail_(0,'Vagas');assert.ok(q.includes('label:"Vagas"'));assert.ok(q.includes('newer_than:14d'));assert.ok(!q.includes('from:gupy.io'));
});
test('consulta mantém sobreposição e trata marcador como um valor',()=>{
 const q=ctx.montarConsultaGmail_(1792100000000,'Vagas" OR in:anywhere');assert.ok(q.includes('after:1791927200'));assert.ok(q.includes('label:"Vagas\\" OR in:anywhere"'));assert.throws(()=>ctx.montarConsultaGmail_(0,'Vagas\nOR in:anywhere'));
});
const vagas2=[
 {id:'IH',url:'https://peers.inhire.app/cd-peers-group/vagas/5b5198ce-8c1a-4501-a991-a893a0a68f9c/programa'},
 {id:'LI',url:'https://www.linkedin.com/jobs/view/3912345678/'},
 {id:'GP',url:'https://stefanini.gupy.io/jobs/12411574'}
];
test('InHire é relacionada pelo UUID da vaga',()=>{
 assert.equal(ctx.relacionarMensagem('Atualização da vaga 5b5198ce-8c1a-4501-a991-a893a0a68f9c',vagas2).id,'IH');
});
test('LinkedIn /jobs/view/<id> é reconhecido',()=>{
 assert.equal(ctx.codigosDaVaga('https://www.linkedin.com/jobs/view/3912345678/').join(','),'3912345678');
 assert.equal(ctx.relacionarMensagem('referência 3912345678',vagas2).id,'LI');
});
const vagas3=[{id:'WM',url:'https://x/jobs/9999991',empresa:'Webmotors — Data Analytics'},{id:'ST',url:'https://y/jobs/8888882',empresa:'Stefanini — Suporte'}];
test('casa por nome da empresa quando o código não resolve',()=>{
 assert.equal(ctx.relacionarMensagem('Olá! Novidade da Webmotors sobre sua candidatura',vagas3).id,'WM');
 assert.equal(ctx.relacionarMensagem('mensagem genérica sem empresa conhecida',vagas3),null);
});
test('duas vagas da mesma empresa não casam por nome (ambíguo)',()=>{
 const dup=[{id:'1',url:'u1',empresa:'BTG Pactual — A'},{id:'2',url:'u2',empresa:'BTG Pactual — B'}];
 assert.equal(ctx.relacionarMensagem('retorno do processo da BTG Pactual',dup),null);
});
test('entrevista agendada é distinta de convite',()=>{
 assert.equal(ctx.sinalDaMensagem('Sua entrevista foi agendada para amanhã'),'Conferir entrevista agendada');
 assert.equal(ctx.sinalDaMensagem('Gostaríamos de convidar você para uma entrevista'),'Conferir convite de entrevista');
});
test('banco de talentos e possível aprovação são sinalizados sem presumir contratação',()=>{
 assert.equal(ctx.sinalDaMensagem('Você entrou no nosso banco de talentos'),'Conferir banco de talentos');
 assert.equal(ctx.sinalDaMensagem('Parabéns, temos uma oferta de estágio para você'),'Revisar possível aprovação');
 // Aprovação + entrevista = dois sinais: cai para revisão, sem inventar etapa.
 assert.equal(ctx.sinalDaMensagem('Parabéns, aprovado! Veja os detalhes da entrevista.'),'Revisar mensagem de recrutamento');
});
