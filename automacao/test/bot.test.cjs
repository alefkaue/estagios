const {test}=require('node:test');const assert=require('node:assert/strict');
const vm=require('node:vm');const fs=require('node:fs');const path=require('node:path');
const ctx=vm.createContext({Date});
vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/Bot.js'),'utf8'),ctx);

const vagas=[
 {empresa:'Webmotors — Data Analytics',inscrito:true,situacao:'Entrevista identificada',proximaAcao:'Conferir convite de entrevista',bolsa:'R$ 2.200',beneficios:'VR; VT',localModelo:'Vila Olímpia — SP | Híbrido',jornada:'6h',id:'W1',link:'https://vaga'},
 {empresa:'Stefanini',inscrito:false,situacao:'Aberta',proximaAcao:'',bolsa:'',beneficios:'',id:'S1'},
 {empresa:'BTG Pactual',inscrito:true,situacao:'Teste aplicado',proximaAcao:'Conferir teste e prazo',id:'B1'}
];

test('interpreta comandos conhecidos e texto livre',()=>{
 assert.equal(ctx.interpretarComando('/vagas').comando,'vagas');
 assert.equal(ctx.interpretarComando('/AJUDA').comando,'ajuda');
 const e=ctx.interpretarComando('/empresa Webmotors');assert.equal(e.comando,'empresa');assert.equal(e.arg,'Webmotors');
 assert.equal(ctx.interpretarComando('Stefanini').comando,'empresa');
 assert.equal(ctx.interpretarComando('').comando,'desconhecido');
});
test('interpreta registro manual preservando a grafia da empresa',()=>{
 const u=ctx.interpretarComando('atualizar candidatura da Webmotors para entrevista agendada');
 assert.equal(u.comando,'atualizar');assert.equal(u.empresa,'Webmotors');assert.equal(u.status,'entrevista agendada');
 const u2=ctx.interpretarComando('/atualizar BTG Pactual para teste concluído');
 assert.equal(u2.empresa,'BTG Pactual');assert.equal(u2.status,'teste concluído');
});
test('resumo conta categorias corretamente',()=>{
 const r=ctx.responderComando({comando:'resumo'},{vagas});
 assert.match(r.texto,/Cadastradas: 3/);assert.match(r.texto,/Inscrições marcadas: 2/);
 assert.match(r.texto,/Entrevistas identificadas: 1/);assert.match(r.texto,/Testes pendentes: 1/);
});
test('entrevistas e testes filtram pela situação/ação',()=>{
 assert.match(ctx.responderComando(ctx.interpretarComando('/entrevistas'),{vagas}).texto,/Webmotors/);
 assert.match(ctx.responderComando(ctx.interpretarComando('/testes'),{vagas}).texto,/BTG/);
});
test('detalhe de empresa mostra campos com rótulo e "Não divulgado"',()=>{
 const r=ctx.responderComando(ctx.interpretarComando('/empresa Stefanini'),{vagas});
 assert.match(r.texto,/Bolsa anunciada: Não divulgado/);assert.match(r.texto,/Situação: Aberta/);
});
test('confirmação de registro único traz teclado e pendente',()=>{
 const c=ctx.construirConfirmacao_(vagas,'Webmotors','entrevista agendada');
 assert.ok(c.teclado);assert.equal(c.pendente.id,'W1');assert.equal(c.pendente.status,'entrevista agendada');
 assert.match(c.texto,/Confirmar registro manual/);
});
test('empresa inexistente ou ambígua não gera pendência',()=>{
 const n=ctx.construirConfirmacao_(vagas,'Inexistente','x');assert.equal(n.pendente,undefined);assert.match(n.texto,/Não encontrei/);
 const amb=[{empresa:'Grupo Alfa',id:'1'},{empresa:'Grupo Beta',id:'2'}];
 const a=ctx.construirConfirmacao_(amb,'Grupo','entrevista');assert.equal(a.pendente,undefined);assert.match(a.texto,/nome mais específico/);
});
test('status com quebras de linha é higienizado',()=>{
 const c=ctx.construirConfirmacao_(vagas,'Webmotors','linha1\nlinha2\tinjeção');
 assert.ok(!/\n/.test(c.pendente.status.replace(/^.*Novo/,'')));assert.equal(c.pendente.status,'linha1 linha2 injeção');
});
