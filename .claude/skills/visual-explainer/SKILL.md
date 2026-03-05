---
name: visual-explainer
description: Use when creating interactive scrollytelling visual explanations for programming or technical concepts using D3.js and Svelte. Also use when the user mentions visual explainer, interactive tutorial, animated walkthrough, or scrollytelling article.
---

# Visual Explainer — Scrollytelling Interativo com D3.js

Cria artigos interativos de scrollytelling que explicam conceitos de programação (algoritmos, estruturas de dados, design patterns) através de visualizações D3.js animadas e narrativa controlada por scroll.

## Processo em 5 Passos

### Passo 1 — Decomposição do Conceito

ANTES de tocar em código, quebre o conceito em **4-8 estados visuais sequenciais**. Cada estado = um step de scroll.

Exemplo para Binary Search:
1. Array ordenado visível (estado inicial)
2. Ponteiros left/right/mid aparecem
3. Comparação com mid (highlight)
4. Metade eliminada (fade out)
5. Novos ponteiros (transição)
6. Segunda comparação
7. Elemento encontrado (destaque)
8. Comparação O(log n) vs O(n)

**Cada step DEVE ter uma mudança visual clara.** Se um step só muda texto, ele não é um step — é um parágrafo.

**Checkpoint humano (BLOQUEANTE):** Antes de implementar, APRESENTAR ao usuário:
- Lista dos 4-8 steps planejados com descrição de cada mudança visual
- Tipo de chart D3 escolhido (do Cookbook abaixo)
- Se é conteúdo **original** ou **traduzido** (PERGUNTAR se não souber)
- AGUARDAR aprovação explícita antes de prosseguir para o Passo 2

### Passo 2 — Escolha da Arquitetura

| Critério | Svelte + Rollup (padrão) | Parcel + vanilla JS |
|---|---|---|
| Múltiplas visualizações | Sim | Limitado |
| Interatividade complexa | Sim (stores reativos) | Manual |
| Estado compartilhado | `$: reativo` | Variáveis globais |
| Quando usar | Artigos com 2+ charts | Artigos simples, 1 chart |

**Svelte + Rollup** é o padrão. Use Parcel apenas para artigos com uma única visualização e pouco estado.

Templates disponíveis no repo MLU-Explain:
- **Svelte:** Copiar `code/starter-mlu-explain/`
- **Parcel:** Copiar `code/parcel-mlu-explain-starter/`

### Passo 3 — Cookbook de Visualização D3

Mapeamento: tipo de conceito -> pattern D3 recomendado.

| Tipo de conceito | Pattern D3 | Módulos |
|---|---|---|
| Operações em arrays/listas | Bar chart com band scales, transições de rects | d3-scale, d3-transition |
| Árvores (BST, heap) | d3-hierarchy + linkVertical | d3-hierarchy, d3-shape |
| Grafos (BFS, DFS, Dijkstra) | Force simulation com nodes/links | d3-force, d3-drag |
| Algoritmos de ordenação | Bar chart com animações de swap (attrTween) | d3-transition, d3-interpolate |
| Máquinas de estado | Diagrama node-link com estado ativo destacado | d3-selection, d3-force |
| Métricas/comparações | Line chart com curveMonotoneX | d3-shape, d3-scale |
| Classificação/conjuntos | Scatter plot com grupos coloridos + hulls | d3-polygon, d3-scale |
| Fluxo de dados/pipeline | Path strokes animados (stroke-dashoffset) | d3-shape, d3-transition |
| Superfícies de perda / otimização | Contour plot com `geoIdentity` | d3-contour, d3-geo, d3-scale-chromatic |
| Proporções / populações / Bayes | Waffle chart (grid de rects com transições de cor/posição) | d3-selection, d3-transition |
| Redes neurais / grafos em camadas | Layout manual com `layerX` + partículas animadas | d3-selection, d3-transition, d3-interpolate |

### Passo 4 — Implementação

#### Implementação Incremental com Review Visual (OBRIGATÓRIO)

Implementar em blocos com review visual via **Playwright MCP** entre cada bloco:

