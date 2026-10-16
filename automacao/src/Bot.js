/** Lógica pura do bot: interpreta comandos e formata respostas.
 * Não conhece a API do Telegram nem escreve na planilha. Texto recebido é dado, nunca instrução.
 */
function normalizarBot_(t) {
  return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
function limitarTexto_(t, n) {
  const s = String(t == null ? '' : t);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function valorOuNaoDivulgado_(v) {
  const s = String(v == null ? '' : v).trim();
  return s ? s : 'Não divulgado';
}

/** Converte a mensagem do usuário em intenção. Comandos conhecidos ou busca por empresa. */
function interpretarComando(textoBruto) {
  const texto = String(textoBruto || '').trim();
  const norm = normalizarBot_(texto);
  if (!norm) return { comando: 'desconhecido', arg: '' };
  // Registro manual de etapa: "atualizar [a candidatura da] <empresa> para <status>".
  const mUpd = texto.match(/^\/?atualizar(?:\s+(?:a\s+)?candidatura)?(?:\s+d[ao]s?)?\s+(.+?)\s+(?:para|como)\s+(.+)$/i);
  if (mUpd) return { comando: 'atualizar', empresa: mUpd[1].trim(), status: mUpd[2].trim() };
  const primeira = norm.split(/\s+/)[0];
  const chave = primeira.startsWith('/') ? primeira : '/' + primeira;
  const temEspaco = /\s/.test(texto.trim());
  const arg = temEspaco ? texto.trim().slice(texto.trim().search(/\s/) + 1).trim() : '';
  const mapa = {
    '/start': 'inicio', '/inicio': 'inicio', '/ajuda': 'ajuda', '/help': 'ajuda',
    '/vagas': 'vagas', '/entrevistas': 'entrevistas', '/testes': 'testes', '/prazos': 'prazos',
    '/status': 'resumo', '/resumo': 'resumo', '/empresa': 'empresa', '/beneficios': 'beneficios'
  };
  if (mapa[chave]) return { comando: mapa[chave], arg };
  // Texto livre (sem barra) é tratado como busca por empresa.
  if (!texto.startsWith('/')) return { comando: 'empresa', arg: texto.trim() };
  return { comando: 'desconhecido', arg };
}

function ehEntrevista_(v) { return /entrevista/.test(normalizarBot_((v.proximaAcao || '') + ' ' + (v.situacao || ''))); }
function ehTeste_(v) { return /teste|avaliacao|assessment|desafio/.test(normalizarBot_((v.proximaAcao || '') + ' ' + (v.situacao || ''))); }
function ehInscrito_(v) { return v.inscrito === true || /^(sim|true|x|✓)$/i.test(String(v.inscrito || '').trim()); }

function textoInicio_() {
  return 'Assistente de candidaturas a estágio.\n\n' +
    'Acompanho seus processos seletivos a partir do Gmail e da sua planilha e aviso aqui as novidades. ' +
    'Nunca envio candidaturas nem respondo recrutadores por você.\n\n' +
    'Use /ajuda para ver os comandos.';
}
function textoAjuda_() {
  return 'Comandos disponíveis:\n' +
    '/vagas — listar candidaturas\n' +
    '/entrevistas — entrevistas identificadas\n' +
    '/testes — testes pendentes\n' +
    '/prazos — próximas datas importantes\n' +
    '/status — resumo dos processos\n' +
    '/resumo — resumo geral das candidaturas\n' +
    '/empresa <nome> — detalhes de uma vaga\n' +
    '/beneficios <nome> — benefícios de uma vaga\n' +
    '/ajuda — esta lista\n\n' +
    'Registro manual (pede confirmação antes de alterar a planilha):\n' +
    '"atualizar <empresa> para <status>"';
}
function linhaVaga_(v) {
  const marca = ehInscrito_(v) ? '✅' : '•';
  const sit = v.situacao ? ' — ' + limitarTexto_(v.situacao, 60) : '';
  return marca + ' ' + limitarTexto_(v.empresa, 80) + sit;
}
function listarVagas_(vagas) {
  if (!vagas.length) return 'Nenhuma candidatura cadastrada na planilha.';
  const linhas = vagas.slice(0, 50).map(linhaVaga_);
  const extra = vagas.length > 50 ? '\n… e mais ' + (vagas.length - 50) + '.' : '';
  return '📋 Candidaturas (' + vagas.length + '):\n' + linhas.join('\n') + extra;
}
function listarFiltro_(vagas, filtro, titulo, vazio) {
  const sel = vagas.filter(filtro);
  if (!sel.length) return vazio;
  return titulo + ' (' + sel.length + '):\n' + sel.slice(0, 50).map(v => {
    const acao = v.proximaAcao ? ' — ' + limitarTexto_(v.proximaAcao, 60) : '';
    return '• ' + limitarTexto_(v.empresa, 80) + acao;
  }).join('\n');
}
function listarPrazos_(vagas, hoje) {
  const comData = vagas.filter(v => v.prazo instanceof Date && !isNaN(v.prazo));
  comData.sort((a, b) => a.prazo - b.prazo);
  const ref = hoje instanceof Date ? hoje : new Date();
  const futuros = comData.filter(v => v.prazo >= new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()));
  if (!futuros.length) return '📅 Nenhum prazo com data registrada na planilha. Prazos costumam ficar nas notas das linhas.';
  return '📅 Próximas datas (' + futuros.length + '):\n' + futuros.slice(0, 30).map(v => {
    const d = v.prazo;
    const dd = ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
    return '• ' + dd + ' — ' + limitarTexto_(v.empresa, 70);
  }).join('\n');
}
function acharVagas_(vagas, termo) {
  const alvo = normalizarBot_(termo);
  if (!alvo) return [];
  return vagas.filter(v => normalizarBot_(v.empresa).indexOf(alvo) >= 0);
}
function detalheEmpresa_(vagas, termo) {
  if (!termo) return 'Informe o nome da empresa. Ex.: /empresa Webmotors';
  const achadas = acharVagas_(vagas, termo);
  if (!achadas.length) return 'Nenhuma candidatura encontrada para "' + limitarTexto_(termo, 60) + '".';
  if (achadas.length > 3) return 'Encontrei ' + achadas.length + ' candidaturas com "' + limitarTexto_(termo, 60) + '". Refine o nome.';
  return achadas.map(formatarVaga_).join('\n\n———\n\n');
}
function formatarVaga_(v) {
  const linhas = [
    '🏢 Empresa/vaga: ' + limitarTexto_(valorOuNaoDivulgado_(v.empresa), 120),
    '📍 Local/modelo: ' + valorOuNaoDivulgado_(v.localModelo),
    '💰 Bolsa anunciada: ' + valorOuNaoDivulgado_(v.bolsa),
    '🎁 Benefícios: ' + valorOuNaoDivulgado_(v.beneficios),
    '🕒 Jornada: ' + valorOuNaoDivulgado_(v.jornada),
    '📊 Situação: ' + valorOuNaoDivulgado_(v.situacao)
  ];
  if (v.proximaAcao) linhas.push('➡️ Próxima ação: ' + v.proximaAcao);
  if (v.prazo instanceof Date && !isNaN(v.prazo)) {
    const d = v.prazo;
    linhas.push('📅 Prazo: ' + ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear());
  }
  if (v.link) linhas.push('🔗 ' + v.link);
  linhas.push('Inscrito: ' + (ehInscrito_(v) ? 'sim' : 'não'));
  return linhas.join('\n');
}
function beneficiosEmpresa_(vagas, termo) {
  if (!termo) return 'Informe o nome da empresa. Ex.: /beneficios Webmotors';
  const achadas = acharVagas_(vagas, termo);
  if (!achadas.length) return 'Nenhuma candidatura encontrada para "' + limitarTexto_(termo, 60) + '".';
  if (achadas.length > 3) return 'Encontrei ' + achadas.length + ' candidaturas. Refine o nome.';
  return achadas.map(v => '🏢 ' + limitarTexto_(v.empresa, 90) + '\n🎁 ' + valorOuNaoDivulgado_(v.beneficios) +
    '\n💰 Bolsa anunciada: ' + valorOuNaoDivulgado_(v.bolsa)).join('\n\n');
}
function resumoTexto_(vagas, hoje) {
  const total = vagas.length;
  const inscritas = vagas.filter(ehInscrito_).length;
  const entrevistas = vagas.filter(ehEntrevista_).length;
  const testes = vagas.filter(ehTeste_).length;
  const revisar = vagas.filter(v => /revisar/i.test(v.proximaAcao || '')).length;
  const semRetorno = vagas.filter(v => ehInscrito_(v) && !v.proximaAcao).length;
  return '📊 Resumo das candidaturas\n' +
    '• Cadastradas: ' + total + '\n' +
    '• Inscrições marcadas: ' + inscritas + '\n' +
    '• Entrevistas identificadas: ' + entrevistas + '\n' +
    '• Testes pendentes: ' + testes + '\n' +
    '• A revisar: ' + revisar + '\n' +
    '• Inscritas sem retorno por e-mail: ' + semRetorno + '\n\n' +
    'Use /entrevistas, /testes, /prazos ou /empresa <nome> para detalhes.';
}

/** Monta a confirmação de um registro manual. Nunca altera nada aqui: só descreve o que seria alterado. */
function construirConfirmacao_(vagas, empresa, status) {
  const achadas = acharVagas_(vagas, empresa);
  if (!achadas.length) return { texto: 'Não encontrei candidatura com "' + limitarTexto_(empresa, 60) + '". Verifique o nome na planilha.' };
  if (achadas.length > 1) {
    return {
      texto: 'Encontrei ' + achadas.length + ' candidaturas com "' + limitarTexto_(empresa, 60) + '":\n' +
        achadas.slice(0, 10).map(v => '• ' + limitarTexto_(v.empresa, 90)).join('\n') +
        '\n\nRepita com um nome mais específico para eu confirmar a alteração.'
    };
  }
  const v = achadas[0];
  const statusLimpo = limitarTexto_(String(status || '').replace(/[\r\n\t]+/g, ' ').trim(), 120);
  if (!statusLimpo) return { texto: 'Diga para qual status devo atualizar. Ex.: "atualizar ' + limitarTexto_(v.empresa, 40) + ' para entrevista agendada".' };
  return {
    texto: 'Confirmar registro manual?\n\n🏢 ' + limitarTexto_(v.empresa, 100) +
      '\n📊 Situação atual: ' + valorOuNaoDivulgado_(v.situacao) +
      (v.proximaAcao ? '\n➡️ Próxima ação atual: ' + v.proximaAcao : '') +
      '\n\n✏️ Novo registro (Próxima ação): ' + statusLimpo +
      '\n\nO histórico antigo é preservado.',
    pendente: { id: v.id, empresa: v.empresa, status: statusLimpo },
    teclado: [[{ text: '✅ Confirmar', callback_data: 'confirmar' }, { text: '❌ Cancelar', callback_data: 'cancelar' }]]
  };
}

/** Despacha a intenção para a resposta. dados = { vagas, hoje }. */
function responderComando(inp, dados) {
  const vagas = (dados && dados.vagas) || [];
  const hoje = dados && dados.hoje;
  switch (inp.comando) {
    case 'inicio': return { texto: textoInicio_() };
    case 'ajuda': return { texto: textoAjuda_() };
    case 'vagas': return { texto: listarVagas_(vagas) };
    case 'entrevistas': return { texto: listarFiltro_(vagas, ehEntrevista_, '🎙️ Entrevistas', '🎙️ Nenhuma entrevista identificada ainda.') };
    case 'testes': return { texto: listarFiltro_(vagas, ehTeste_, '📝 Testes', '📝 Nenhum teste pendente identificado.') };
    case 'prazos': return { texto: listarPrazos_(vagas, hoje) };
    case 'resumo': return { texto: resumoTexto_(vagas, hoje) };
    case 'empresa': return { texto: detalheEmpresa_(vagas, inp.arg) };
    case 'beneficios': return { texto: beneficiosEmpresa_(vagas, inp.arg) };
    case 'atualizar': return construirConfirmacao_(vagas, inp.empresa, inp.status);
    default: return { texto: 'Não reconheci o comando. Use /ajuda para ver a lista.' };
  }
}

if (typeof module !== 'undefined') module.exports = {
  normalizarBot_, interpretarComando, responderComando, construirConfirmacao_,
  resumoTexto_, formatarVaga_, ehInscrito_, ehEntrevista_, ehTeste_, acharVagas_
};
