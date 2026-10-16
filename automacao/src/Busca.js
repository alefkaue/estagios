/** Robô de descoberta de vagas novas de estágio em TI.
 * Consulta boards públicos do Greenhouse de empresas-alvo e avisa no Telegram quando surge uma vaga nova.
 * Limitação honesta: cobre empresas que usam Greenhouse (ex.: BTG, C6). Portais Gupy/ATS próprios não têm API pública e continuam vindo pelo marcador do Gmail.
 */
var GREENHOUSE_API = 'https://boards-api.greenhouse.io/v1/boards/';
var EMPRESAS_PADRAO = 'btgpactual,c6bank,ebanx,quintoandar,nubank';

/** Decide se um título de vaga é estágio em TI (ou programa geral de estágio), excluindo áreas claramente não-TI. */
function vagaRelevante_(titulo) {
  const t = normalizar(titulo);
  if (!/estagi/.test(t)) return false;
  if (/juridic|contabil|auditoria|controles internos|marketing|comercial|vendas|\brh\b|recursos humanos|administrativ|equity|research|design|comunicac|facilities|logistic|suprimentos|fiscal|tribut/.test(t)) return false;
  const ehTI = /\bti\b|tecnologia|dados|\bdata\b|software|desenvolv|automa|analytics|sistemas|\bdev\b|backend|frontend|fullstack|cloud|infra|engenharia|intelig|\bia\b|cyber|seguranca/.test(t);
  const geral = /programa|20(2[6-9]|3\d)|pessoa estagiaria|banco de talentos|short job|ferias/.test(t);
  return ehTI || geral;
}
function corpoVagaNova_(v, planilhaId) {
  return '🆕 Vaga de estágio nova\n🏢 ' + v.titulo + '\n📍 ' + (v.local || 'Não divulgado') + '\n🔗 ' + v.link +
    '\n\nFonte: carreiras ' + v.slug + '. Confira requisitos e ano de formatura antes de se inscrever.';
}
function abaVistas_(ss) {
  let aba = ss.getSheetByName('_VagasVistas');
  if (!aba) { aba = ss.insertSheet('_VagasVistas'); aba.appendRow(['Fonte', 'ID', 'Título', 'Local', 'Link', 'Visto em']); aba.hideSheet(); }
  return aba;
}
/** Núcleo. alertar=false apenas registra as atuais (semeadura, sem avisar). */
function buscarVagasNovas_(alertar) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return { ignorado: 'Outra execução em andamento' };
  try {
    const p = PropertiesService.getScriptProperties();
    const id = p.getProperty('PLANILHA_ID');
    if (!id) throw new Error('Execute prepararEConferir primeiro.');
    const slugs = (p.getProperty('GREENHOUSE_EMPRESAS') || EMPRESAS_PADRAO).split(',').map(s => s.trim().toLowerCase()).filter(s => /^[a-z0-9_-]{2,40}$/.test(s));
    const ss = SpreadsheetApp.openById(id);
    const aba = abaVistas_(ss);
    const vistos = new Set(aba.getLastRow() > 1 ? aba.getRange(2, 2, aba.getLastRow() - 1, 1).getValues().flat().map(String) : []);
    const novas = [];
    for (const slug of slugs) {
      let resp;
      try { resp = UrlFetchApp.fetch(GREENHOUSE_API + encodeURIComponent(slug) + '/jobs', { muteHttpExceptions: true }); } catch (e) { continue; }
      if (resp.getResponseCode() !== 200) continue;
      let dados; try { dados = JSON.parse(resp.getContentText()); } catch (e) { continue; }
      (dados.jobs || []).forEach(j => {
        const chave = slug + ':' + j.id;
        if (vistos.has(chave)) return;
        if (!vagaRelevante_(j.title || '')) return;
        vistos.add(chave);
        novas.push({ id: chave, slug: slug, titulo: String(j.title || ''), local: (j.location && j.location.name) || '', link: j.absolute_url || '' });
      });
    }
    let enviadas = 0;
    const telegramOn = alertar && p.getProperty('AVISAR_TELEGRAM') === 'true';
    novas.forEach(v => {
      if (telegramOn && enviadas < 15) { try { enviarTelegram_(p, null, corpoVagaNova_(v, id)); enviadas++; } catch (e) {} }
      aba.appendRow(['Greenhouse', v.id, textoSeguroCelula(v.titulo), textoSeguroCelula(v.local), v.link, new Date()]);
    });
    const resumo = { empresas: slugs.length, novas: novas.length, avisadas: enviadas, modo: alertar ? 'com avisos' : 'semeadura (sem avisos)' };
    console.log(JSON.stringify(resumo));
    return resumo;
  } finally { lock.releaseLock(); }
}
function buscarVagasNovasAuto() { return buscarVagasNovas_(true); }

/** Semeia as vagas atuais sem avisar (para só receber as FUTURAS) e liga a verificação diária (~8h). */
function ativarBuscaAutomatica() {
  const r = buscarVagasNovas_(false);
  const anteriores = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'buscarVagasNovasAuto');
  if (!anteriores.length) ScriptApp.newTrigger('buscarVagasNovasAuto').timeBased().atHour(8).everyDays(1).inTimezone('America/Sao_Paulo').create();
  console.log('Busca diária de vagas habilitada (~8h). Semeadas ' + r.novas + ' vagas atuais; a partir de agora você só recebe as novas.');
  return r;
}
function desativarBuscaAutomatica() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'buscarVagasNovasAuto').forEach(t => ScriptApp.deleteTrigger(t));
}

if (typeof module !== 'undefined') module.exports = { vagaRelevante_ };