- **Bloco 1**: Estrutura + chart inicial -> `npm run dev` -> Playwright navega e tira screenshot -> mostrar ao usuário -> aguardar feedback
- **Bloco 2**: 2-3 steps por vez -> Playwright scroll + screenshot de cada step -> mostrar ao usuário -> aguardar feedback
- **Bloco 3**: Steps finais + conclusão -> Playwright screenshot -> mostrar ao usuário -> aguardar feedback
- Iterar até aprovação em cada bloco. NUNCA avançar sem aprovação.

**Procedimento Playwright para screenshots:**
1. `browser_navigate` para `http://localhost:5000` (ou porta do dev server)
2. `browser_take_screenshot` para capturar estado inicial
3. `browser_evaluate` com `window.scrollTo()` para scrollar até cada step
4. `browser_take_screenshot` em cada posição de scroll
5. `browser_resize` para 375x812 e repetir para verificar mobile

#### Opção A: Svelte Scrollytelling (PADRÃO)

**Componente Scrolly.svelte** — Copiar exatamente de `code/starter-mlu-explain/src/Components/Scrolly.svelte`:

```svelte
<script>
  import { onMount } from "svelte";
  export let root = null;
  export let top = 0;
  export let bottom = 0;
  export let increments = 100;
  export let value = undefined;

  const steps = [];
  const threshold = [];

  let nodes = [];
  let intersectionObservers = [];
  let container;

  $: top, bottom, update();

  const update = () => {
    if (!nodes.length) return;
    nodes.forEach(createObserver);
  };

  const mostInView = () => {
    let maxRatio = 0;
    let maxIndex = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i] > maxRatio) {
        maxRatio = steps[i];
        maxIndex = i;
      }
    }
    if (maxRatio > 0) value = maxIndex;
    else value = undefined;
  };

  const createObserver = (node, index) => {
    const handleIntersect = (e) => {
      const intersecting = e[0].isIntersecting;
      const ratio = e[0].intersectionRatio;
      steps[index] = ratio;
      mostInView();
    };

    const marginTop = top ? top * -1 : 0;
    const marginBottom = bottom ? bottom * -1 : 0;
    const rootMargin = `${marginTop}px 0px ${marginBottom}px 0px`;
    const options = { root, rootMargin, threshold };

    if (intersectionObservers[index]) intersectionObservers[index].disconnect();

    const io = new IntersectionObserver(handleIntersect, options);
    io.observe(node);
    intersectionObservers[index] = io;
  };

  onMount(() => {
    for (let i = 0; i < increments + 1; i++) {
      threshold.push(i / increments);
    }
    nodes = container.querySelectorAll(":scope > *");
    update();
  });
</script>

<div bind:this={container}>
  <slot />
</div>
```

**Componente de Scroll (ScrollSide.svelte)** — Pattern lateral com texto à esquerda, chart sticky à direita:

```svelte
<script>
  import Scrolly from "./Scrolly.svelte";
  import { onMount } from "svelte";

  // scroll iterator
  let value;

  // Steps como HTML strings
  $: steps = [
    `<h1 class='step-title'>Passo 1</h1>
     <p>Descrição do estado visual 1...</p>`,
    `<h1 class='step-title'>Passo 2</h1>
     <p>Descrição do estado visual 2...</p>`,
  ];

  // Mapeamento step -> ação D3
  const target2event = {
    0: () => { /* transição para estado 0 */ },
    1: () => { /* transição para estado 1 */ },
  };

  // Reatividade: dispara evento quando value muda
  $: if (typeof value !== "undefined") target2event[value]();
</script>

<section>
  <div class="section-container">
    <div class="steps-container">
      <Scrolly bind:value>
        {#each steps as text, i}
          <div class="step" class:active={value === i}>
            <div class="step-content">{@html text}</div>
          </div>
        {/each}
        <div class="spacer" />
      </Scrolly>
    </div>
    <div class="charts-container">
      <svg id="main-chart" />
    </div>
  </div>
</section>
```

#### Opção B: Parcel + Vanilla JS

```javascript
import { select, selectAll } from "d3-selection";

const sections = selectAll("section.scroll-step").nodes();

const target2event = {
  0: () => { /* transição para estado 0 */ },
  1: () => { /* transição para estado 1 */ },
};

const options = { threshold: 0.7 };

let observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const entryIndex = entry.target.getAttribute("data-index");
      if (entryIndex in target2event) {
        target2event[entryIndex]();
      }
    }
  });
}, options);

sections.forEach((section) => observer.observe(section));
```

