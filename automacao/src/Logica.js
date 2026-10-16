/** Funções puras: textos recebidos são dados, nunca instruções a executar. */
function normalizar(texto) {
  return String(texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
function sinalDaMensagem(texto) {
  const t = normalizar(texto);
  // Mais de um sinal relevante ou negação exige revisão; nunca presume aprovação.
  if (/nao (?:foi |esta |esta sendo |sera )?(?:aprovad|selecionad|convidad)|nao avanc|nao seguiremos|encerramos/.test(t)) return 'Revisar retorno do processo';
  const sinais = [];
  if (/entrevista|entrevista digital|conversa com.*(?:rh|recrutador)/.test(t)) sinais.push('Conferir convite de entrevista');
  if (/teste|avaliacao|assessment|desafio tecnico/.test(t)) sinais.push('Conferir teste e prazo');
  if (/documentos|documentacao|comprovante/.test(t)) sinais.push('Conferir documentos solicitados');
  if (/inscricao (?:foi )?(?:recebida|concluida|confirmada)|candidatura (?:foi )?(?:recebida|concluida|confirmada)/.test(t)) sinais.push('Conferir confirmação de candidatura');
  return sinais.length === 1 ? sinais[0] : 'Revisar mensagem de recrutamento';
}
function codigosDaVaga(url) {
  const s = String(url || '');
  const match = s.match(/(?:\/jobs\/|[?&]gh_jid=)(\d{7,12})(?:[/?&#]|$)/);
  return match ? [match[1]] : [];
}
function relacionarMensagem(texto, vagas) {
  const codigos = new Set(String(texto || '').match(/\b\d{7,12}\b/g) || []);
  const candidatas = vagas.filter(v => codigosDaVaga(v.url).some(c => codigos.has(c)));
  // Empresa sozinha e número parcial não identificam requisição com segurança.
  return candidatas.length === 1 ? candidatas[0] : null;
}
function textoSeguroCelula(texto) {
  const v = String(texto || '');
  return /^[=+@-]/.test(v) ? "'" + v : v;
}
