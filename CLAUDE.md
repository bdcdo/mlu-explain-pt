# MLU-Explain PT-BR — Guia de Tradução

## Estrutura do Projeto

- `index.html` — Landing page (raiz)
- `code/<artigo>/` — Código-fonte de cada artigo (Parcel + D3 + Svelte/JS)
- `<artigo>/` — Versão buildada (o que o GitHub Pages serve)
- Build: `cd code/<artigo> && npm install && npm run build` (postbuild copia para raiz automaticamente)

## Checklist para Traduzir um Artigo

### 1. Arquivos a traduzir (dentro de `code/<artigo>/`)
- `index.html` — Todo o texto principal, títulos, parágrafos, navegação, botões
- `js/*.js` — Labels de gráficos D3, eixos, legendas, tooltips, textos de hull
- `src/components/*.svelte` — Textos em componentes interativos (se Svelte)
- `*.json` — Apenas labels que aparecem na UI (NÃO traduzir dados numéricos)

### 2. Ajustes Necessários (lições do train-test-validation)

#### `<html lang="pt-BR">`
Sempre atualizar a tag `<html>` para `lang="pt-BR"`.

#### Annotations (rough-notation) — `multiline: true`
O texto em português é **mais longo** que em inglês. As annotations do `rough-notation` que não tinham `multiline: true` ficaram cortadas/desalinhadas. **Sempre adicionar `multiline: true` a TODAS as annotations**, mesmo que o original não tenha.

#### Espaçamento entre seções (scrollytelling)
O texto em português é **~20-30% mais longo** que em inglês. Artigos com layout scrollytelling (seções com `height` fixa em `vh`) precisam de ajuste:
- **Aumentar `height` das seções em ~15-20%** nos arquivos SCSS/CSS (ex: `115vh` → `135vh`)
- **Ajustar `margin-bottom` proporcionalmente** em todos os breakpoints responsivos
- **Testar visualmente** scrollando todo o artigo, verificando que o texto não transborda e as transições entre seções funcionam

#### Separar valores de código vs. texto visível
Botões e selects têm `value` para uso em JS e texto visível para o usuário:
```html
<button value="weight">Peso</button>  <!-- value=código, texto=tradução -->
```
**Traduzir o texto visível, NUNCA o `value`**. Os values são usados em comparações no JS.

#### Labels de gráficos D3
Procurar em TODOS os `.js`:
- `.text("...")` — Textos de eixos, legendas, labels
- `fullname: "..."` — Nomes de grupos (Train → Treino, Test → Teste, etc.)
- Arrays de legendas — `["Train Error", "Test Error"]` → `["Erro de Treino", "Erro de Teste"]`
- Template literals com texto — `` `Majority Vote: ${x}` ``

#### Tabelas (Table.js)
- Traduzir `columnNames` (headers visíveis)
- Traduzir as **chaves** do `updatedRow` para corresponder aos novos `columnNames`
- **NÃO** alterar as chaves internas do objeto `performance` em Bubble.js (elas são usadas programaticamente)

#### Meta tags
Atualizar `<title>` e `<meta name="description">` para português.

#### Remover conteúdo promocional da Amazon/MLU
Ao traduzir, **sempre remover** as seções de "Thanks for reading!" / "Obrigado pela leitura!" que contêm links promocionais para:
- Cursos AWS MLU (aws.amazon.com/machine-learning/mlu/)
- Canal YouTube da MLU
- Livro Dive into Deep Learning (d2l.ai)
- Repositório GitHub aws-samples/aws-mlu-explain
- Twitter dos autores originais

Essas seções aparecem em `Conclusion.svelte`, `Resources.svelte`, ou diretamente no `index.html` no final do artigo. A licença CC-BY-SA 4.0 permite essa remoção (é Material Adaptado). A atribuição aos autores é mantida no README e nos arquivos de licença.

#### Landing page — Preservar estrutura HTML dos cards
Ao traduzir a landing page (`index.html` na raiz), **preservar a estrutura HTML completa** dos cards de artigos. Cada card DEVE manter:
```html
<div class="content">
  <h2 class="article-title">TÍTULO TRADUZIDO</h2>
  <p class="article-description">Descrição traduzida...</p>
  <button class="content-button"><a href="./artigo/">Explorar</a></button>
</div>
```
**NUNCA remover ou omitir o `<h2 class="article-title">`** — ele é o título visível do card. Traduzir apenas o texto, mantendo a tag e a classe.

Regra geral: ao traduzir qualquer arquivo HTML, **traduzir o conteúdo de texto, nunca remover elementos estruturais** (tags, classes, IDs). Comparar com o original se houver dúvida.

#### Créditos e atribuições
Ao traduzir, **preservar todos os créditos e atribuições** do artigo original. Verificar o site original (mlu-explain.github.io) para confirmar que nenhum crédito foi omitido. Traduzir o texto dos créditos para português.

### 3. Rebuild obrigatório
Após traduzir, **sempre** fazer rebuild:
```bash
cd code/<artigo>
npm install
npm run build
```
O `postbuild` copia automaticamente para `<artigo>/` na raiz.

### 4. Landing page
Ao traduzir um novo artigo, **atualizar o status no README.md** de "Original (EN)" para "Traduzido".

## Glossário de Tradução (ML PT-BR)

| Inglês | Português |
|--------|-----------|
| Training Set | Conjunto de Treino |
| Test Set | Conjunto de Teste |
| Validation Set | Conjunto de Validação |
| Overfitting | Sobreajuste (Overfitting) |
| Underfitting | Subajuste (Underfitting) |
| Bias | Viés |
| Variance | Variância |
| Decision Boundary | Fronteira de Decisão |
| Feature | Atributo |
| Label | Rótulo |
| Loss | Perda |
| Accuracy | Acurácia |
| Weight | Peso |
| Fluffiness | Fofura |
| Cat / Dog | Gato / Cão |
| Logistic Regression | Regressão Logística |
| Decision Tree | Árvore de Decisão |
| Random Forest | Floresta Aleatória |
| Precision | Precisão |
| Recall | Revocação |
| Dataset | Conjunto de dados |
| Prediction | Predição |
| Model | Modelo |
| Hyperparameter | Hiperparâmetro |

## Diretrizes de Tradução

1. **Termos técnicos:** Traduzir e manter o original entre parênteses na primeira ocorrência (ex: "sobreajuste (overfitting)")
2. **Siglas consolidadas:** Manter em inglês (ML, AI, ROC, AUC, KNN, LOESS)
3. **Nomes próprios:** Não traduzir
4. **Tom:** Didático e acessível
5. **Fórmulas e KaTeX:** Manter inalteradas
6. **Código e variáveis:** Não traduzir
7. **Links externos:** Manter os originais (são referências educacionais válidas)
