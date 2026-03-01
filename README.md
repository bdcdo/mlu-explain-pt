![MLU-Explain Logo & Title](./assets/readme_header.png)

# MLU-Explain PT-BR

Tradução para o português brasileiro do [MLU-Explain](https://mlu-explain.github.io/), um projeto educacional da Amazon que ensina conceitos de aprendizado de máquina (machine learning) por meio de ensaios visuais interativos.

**Site:** [bdcdo.github.io/mlu-explain-pt](https://bdcdo.github.io/mlu-explain-pt/)

## Ordem de Leitura Sugerida

Os artigos estão organizados do mais fundamental ao mais avançado:

| # | Artigo | Pasta | Status | Descrição |
|---|--------|-------|--------|-----------|
| 1 | **Treino, Teste e Validação** | [train-test-validation](./train-test-validation/) | Traduzido | Conceito mais fundamental: como dividir seus dados |
| 2 | **Viés-Variância** | [bias-variance](./bias-variance/) | Original (EN) | Base teórica essencial: o tradeoff entre sub e sobreajuste |
| 3 | **Regressão Linear** | [code/linear-regression](./code/linear-regression/) | Original (EN) | Explicação visual e interativa de regressão linear |
| 4 | **Regressão Logística** | [code/logistic-regression](./code/logistic-regression/) | Original (EN) | Classificação binária com regressão logística |
| 5 | **Precisão e Revocação** | [precision-recall](./precision-recall/) | Original (EN) | Métricas de avaliação além da acurácia |
| 6 | **ROC e AUC** | [code/roc-auc](./code/roc-auc/) | Original (EN) | Curva ROC e Área Sob a Curva |
| 7 | **Árvore de Decisão** | [decision-tree](./decision-tree/) | Original (EN) | Primeiro modelo: como a árvore faz suas divisões |
| 8 | **Floresta Aleatória** | [random-forest](./random-forest/) | Original (EN) | Ensemble: combinando múltiplas árvores |
| 9 | **Validação Cruzada** | [code/cross-validation](./code/cross-validation/) | Original (EN) | Técnica para avaliar modelos com dados limitados |
| 10 | **Dupla Descida, Parte 1** | [double-descent](./double-descent/) | Original (EN) | Conceito avançado: o fenômeno da dupla descida |
| 11 | **Dupla Descida, Parte 2** | [double-descent2](./double-descent2/) | Original (EN) | Continuação: explicação matemática detalhada |
| 12 | **Redes Neurais** | [code/neural-networks](./code/neural-networks/) | Original (EN) | Introdução visual a redes neurais |
| 13 | **Aprendizado por Reforço** | [code/reinforcement-learning](./code/reinforcement-learning/) | Original (EN) | Fundamentos de aprendizado por reforço |
| 14 | **Igualdade de Probabilidades** | [code/equality-of-odds](./code/equality-of-odds/) | Original (EN) | Conceito de fairness em ML |

## Executando Localmente

Clone este repositório:

```bash
git clone https://github.com/bdcdo/mlu-explain-pt.git
```

Entre no diretório do código-fonte do artigo desejado e instale as dependências:

```bash
# exemplo: artigo treino, teste e validação
cd code/train-test-validation
npm install
```

Para executar em modo de desenvolvimento:

```bash
npm start
```

Para gerar os assets estáticos:

```bash
npm run build
cd dist/
python3 -m http.server
```

## Projeto Original

Este é um fork traduzido do [MLU-Explain](https://github.com/mlu-explain/mlu-explain.github.io), criado pela [Machine Learning University (MLU)](https://aws.amazon.com/machine-learning/mlu/) da Amazon.

Autores originais: Jared Wilber, Brent Werness, Erin Bugbee, Jenny Yeon, Lucia Santamaria.

## Licença

Conteúdo sob licença [Creative Commons Attribution-ShareAlike 4.0 International](LICENSE).
Código sob licença [MIT-0](LICENSE-SAMPLECODE).

## Direitos de Tradução

O projeto original é licenciado sob:

- **Conteúdo:** [Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0)](LICENSE) — A Seção 1(a) define "Adapted Material" como conteúdo "*translated*, altered, arranged, transformed, or otherwise modified". Traduções são explicitamente permitidas.
- **Código:** [MIT-0](LICENSE-SAMPLECODE) — Licença permissiva sem restrições.

Portanto, temos pleno direito de traduzir e redistribuir o conteúdo, desde que mantenhamos a atribuição ao projeto original e a mesma licença.
