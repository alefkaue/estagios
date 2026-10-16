/** Funções puras: textos recebidos são dados, nunca instruções a executar. */
function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function sinalDaMensagem(texto) {
  const t = normalizar(texto);
  // Mais de um sinal relevante ou negação exige revisão; nunca presume aprovação.
  if (/nao (?:foi |esta |esta sendo |sera )?(?:aprovad|selecionad|convidad)|nao avanc|nao seguiremos|encerramos|infelizmente nao/.test(t)) return 'Revisar retorno do processo';
  const sinais = [];
  // Entrevista agendada é mais específica que um convite; conta como um único sinal.
  if (/entrevista (?:foi )?(?:agendada|marcada|confirmada)|agendamos (?:a |sua )?entrevista|sua entrevista (?:esta |foi )?(?:marcada|confirmada|agendada)|horario (?:da|para a) entrevista|data (?:da|para a) entrevista/.test(t)) sinais.push('Conferir entrevista agendada');
  else if (/entrevista|entrevista digital|conversa com.*(?:rh|recrutador)/.test(t)) sinais.push('Conferir convite de entrevista');
  if (/teste|avaliacao|assessment|desafio tecnico|prova online/.test(t)) sinais.push('Conferir teste e prazo');
  if (/documentos|documentacao|comprovante|envio de documento/.test(t)) sinais.push('Conferir documentos solicitados');
  if (/inscricao (?:foi )?(?:recebida|concluida|confirmada)|candidatura (?:foi )?(?:recebida|concluida|confirmada)|recebemos sua (?:inscricao|candidatura)/.test(t)) sinais.push('Conferir confirmação de candidatura');
  if (/banco de talentos|cadastro reserva|base de talentos/.test(t)) sinais.push('Conferir banco de talentos');
  // Aprovação é apenas sinalizada para revisão; o sistema nunca presume contratação.
  if (/\bparabens\b|voce (?:foi |esta )?(?:aprovad|contratad)|aprovad[oa] (?:para|na)|selecionad[oa] para a (?:vaga|proxima etapa)|oferta de (?:estagio|trabalho)/.test(t)) sinais.push('Revisar possível aprovação');
  return sinais.length === 1 ? sinais[0] : 'Revisar mensagem de recrutamento';
}
function codigosDaVaga(url) {
  const s = String(url || '');
  const out = [];
  // Gupy /jobs/<id>, LinkedIn /jobs/view/<id>, Greenhouse gh_jid, Pandapé/InfoJobs /vaga(s)/<id>.
  const re = /(?:\/jobs\/(?:view\/)?|[?&](?:gh_jid|vacancy|idvacancy|id)=|\/vaga(?:s)?\/)(\d{7,12})(?:[/?&#]|$)/gi;
  let m;
  while ((m = re.exec(s))) out.push(m[1]);
  // InHire e afins usam UUID na URL da vaga.
  (s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || []).forEach(u => out.push(u.toLowerCase()));
  return out;
}
function nomeEmpresa_(empresa) {
  // Nome da empresa = trecho antes de — ou |, normalizado.
  return normalizar(String(empresa || '').split(/[—|]/)[0]).replace(/\s+/g, ' ').trim();
}
function relacionarMensagem(texto, vagas) {
  const t = String(texto || '');
  const codigos = new Set();
  (t.match(/\b\d{7,12}\b/g) || []).forEach(c => codigos.add(c));
  (t.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || []).forEach(c => codigos.add(c.toLowerCase()));
  const candidatas = vagas.filter(v => codigosDaVaga(v.url).some(c => codigos.has(String(c))));
  // 1º: código completo (alta confiança).
  if (candidatas.length === 1) return candidatas[0];
  if (candidatas.length > 1) return null;
  // 2º: nome da empresa, só quando identifica UMA vaga (evita ambiguidade).
  const tn = normalizar(t);
  const porEmpresa = vagas.filter(v => { const n = nomeEmpresa_(v.empresa); return n.length >= 4 && tn.indexOf(n) >= 0; });
  return porEmpresa.length === 1 ? porEmpresa[0] : null;
}
function textoSeguroCelula(texto) {
  const v = String(texto || '');
  return /^[=+@-]/.test(v) ? "'" + v : v;
}
function montarConsultaGmail_(marco, marcador) {
  const periodo=marco?'after:'+Math.floor((Number(marco)-48*3600000)/1000):'newer_than:14d';
  const nome=String(marcador||'').trim();
  if (/[\r\n\x00-\x1f]/.test(nome))throw new Error('Marcador Gmail inválido.');
  const filtro=nome?'label:"'+nome.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"':'{estágio estagio candidatura inscrição inscricao entrevista assessment recrutamento from:gupy.io from:greenhouse.io from:inhire.com.br}';
  return periodo+' -subject:"[Assistente Estagios]" '+filtro;
}
