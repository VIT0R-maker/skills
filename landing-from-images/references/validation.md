# Verificação da entrega

Registro da implementação em 23–24 de outubro de 2026, em Windows, PowerShell,
Node.js 24.14.1 e npm 11.11.0. Não representa certificação de futuras landing pages.

## Estrutura da skill

- Validador `quick_validate.py` da skill `skill-creator`: aprovado.
- Os 16 links internos dos novos documentos foram conferidos e existem.
- Nome, pasta, `default_prompt` e ativação explícita coerentes.
- Revisão independente das instruções: sequência inferida para arquivos de câmera,
  desktop em escala 2, múltiplos recortes mobile, fotografia parcialmente encoberta
  e CTA sem destino tratados sem gates de design ou conteúdo comercial inventado.
- Dependências de desenvolvimento fixadas no lockfile; sem API de geração de imagem.
- Skills originais preservadas; README geral atualizado para incluir a variante.

## Instalador

`node --test landing-from-images/scripts/install.test.mjs`: **8 testes aprovados**,
sem falhas ou casos pulados, executados no Windows fora do sandbox restrito.
Cobertura: instalação isolada, atualização com backup íntegro, preservação de outras
skills, exclusão de dependências/segredos/capturas temporárias, caminhos com espaços,
destinos inadequados, locks e recusa de symlinks/junctions.

O sandbox inicialmente impediu operações de diretório e junctions; a execução com
permissão local confirmou esses casos. Nenhuma política PowerShell foi alterada.

## Auxiliares e navegador

Comandos executados dentro de `landing-from-images/tools`:

| Comando | Resultado |
| --- | --- |
| `npm.cmd test` | 2/2 testes aprovados: servidor e inventário/recortes |
| `npm.cmd run test:browser` | 3/3 testes aprovados: menu comum, modal e cenário negativo |
| `npm.cmd run verify:fixture` | Capturas e checks aprovados em 1200, 768, 390 e 360 px |
| `node --check verify.mjs` e `node --check serve.mjs` | Sintaxe válida |

O servidor foi testado com caminhos contendo espaços, traversal, junction externa,
métodos de escrita e host inválido. Inventário/recorte foram testados com orientação
EXIF, preservação de decisões e originais, rastreamento e recusa de ampliação.

O navegador confirmou carregamento lazy, regiões, foco, Escape, âncoras, movimento
reduzido, resize e reversão do menu durante transições. O modal usa abridor no fundo
inerte e fechamento interno. A reversão usa foco e Enter nativos, sem eventos
artificiais que contornem a possibilidade real de interação.

O cenário negativo confirmou que falhas de imagem, JavaScript, rede, âncora e
overflow são reportadas. Requisições externas e envios foram bloqueados.

O comando de fixture deixou 12 PNGs e `report.json` em `tools/.work/verification`,
fora do versionamento e da instalação. Foram abertas capturas desktop e mobile:
conteúdo abaixo da dobra e imagem lazy aparecem. O relatório registra
`automatedPassed: true` e `fidelityEstablished: false`, deliberadamente separados.

## Limites da evidência

O anexo fornecido contém requisitos textuais, sem referências visuais de landing
pages. Portanto, não foi executada reprodução de um projeto real do usuário nem
atestada fidelidade visual. As fixtures verificam o funcionamento das ferramentas.

O kit não prova qualidade estética, ausência de todas as colisões, correção de
informações comerciais ou funcionamento de integrações externas. Esses itens
exigem inspeção e testes específicos durante o uso da skill. Envios reais são
bloqueados nas verificações.

Validação do `SKILL.md` e cópia para a pasta pessoal não comprovam reconhecimento
no seletor do Codex. A invocação deve ser conferida no próximo turno; se necessário,
reinicie a aplicação, conforme a [documentação oficial](https://learn.chatgpt.com/docs/build-skills).