### Passo 5 — Espaçamento de Scroll e Responsividade (CRITICO)

Este é o passo mais importante. Sem espaçamento correto, as animações são cortadas ou se sobrepõem.

**CSS obrigatório — Desktop (>950px):**

```css
.step {
  height: 110vh;                /* cada step > viewport inteira */
  display: flex;
  place-items: center;
  justify-content: center;
}

.spacer {
  height: 40vh;                 /* espaco final para ultima animacao completar */
}

.charts-container {
  position: sticky;
  top: 10%;
  height: 85vh;                 /* viz sempre visivel durante scroll */
}

.section-container {
  display: flex;                /* texto e chart lado a lado */
}

.steps-container {
  flex: 1 1 40%;
  z-index: 10;
}
```

**CSS obrigatório — Mobile (<=950px):**

```css
@media screen and (max-width: 950px) {
  .section-container {
    flex-direction: column-reverse;  /* viz em CIMA, texto embaixo */
  }

  .steps-container {
    pointer-events: none;            /* permite scroll through */
  }

  .charts-container {
    top: 7.5%;
    width: 95%;
    margin: auto;
  }

  .step {
    height: 130vh;                   /* MAIS espaco no mobile */
  }

  .step-content {
    width: 95%;
    max-width: 768px;
    font-size: 17px;
    line-height: 1.6;
  }

  .spacer {
    height: 100vh;                   /* spacer GENEROSO no mobile */
  }
}
```

**CSS para step ativo (feedback visual de qual step está em foco):**

```css
.step-content {
  font-size: 18px;
  background: var(--bg);
  color: #ccc;
  padding: 0.5rem 1rem;
  transition: background 500ms ease;
  text-align: left;
  width: 75%;
  margin: auto;
  max-width: 500px;
  line-height: 1.3;
  border: 5px solid var(--default);
}

.step.active .step-content {
  background: #f1f3f3ee;
  color: var(--squid-ink);
}
```

**Regras invioláveis de espaçamento:**
- `.step` NUNCA menos que `110vh` no desktop
- `.step` NUNCA menos que `130vh` no mobile
- `.spacer` DEVE existir apos o ultimo step (40vh desktop, 100vh mobile)
- `.charts-container` DEVE ser `position: sticky`
- Sem spacer = ultima animacao cortada. SEMPRE incluir.
- A distancia de scroll entre secoes e o que MAIS erra. Se as animacoes parecem pular, AUMENTE a height dos steps.

## Modo de Integracao

### No repo MLU-Explain
1. Copiar `code/starter-mlu-explain/` como template
2. **IMEDIATAMENTE** ajustar atribuição conforme tipo de conteúdo (ver seção "Atribuição e Autoria" abaixo). Não deixar para o final.
3. Atualizar `name` no `package.json`
4. Atualizar script `postbuild` para copiar para diretório correto:
   ```json
   "postbuild": "mkdir -p ../../nome-do-artigo && cp -r public/* ../../nome-do-artigo"
   ```
4. `npm install && npm run build`

### Standalone
Mesma estrutura, remover branding MLU, usar CSS próprio. Manter o pattern de scrollytelling intacto.

## Atribuição e Autoria

ANTES de começar qualquer artigo, **PERGUNTAR ao usuário**: "Este conteúdo é original ou é uma tradução/adaptação do MLU-Explain?"

### Conteúdo Original (criado do zero)
- **NÃO** mencionar MLU-Explain como fonte em nenhum lugar
- **NÃO** usar "MLU-Explain:" no título
- **NÃO** incluir "adaptado de", "traduzido de", ou "baseado em" MLU-Explain
- Usar logo/branding próprio ou genérico
- Footer sem referência ao MLU-Explain
- Créditos: apenas autor(es) real(is) do conteúdo

### Conteúdo Traduzido/Adaptado do MLU-Explain
- Manter atribuição CC BY-SA 4.0 ao MLU-Explain conforme regras do CLAUDE.md
- Incluir referência ao artigo original
- Seguir todas as regras de tradução do CLAUDE.md (glossário, remoção de conteúdo promocional, etc.)

