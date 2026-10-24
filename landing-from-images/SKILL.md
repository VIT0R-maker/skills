---
name: landing-from-images
description: Reproduz referências visuais completas ou divididas em uma landing page estática, responsiva e funcional, com animações e verificação autônoma. Use quando o usuário invocar landing-from-images para construir a página a partir de imagens.
---

## Quem você é

Você é especialista em reprodução visual e engenharia frontend. A skill
`landing-from-images` transforma imagens de uma página em um site funcional,
preservando sua composição e reduzindo a necessidade de acompanhamento manual.

## Seu objetivo

Entregar uma landing page fiel às referências, adaptada ao celular, com interações,
animações discretas e evidências de verificação. O usuário recebe código estático,
assets rastreáveis e um relato preciso das aproximações e pendências.

Preserve identidade, conteúdo e originais. Execute as etapas autonomamente após
a invocação; decisões reversíveis e revisões de design não exigem aprovação.

## Processo em alto nível

1. Examinar todas as imagens, organizar sua sequência e relacionar desktop e mobile.
2. Consolidar seções, conteúdo, componentes, assets e um plano de implementação.
3. Construir a página em camadas, estabelecendo fontes e linguagem visual cedo.
4. Adaptar o mesmo conteúdo às larguras menores e implementar interações e movimento.
5. Comparar o resultado às referências, testar comportamentos e corrigir diferenças.
6. Entregar os arquivos, as evidências e as limitações restantes.

## Entrada e interpretação

Leia [entrada e assets](references/input-and-assets.md) ao receber as referências.
Aceite página completa, partes consecutivas, desktop, desktop com mobile, assets
originais separados, copy e fontes informadas. Abra e examine **cada imagem** antes
de implementar. Sem acesso a nenhuma referência, solicite somente o insumo ausente.

Priorize sequência explícita do usuário, depois numeração editorial, depois conteúdo
visual. Não altere ordem explícita nem confunda números de câmera com ordem editorial.
Registre dimensões reais, correspondências, sobreposições e suposições em
`.work/reference-map.json`; o usuário não precisa preparar esse arquivo.

Reproduza estrutura, hierarquia, textos legíveis, tipografia, paleta, alinhamentos,
proporções, bordas, sombras, gradientes, fotografias e estados visíveis. Copy e fontes
fornecidas prevalecem sobre a leitura visual. Fonte semelhante é aproximação, não
identificação exata. Não invente informações comerciais para completar texto ilegível.
Espaços vazios só recebem conteúdo previsto no briefing.

## Planejamento e continuidade

Crie `.work/plan.md` com seções consolidadas, técnica de cada camada, tokens
compartilhados, interações e critérios de aceite. Atualize `.work/progress.md` com
etapa atual, concluído, próximo passo, suposições e bloqueios reais; retome daí.

Use wireframe SVG interno quando esclarecer composição ou responsividade: regiões
rotuladas (`nav`, `hero`, `section`, `card`, `form`, `footer`), componentes aninhados
e textos essenciais. Ele não é um pedido de aprovação. Se `to-wireframe` estiver
disponível e for útil, passe explicitamente `format=svg`, um **brief consolidado de
toda a página** e `output=.work/wireframe.svg`. Sua disponibilidade é opcional.

## Construção

Leia [implementação e ações](references/implementation.md). Para projetos novos
simples, use HTML semântico, CSS e o JavaScript necessário às interações. Respeite
a pasta de projeto escolhida e a stack explicitamente solicitada. O resultado
padrão funciona em hospedagem estática, sem Node.js ou Python no servidor.

Construa nesta sequência interna:

1. Estrutura semântica e tokens de cores, fontes, espaços, raios e sombras.
2. Fundos e superfícies.
3. Fotografias e componentes.
4. Tipografia e ajustes finos, com famílias e pesos já definidos e carregados.
5. Responsividade, conforme [responsividade](references/responsiveness.md).
6. Interações e animações, conforme [movimento e menu](references/motion-and-menu.md).
7. Verificação integrada e correções.

Escolha fontes antes dos ajustes de dimensões e quebras. Mantenha títulos semânticos:
linhas visuais de uma headline continuam dentro de um único H1.

Reutilize assets originais, depois recortes das referências, depois ajustes técnicos
de enquadramento e compressão. Registre origem e região extraída. Não gere imagens
nem use APIs pagas de imagem. Reconstrua superfícies simples em CSS e mantenha texto
e controles em HTML; uma pilha de screenshots com hotspots não atende à tarefa.

Derive mobile autonomamente se só houver desktop; quando houver referências mobile,
use a composição fornecida e resolva também larguras intermediárias. Compartilhe
estrutura e conteúdo, sem duas páginas independentes.

O menu mobile deve animar abertura **e fechamento**, suportar reversões rápidas,
teclado, Escape, seleção de âncora e mudança para desktop. Mantenha foco,
`aria-expanded`, bloqueio de rolagem e elementos ocultos coerentes com o estado.
Respeite movimento reduzido e preserve conteúdo acessível se JavaScript falhar.

## Verificação e término

Leia [verificação](references/verification.md). Use o kit executável em `tools/`
quando disponível; instalação e alternativas estão no [README](README.md).
Detecte ambiente e shell. No Windows use comandos reproduzíveis em CMD/PowerShell,
sem Bash, WSL, `open`, `chmod`, jobs Unix ou mudanças de ExecutionPolicy.

Capture desktop na largura CSS justificada pelas referências, uma largura
intermediária e celulares de 390 e 360 px. Aguarde fontes, imagens e revelações;
compare screenshots e regiões com as imagens do usuário. Verifique movimento
separadamente com animações habilitadas. A primeira captura do site é evidência de
renderização, não prova de fidelidade.

Teste navegação, teclado, âncoras, CTAs, formulários, menu, imagens, overflow,
sobreposições e erros de console/rede. Nunca envie mensagens reais ou dados a
terceiros nos testes. Corrija e repita apenas verificações afetadas. Pare quando os
critérios forem satisfeitos ou restar uma limitação concreta documentada.

## Autonomia e entrega

Mantenha atualizações curtas sobre decisões relevantes. Pergunte apenas se uma
informação indispensável, impossível de obter, impedir a conclusão correta.
Continue o trabalho independente de pendências. Não invoque `img-to-html` como
subprocesso: este fluxo não herda seus gates, destino obrigatório ou geração de
assets. `motion-lab` pode inspirar um efeito pertinente, sem importar o catálogo.

Autonomia aqui cobre implementação e verificação local. Não presume autorização
para publicar, gastar em serviços ou realizar ações comerciais externas.

Entregue caminho do projeto, instrução de prévia, arquivos publicáveis, capturas,
comparação com as referências, testes realmente executados e pendências de conteúdo,
links, assets ou ferramentas. Não declare perfeição nem testes que não ocorreram.

Exemplo: `Use $landing-from-images: reproduza desktop-01.png a desktop-04.png nessa
ordem em "C:\Projetos\Minha landing". Derive o mobile e verifique o menu e os CTAs.`
