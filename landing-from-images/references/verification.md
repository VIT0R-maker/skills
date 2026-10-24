# Verificação autônoma

## Evidências diferentes

Distinga quatro resultados: renderização/captura executada, testes funcionais,
comparação visual com referências do usuário e reconhecimento da skill pelo Codex.
Nenhum deles prova os outros. Registre comandos, ambiente, larguras, resultados,
correções e limitações em `.work/verification/review.md`.

O [kit Node](../tools/package.json) coleta evidências e verifica condições objetivas.
Ele não sabe se uma foto representa o assunto correto nem se a página reproduz
a referência. O agente deve abrir capturas e referências e concluir essa avaliação.

## Matriz e escala

Use a largura CSS da referência desktop, justificada no mapa de entrada; acrescente
uma largura intermediária (768 px como ponto inicial), 390 e 360 px. Ajuste a
intermediária se ela não exercitar uma transição do projeto. Investigue outras
larguras somente quando houver problema concreto.

Uma imagem de 2880 px pode corresponder a 1440 CSS px em escala 2. Confirme por
metadados, contexto ou hipótese registrada. A largura da imagem é um dado; o
viewport é uma decisão. Não use 1440 para todas as referências. Capturas divididas
podem ter áreas sobrepostas e deslocamentos verticais: compare seções equivalentes.

## Captura estável

Prepare dependências locais conforme o [README](../README.md). Antes de capturar:

1. Aguarde `document.fonts.ready`, confira fontes e erros de carregamento.
2. Carregue imagens lazy e percorra a página para acionar conteúdo abaixo da dobra.
3. Aguarde imagens e suas dimensões naturais, incluindo backgrounds relevantes.
4. Complete revelações e estabilize animações. Respeite o estado visual final sem
   usar CSS de teste para esconder um bug de conteúdo invisível.
5. Volte ao topo, remova hover acidental e capture página completa e regiões úteis.

O kit executa a preparação geral e gera relatório JSON. Confira backgrounds,
fontes específicas e componentes customizados no navegador quando não cobertos.
Não transforme timeout ou teste omitido em aprovação. Se uma ferramenta faltar,
use navegador conectado ou alternativa disponível e declare exatamente a cobertura.

## Comparação visual

Abra **referências do usuário e capturas do site**, no todo e em regiões:

| Aspecto | Critério |
| --- | --- |
| Estrutura | Seções na ordem correta, sem duplicações de recortes |
| Conteúdo | Copy preservada, lacunas declaradas, sem informação inventada |
| Composição | Proporções, alinhamentos e densidade coerentes |
| Tipografia | Família/peso justificados, quebras e entrelinhas próximas |
| Assets | Foto correta, assunto preservado e sem UI embutida no crop |
| Superfícies | Fundos, bordas, raios, sombras e espaços comparados |
| Mobile | Hierarquia preservada, legibilidade, navegação e áreas de toque |

Diferença de pixels é auxiliar: rasterização e antialiasing podem divergir.
Não altere referências, baselines ou tolerâncias para ocultar erro. Uma screenshot
produzida pelo site não é sua própria referência de fidelidade.

## Comportamento e movimento

Reabra uma página com `reducedMotion: 'no-preference'` e sem estilos de congelamento.
Siga também os casos de [movimento e menu](motion-and-menu.md).

- Menu: abertura e fechamento graduais, clique rápido/reversão, ícone e overlay,
  Escape, âncora, foco devolvido, `aria-expanded` e transição para desktop.
- Teclado: Tab/Shift+Tab, ordem de foco, foco visível, controle oculto fora do ciclo;
  modal contém foco, menu não modal não aprisiona foco indevidamente.
- Navegação: IDs de âncoras existentes, cabeçalho sem cobrir destino, CTAs corretos.
- Formulários: obrigatórios, formato, mensagens e estados de erro/sucesso reais.
  Intercepte integrações em teste; não envie mensagens ou dados a terceiros.
- Movimento reduzido: conteúdo imediatamente acessível, sem deslocamento forçado.
- Falha de JS/animação: conteúdo principal continua visível e navegável.
- Layout: nenhum overflow horizontal, controles obstruídos ou conteúdo sobreposto;
  diferencie sobreposições decorativas intencionais de colisões.
- Recursos: imagens carregadas, fontes corretas, sem erros relevantes de JS/rede.

O kit bloqueia requisições externas e métodos de envio. Seus resultados de rede
descrevem esse modo local; recursos externos bloqueados precisam de correção local
ou verificação adicional, não de supressão silenciosa. Ele não submete formulários
nem abre WhatsApp. Inspecione destinos sem executar ações comerciais reais.

Adapte seletores da configuração aos controles implementados. Um teste de menu
omitido por falta de seletor não é um menu aprovado. Acrescente testes do projeto
para lógica que o kit genérico não cobre, usando mocks locais quando necessário.

## Correção, aceite e entrega

Corrija primeiro estrutura/conteúdo, depois composição/fontes/assets, depois detalhes.
Repita as verificações afetadas. Encerre quando a comparação estiver satisfatória,
as larguras-alvo funcionarem, os controles previstos tiverem comportamento verificado
e não restarem erros relevantes. Registre limitações reais sem refinar indefinidamente.

Exemplo de relato: “Capturas a 1366, 768, 390 e 360 px; menu testado com movimento
e movimento reduzido; composição comparada às quatro referências. A fonte foi
aproximada e o CTA Agendar aguarda URL. Nenhum formulário foi enviado.”
