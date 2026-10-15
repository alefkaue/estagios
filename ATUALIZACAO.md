# Atualização — 15/10/2026

## Interface simplificada

- Criada uma aba de uso diário com10colunas visíveis: Inscrito?,Prioridade,Empresa/vaga,Link,Bolsa,Benefícios,Local/modelo,Jornada,Currículo eSituação.
- Inscrição é marcada na própria linha, sem repetir preenchimento em outras abas.
- Na versão nativa do Google Planilhas, há caixas de seleção, destaque automático das linhas marcadas, cabeçalho/empresa congelados, filtros e visualizações prontas para não marcadas, home office e abertas com pendências.
- Pendências e prazos ficam em notas, sem colunas extensas de descrição. Valores desconhecidos permanecem vazios.
- As abas antigas foram preservadas e ocultadas na versão pessoal, com backup anterior à migração. O arquivo público tem somente uma aba. Anotações pessoais não são publicadas.

## Pesquisa e alterações

Preferência incorporada: bancos e empresas grandes primeiro, com destaque para XP,C6,BTG,Itaú e semelhantes; favorecer home office e híbrido dentro do grupo, sem descartar presencial. Empresas prioritárias com barreira ou encerramento não viram vagas elegíveis automaticamente.

Sete registros novos: três alvos com anúncios abertos e pendências, mais quatro registros excluídos das recomendações para evitar falsos positivos. Total:49registros,14abertos com pendências e35em monitoramento. Abertura do anúncio não comprova compatibilidade.

| Novo alvo | Resultado da checagem | Fonte |
|---|---|---|
| Impacta — EstagiárioTI | Anúncio específico publicado, sem aviso de encerramento; requisito a partir do1ºano. Prazo16/12. Bolsa/jornada/curso a confirmar. | [Vaga oficial](https://impacta.gupy.io/jobs/12671097) |
| Vieira Rezende — HelpDesk/Suporte | Anúncio específico e portal atual da empresa. Formatura dez/2027–dez/2028; experiência é diferencial. PresencialSP; bolsa/jornada a confirmar. Prazo29/11. | [Vaga oficial](https://vieirarezendeadv.gupy.io/jobs/12649735) |
| Peers — CDPeers2027.1 | Notícia oficial14/10 confirma inscrições até31/10 e trilhaDigital remota. **Pendente decisivo:** texto replicado da trilhaDigital pede bacharelado, enquanto notícia incluiADS; tecnólogo não foi confirmado. Jornada6h em fonte secundária; bolsa não divulgada. | [Notícia oficial](https://peers.com.br/programa-de-estagio-da-peers-abre-mais-de-20-vagas/), [ATS](https://peers.inhire.app/cd-peers-group/vagas/5b5198ce-8c1a-4501-a991-a893a0a68f9c/programa-de-estagio-cdpeers-group-20271), [descrição replicada](https://www.netvagas.com.br/empresa/anuncios/a2536392/programa-de-estagio-cdpeers-group-2027-1/) |
| Atlas Governance — GovernançaSI | HTML oficial mostra candidaturas encerradas; não recomendar como aberta apesar de divulgação secundária recente. | [Fonte oficial](https://atlas-governance.gupy.io/jobs/12323041) |
| Geopixel — Suporte/Manutenção | HTML oficial mostra candidaturas encerradas; anúncio secundário o apresentava como remoto. | [Fonte oficial](https://geopixel.gupy.io/jobs/12562834) |
| Serasa Experian — Programa2027 | Aberto até04/11; remoto/híbrido, bolsa inicialR$2.150. **Não recomendado para quem conclui em2027:** exige jul/2028–dez/2029. | [Critérios oficiais](https://www.serasaexperian.com.br/carreiras/blog-carreiras/estagiario-ti-sem-experiencia-serasa-experia/) |
| Braskem — Programa2027 | Programa com tecnologia/dados e bolsaR$2.200–R$2.800. **Não recomendado para quem conclui em2027:** exige jun/2028–dez/2029. | [Landing oficial](https://braskem.academiadouniversitario.com.br/) |

**C6Python:** requisição4733675005 passou a abrir o quadro geral e não foi localizada na API atual. Estado alterado para abertura a confirmar, sem presumir encerramento apenas por remoção. [Página](https://job-boards.greenhouse.io/c6bank/jobs/4733675005), [API oficial](https://boards-api.greenhouse.io/v1/boards/c6bank/jobs?content=true).

**C6Programa2027.1:** requisição permanece na página/API; continua pendente o conflito entre formatura do texto e opções do formulário. [Página](https://job-boards.greenhouse.io/c6bank/jobs/4739622005).

**VivoVitaSOC:** nova leitura indica prazo15/10, diferente da leitura inicial16/10; sem aviso de encerramento nesta resposta, mas com sinal conflitante anterior. Abertura mantida como inconclusiva e verificação urgente. [Fonte](https://vivovita.gupy.io/jobs/12480308).

Foram novamente consultados Stefanini,Helbor,Ecogen,AndradeGutierrez,B4A,GrupoSEB e os três códigosBTG na API atual. Outros registros mantêm suas datas de verificação anteriores; geração do arquivo não equivale a rechecagem de todos.

Outras pistas não incluídas como candidaturas: Rota dasOficinas4h tem página atualizada em2024, insuficiente para garantir abertura em2026; Omie/Oneflow exige Contabilidade/GestãoFinanceira; Enter exige bacharelado e inglês avançado/fluente. Não aumentar a contagem com essas incompatibilidades.

## Verificação e limites

IDs e URLs deduplicados; dados pessoais de acompanhamento excluídos da publicação; números desconhecidos vazios; XLSX com uma aba, filtros, validação e links; versão nativa conferida por releitura de células e estrutura da API. Sem inspeção visual do navegador autenticado neste ambiente. Nenhuma inscrição, e-mail ou mensagem a recrutador foi enviada; Gmail não foi consultado nesta atualização.

Para continuidade, a IA deve ler os arquivos públicos e a versão pessoal separadamente, preservar osIDs e marcar como inconclusivo qualquer acesso bloqueado ou fonte contraditória. Nunca publicar o estado privado integral, snapshots do Drive ou currículos.