### Checklist de Atribuição (verificar ANTES do build)
- [ ] Tipo de conteúdo (original/traduzido) está correto?
- [ ] Título NÃO contém "MLU-Explain:" se for conteúdo original?
- [ ] Footer NÃO menciona "adaptado/traduzido" se for conteúdo original?
- [ ] Créditos refletem os autores reais?
- [ ] Se traduzido: atribuição CC BY-SA 4.0 presente?

## Estrutura de Arquivos

### Svelte + Rollup
```
code/nome-artigo/
  package.json
  rollup.config.js
  public/
    index.html
    assets/styles/global.css
  src/
    main.js
    App.svelte
    Components/
      Scrolly.svelte          # copiar exatamente do starter
      ScrollSection.svelte     # seu scroll component
      Visualization.svelte     # chart D3
```

### Parcel + Vanilla JS
```
code/nome-artigo/
  package.json
  index.html
  js/
    index.js                   # scroll observers
    visualization.js           # classe D3
  assets/styles/
    global.scss
    scroll.scss
```

## Erros Comuns — NUNCA FACA ISSO

### 1. Redesenhar SVG ao inves de transicionar
ERRADO:
```javascript
// Recria todo o SVG a cada step
svg.selectAll("*").remove();
svg.selectAll("rect").data(data).enter().append("rect")...
```
CORRETO:
```javascript
// Transiciona elementos existentes
svg.selectAll("rect")
  .transition()
  .duration(600)
  .attr("fill", novasCores)
  .attr("y", novasPosicoes);
```
Cada step DEVE chamar `.transition().duration(600)`, NAO recriar elementos.
EXCEÇÃO: se o conteúdo visual muda COMPLETAMENTE entre steps (ex: gráfico de barras com
dados totalmente diferentes), recrear é aceitável. A regra aplica-se a elementos que
PERSISTEM entre steps.

### 2. Step sem espaco de scroll suficiente
ERRADO: `.step { height: 50vh; }` ou `.step { height: auto; }`
CORRETO: `.step { height: 110vh; }` (desktop) / `.step { height: 130vh; }` (mobile)
Sem altura suficiente, o IntersectionObserver dispara steps muito rapido e animacoes se sobrepõem.

### 3. Sem spacer no final
ERRADO: Steps terminam e a pagina acaba
CORRETO: `<div class="spacer" />` apos o ultimo step (40vh desktop, 100vh mobile)
Sem spacer, a ultima animacao e cortada porque o scroll acaba antes dela completar.

### 4. Visualizacao nao-sticky
ERRADO: `.charts-container { position: relative; }`
CORRETO: `.charts-container { position: sticky; top: 10%; height: 85vh; }`
Sem sticky, o chart rola junto com o texto e desaparece.

### 5. Misturar reatividade Svelte com D3 data joins
ERRADO: Criar elementos D3 dentro de blocos `{#each}` do Svelte
CORRETO: Inicializar D3 em `onMount`, usar `bind:this` para refs DOM:
```svelte
<script>
  import { onMount } from "svelte";
  let chartEl;
  onMount(() => {
    const svg = d3.select(chartEl).append("svg")...
  });
</script>
<div bind:this={chartEl} />
```

### 6. Transitions sem duration explicita
ERRADO: `.transition().attr("fill", "red")` — sem duracao, a transicao e instantanea
CORRETO: `.transition().duration(600).attr("fill", "red")`
SEMPRE especificar `.duration()` em TODA transicao D3.

### 7. Threshold unico no IntersectionObserver (Parcel)
ERRADO: `{ threshold: 0.5 }` — dispara uma vez, impreciso
CORRETO para Parcel: `{ threshold: 0.7 }` — threshold alto para evitar disparos prematuros
CORRETO para Svelte: Usar o componente `Scrolly.svelte` que ja cria 100 thresholds automaticamente

### 8. Esquecer column-reverse no mobile
ERRADO no mobile: texto em cima, chart embaixo (usuario nao ve o chart ao scrollar)
CORRETO: `flex-direction: column-reverse` — chart fica sticky em cima, texto sobe por baixo

