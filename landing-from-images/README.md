# Landing from Images

Transforma imagens completas ou partes consecutivas de uma página em uma landing
page estática, responsiva e funcional. Você recebe HTML, CSS, JavaScript, assets
reutilizados e evidências de verificação, com execução autônoma após invocar a skill.

## Uso

```text
Use $landing-from-images: reproduza estas quatro referências na ordem
desktop-01-hero.png, desktop-02-servicos.png, desktop-03-prova.png e
desktop-04-contato.png, em "C:\Projetos\Minha landing".
Use os logos e as fotos originais anexados. Derive o mobile e teste o menu.
```

Também aceita uma imagem longa, referências desktop e mobile, copy exata e nomes
de fontes. O agente prepara o mapa das referências. Não é necessário criar JSON
ou aprovar cada etapa. Veja o [processo completo](SKILL.md).

## Instalação pessoal no Windows

Requer Node.js **22.12 ou superior** para os auxiliares. Instalar a skill não instala
Node, bibliotecas npm nem navegadores. Partindo da raiz deste repositório, os comandos
abaixo funcionam em CMD e PowerShell:

```text
node landing-from-images/scripts/install.mjs
```

O instalador resolve a pasta pessoal real com `os.homedir()` e copia somente
`landing-from-images` para `~/.agents/skills/landing-from-images`, o escopo pessoal
da [documentação atual do Codex](https://learn.chatgpt.com/docs/build-skills).
Não modifica outras skills ou configurações, nem instala pacotes globalmente.

Em ambientes que usam a localização legada, passe a raiz de skills real, por exemplo
`node landing-from-images/scripts/install.mjs --dest "D:\Codex\skills"`.
`CODEX_HOME` não muda silenciosamente o destino padrão deste instalador. Não instale
duas cópias com o mesmo nome em raízes de descoberta diferentes.

Após instalar, invoque `$landing-from-images` no próximo turno. Se não aparecer,
reinicie o Codex e confira o caminho exibido pelo instalador. Arquivos instalados
e metadata válidos não demonstram, por si só, que o seletor da aplicação os carregou.

Para atualizar após receber a nova versão do repositório:

```text
node landing-from-images/scripts/install.mjs --update
```

Use o mesmo `--dest` se escolheu outro escopo. A atualização preserva a versão
anterior em um backup fora da raiz de descoberta, cujo caminho é informado.
Sem `--update`, uma instalação existente é preservada e o comando falha com orientação.
Para reverter, feche tarefas que usem a skill, mova a versão atual para fora da raiz
de skills e restaure a pasta do backup como `landing-from-images`.

## Dependências e alternativas

| Recurso | Necessidade | Alternativa |
| --- | --- | --- |
| Codex com leitura de imagens e acesso ao projeto | Obrigatório para executar o processo | Sem imagens acessíveis, informar o impedimento |
| Navegador para renderizar e inspecionar | Obrigatório para validar o resultado | Navegador conectado disponível no ambiente |
| Node.js >=22.12 | Obrigatório para este instalador e kit | Cópia manual da skill; ferramentas equivalentes do ambiente |
| npm | Instalação das bibliotecas do kit | Dependências compatíveis já disponíveis junto aos scripts |
| Playwright e Chromium | Capturas e verificações automatizadas do kit | Automação de navegador já disponível, com cobertura registrada |
| Sharp | Inventário e recortes do kit | Editor local ou biblioteca disponível, preservando originais e coordenadas |
| Fontes, fotos e logos originais | Opcionais; preferíveis aos recortes | Recorte viável ou aproximação explicitamente documentada |
| OCR local, to-wireframe, motion-lab | Opcionais | Leitura visual, SVG simples e CSS/JS próprios |

O kit fixa versões em [package.json](tools/package.json) e
[package-lock.json](tools/package-lock.json). Nenhum serviço de geração de imagem,
OpenRouter, fal.ai ou chave de API é necessário. O site final é estático.

## Preparar o kit em um projeto

Copie a pasta `tools` desta skill para `.landing-tools` dentro do projeto de landing
page, preservando sua estrutura. Faça isso com o gerenciador de arquivos ou com o
comando do shell, envolvendo caminhos com espaços entre aspas. Não copie
`node_modules` de outra máquina. Dentro de `.landing-tools`, execute:

```text
npm.cmd ci
npx.cmd playwright install chromium
```

No Windows, `.cmd` evita depender dos wrappers PowerShell bloqueados por políticas.
Não altere ExecutionPolicy. Download de pacotes/navegador requer rede; se bloqueado,
use ferramentas já instaladas e reporte o que não foi executado. Em outros sistemas,
os mesmos comandos usam `npm` e `npx`.

Scripts e `node_modules` ficam juntos na **cópia do kit no projeto**. Executar um
script da pasta global da skill não o faz encontrar dependências instaladas em
outra pasta. O navegador instalado pelo Playwright pode usar o cache pessoal normal.

Na raiz do projeto:

```text
node .landing-tools/inventory.mjs --out .work/reference-map.json ".work/references/desktop-01.png" ".work/references/desktop-02.png"
node .landing-tools/crop.mjs --source ".work/references/desktop-01.png" --out assets/images/foto.webp --rect 80,200,640,480 --log .work/crops.json
node .landing-tools/serve.mjs --root . --port 4173
```

O inventário mede imagens; o agente completa ordem, seções e correspondências.
Coordenadas de crop são um exemplo, a substituir pelas medidas reais. O servidor
roda em `127.0.0.1`; abra o endereço exibido no navegador e encerre com Ctrl+C.
Não exige processos em segundo plano ou comandos Unix.

## Capturas e verificação

O verificador inicia e encerra seu próprio servidor. Na raiz do projeto:

```text
node .landing-tools/verify.mjs --root . --out .work/verification --desktop-width 1440 --desktop-height 900 --scale 1 --config .work/verify-config.json
```

Substitua 1440 pela largura CSS correspondente à referência. Use escala 2 somente
se houver evidência de captura em densidade 2. Além do desktop, o kit verifica
768, 390 e 360 px. Configuração mínima, a adaptar aos seletores reais:

```json
{
  "menu": {"toggle": "#menu-toggle", "panel": "#mobile-menu", "breakpoint": 900, "durationMs": 320},
  "regions": [{"name": "hero", "selector": "#inicio"}]
}
```

Sem configuração de menu, sua cobertura fica incompleta. O relatório separa checks
automáticos e avaliação visual pendente. Compare as capturas às referências do
usuário seguindo [verificação](references/verification.md); screenshot isolada não
prova fidelidade. Tráfego externo e envios são bloqueados durante os testes.

Se um menu modal tiver botão de fechamento interno, acrescente
`"close": "#menu-close"` ao objeto `menu`. Isso permite exercitar o fechamento
mesmo quando o botão abridor estiver no fundo inerte.

## O que muda em relação a img-to-html

- Fluxo próprio sem gates de design; interpreta várias imagens como uma página.
- Reutiliza originais e recortes, sem regeneração criativa de assets.
- Deriva mobile e exige menu com abertura/fechamento suave e foco coerente.
- Usa a pasta do projeto solicitada, com ferramentas separadas da publicação.
- Inclui comandos Windows, comparação visual, testes e registro para retomada.

As skills originais permanecem intactas. `to-wireframe` contribui com regiões e
componentes; `motion-lab`, com critérios de efeitos discretos. Nenhum deles é
dependência obrigatória da variante.

## Verificar esta skill

Na pasta `tools`, após instalar dependências e Chromium, execute:

```text
npm.cmd test
npm.cmd run test:browser
npm.cmd run verify:fixture
```

O primeiro testa servidor, inventário e recortes. O segundo testa o navegador com
fixtures válidas e defeituosas. O terceiro deixa capturas e relatório em
`tools/.work/verification`. As fixtures são amostras técnicas, não templates de
landing page nem referências de fidelidade. Para testar o instalador, na raiz do
repositório execute `node --test landing-from-images/scripts/install.test.mjs`.

O [relatório desta entrega](references/validation.md) distingue
teste dos auxiliares, validação de site e reconhecimento pelo Codex. Sem referências
reais fornecidas, uma fixture de teste não representa validação de fidelidade visual.