### 9. Terser corrompe regex Unicode do KaTeX
O minificador terser pode corromper patterns regex com ranges Unicode (ex: [\u0300-\u036F])
do KaTeX, causando "Invalid regular expression" no browser.
SOLUÇÃO: Usar `terser({ ecma: 2015 })` no rollup.config.js. A opção `ecma: 2015`
preserva Unicode literals sem tentar reescrevê-los. NUNCA desativar terser inteiramente
(isso deixa o bundle sem minificação, ~3x maior).

### 10. Floating point exposto na UI
ERRADO: Exibir `P(+|¬D) = 0.050000000000000044` (artefato de IEEE 754)
CORRETO: Usar `d3-format` ou `.toFixed()` para TODOS os valores exibidos ao usuário.
SEMPRE formatar números antes de interpolar em strings de step.

### 11. Texto português sem acentos/diacríticos
ERRADO: "funcao de perda", "propagacao", "predicao", "conexao"
CORRETO: "função de perda", "propagação", "predição", "conexão"
TODO texto em português DEVE ter acentos corretos. Ao escrever steps, intro ou
conclusão, verificar CADA palavra contra ortografia PT-BR.
Palavras frequentes que DEVEM ter acento:
  função, propagação, predição, conexão, direção, ativação, atualização,
  iteração, conclusão, revolução, é (verbo ser), está, não, são, três,
  parâmetros, neurônios, cálculo, possível, mínimo, gráfico, épocas.
NUNCA gerar texto sem acentos — é o erro mais visível e prejudicial à qualidade.

### 12. Atribuição falsa em conteúdo original
ERRADO: Conteúdo criado do zero rotulado como "adaptado do MLU-Explain" ou com "MLU-Explain:" no título
CORRETO: Conteúdo original NÃO menciona MLU-Explain. Apenas conteúdo traduzido/adaptado inclui atribuição.
Atribuir falsamente um trabalho original a outra fonte é enganoso e prejudica a credibilidade.
SEMPRE verificar a checklist de atribuição (seção "Atribuição e Autoria") antes do build.

## Verificação

### Checklist Técnica
Antes de declarar o artigo pronto, verificar TODOS os itens:

1. `npm run dev` e scrollar pelo artigo completo
2. Verificar que CADA step trigger uma mudança visual distinta
3. Testar em viewport mobile (<=950px) — chart deve ficar sticky em cima
4. Verificar spacer: a última animação deve completar antes do conteúdo acabar
5. Verificar que nenhum step "pula" — scroll devagar entre cada step
6. Verificar que elementos D3 transicionam (não recriam) entre steps
7. Redimensionar a janela — layout deve adaptar sem quebrar
8. Verificar encoding: abrir no browser e confirmar que acentos (ç, ã, é) renderizam
   corretamente. Arquivos .svelte DEVEM estar em UTF-8.
9. Revisar TODOS os textos em português: verificar que NENHUMA palavra
   está sem acento. Buscar padrões comuns: "cao" (→ção), "sao" (→são),
   " e " como verbo ser (→é), "nao" (→não). Se encontrar UMA palavra
   sem acento, provavelmente há muitas — revisar TODO o texto.
10. Verificar atribuição: conferir checklist da seção "Atribuição e Autoria"

### Checkpoint Final com Screenshots (BLOQUEANTE)

**NUNCA declarar um artigo "pronto" sem aprovação visual explícita do usuário.**

Procedimento obrigatório usando Playwright MCP:
1. `browser_navigate` para o dev server (ex: `http://localhost:5000`)
2. `browser_take_screenshot` do estado inicial (hero/intro)
3. Para CADA step do scrollytelling:
   - `browser_evaluate` com `window.scrollTo(0, Y)` para posicionar no step
   - `browser_take_screenshot` capturando o estado visual do step
4. Mostrar TODAS as screenshots ao usuário
5. `browser_resize` para 375x812 (mobile) e repetir steps 2-4
6. Mostrar screenshots mobile ao usuário
7. **AGUARDAR aprovação explícita** antes de fazer build final

Se o usuário reportar problemas, corrigir e repetir o checkpoint.
Proibição: NUNCA dizer "o artigo está pronto" ou "tudo funcionando" sem ter passado por este checkpoint.
