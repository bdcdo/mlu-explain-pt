<script>
  import Scrolly from "./Scrolly.svelte";
  import katexify from "../katexify";
  import { onMount } from "svelte";
  import { select } from "d3-selection";
  import "d3-transition";
  import { format } from "d3-format";

  // scroll iterator
  let value;

  // SVG dimensions
  const margin = { top: 30, right: 20, bottom: 10, left: 20 };
  let width = 0;
  let height = 0;

  // Grid config: 50 cols x 20 rows = 1000 people
  const COLS = 50;
  const ROWS = 20;
  const TOTAL = COLS * ROWS;

  // Disease parameters
  const PREVALENCE = 0.01; // 1%
  const SENSITIVITY = 0.99; // 99% (true positive rate)
  const SPECIFICITY = 0.95; // 95% (true negative rate)
  const FPR = 1 - SPECIFICITY; // 5% false positive rate

  const SICK = Math.round(TOTAL * PREVALENCE); // 10
  const HEALTHY = TOTAL - SICK; // 990
  const TRUE_POS = Math.round(SICK * SENSITIVITY); // ~10
  const FALSE_NEG = SICK - TRUE_POS; // ~0
  const FALSE_POS = Math.round(HEALTHY * FPR); // ~50
  const TRUE_NEG = HEALTHY - FALSE_POS; // ~940
  const TOTAL_POS = TRUE_POS + FALSE_POS; // ~60
  const POSTERIOR = TRUE_POS / TOTAL_POS; // ~16.7%

  // Second test parameters
  const SECOND_TRUE_POS = Math.round(TRUE_POS * SENSITIVITY);
  const SECOND_FALSE_POS = Math.round(FALSE_POS * FPR);
  const SECOND_TOTAL_POS = SECOND_TRUE_POS + SECOND_FALSE_POS;
  const SECOND_POSTERIOR = SECOND_TRUE_POS / SECOND_TOTAL_POS;

  const pctFormat = format(".1%");
  const pctFormatInt = format(".0%");

  // Generate population data
  let population = [];
  for (let i = 0; i < TOTAL; i++) {
    const row = Math.floor(i / COLS);
    const col = i % COLS;
    population.push({
      id: i,
      row: row,
      col: col,
      sick: i < SICK, // first SICK people are sick
      testPositive: false,
      truePositive: false,
      falsePositive: false,
      falseNegative: false,
      trueNegative: false,
      secondTestPositive: false,
    });
  }

  // Assign test results
  // Sick people: SENSITIVITY chance of testing positive
  let tpCount = 0;
  for (let i = 0; i < SICK; i++) {
    if (tpCount < TRUE_POS) {
      population[i].testPositive = true;
      population[i].truePositive = true;
      tpCount++;
    } else {
      population[i].falseNegative = true;
    }
  }

  // Healthy people: FPR chance of testing positive
  let fpCount = 0;
  for (let i = SICK; i < TOTAL; i++) {
    if (fpCount < FALSE_POS) {
      population[i].testPositive = true;
      population[i].falsePositive = true;
      fpCount++;
    } else {
      population[i].trueNegative = true;
    }
  }

  // Second test on positive people
  let stpCount = 0;
  let sfpCount = 0;
  for (let i = 0; i < TOTAL; i++) {
    if (population[i].truePositive) {
      if (stpCount < SECOND_TRUE_POS) {
        population[i].secondTestPositive = true;
        stpCount++;
      }
    }
    if (population[i].falsePositive) {
      if (sfpCount < SECOND_FALSE_POS) {
        population[i].secondTestPositive = true;
        sfpCount++;
      }
    }
  }

  // Colors
  const COLOR_NEUTRAL = "#c8d1db";
  const COLOR_SICK = "#e63946";
  const COLOR_HEALTHY = "#457b9d";
  const COLOR_TRUE_POS = "#e63946";
  const COLOR_FALSE_POS = "#f4a261";
  const COLOR_TRUE_NEG = "#457b9d";
  const COLOR_FALSE_NEG = "#a8dadc";
  const COLOR_DIMMED = "#e8ecf0";
  const COLOR_SECOND_POS = "#2a9d8f";

  // Paragraph text for each step
  $: steps = [
    `<h1 class='step-title'>A Populacao</h1>
     <p>Imagine uma populacao de <strong>1.000 pessoas</strong>. Cada quadrado
     representa uma pessoa. Vamos investigar o que acontece quando aplicamos
     um teste medico para detectar uma doenca rara.</p>`,

    `<h1 class='step-title'>A Priori: P(D) = 1%</h1>
     <p>A doenca afeta <strong>1% da populacao</strong>. Isso significa que,
     das 1.000 pessoas, apenas <strong>${SICK} estao doentes</strong>
     <span style="color:${COLOR_SICK}; font-weight:bold;">(vermelho)</span>
     e <strong>${HEALTHY} estao saudaveis</strong>
     <span style="color:${COLOR_HEALTHY}; font-weight:bold;">(azul)</span>.</p>
     <p>Essa e a <em>probabilidade a priori</em> (prior):
     ${katexify("P(D) = " + PREVALENCE)}</p>`,

    `<h1 class='step-title'>Sensibilidade: 99%</h1>
     <p>O teste tem <strong>sensibilidade de 99%</strong>: se voce esta doente,
     o teste detecta corretamente em 99% dos casos.</p>
     <p>Dos <strong>${SICK} doentes</strong>, <strong>${TRUE_POS} testam positivo</strong>
     <span style="color:${COLOR_TRUE_POS}; font-weight:bold;">(verdadeiros positivos)</span>.
     ${FALSE_NEG > 0 ? `Apenas ${FALSE_NEG} doente(s) escapa(m) da deteccao.` : "Nenhum doente escapa da deteccao."}</p>
     <p>${katexify("P(+|D) = " + SENSITIVITY)}</p>`,

    `<h1 class='step-title'>Falsos Positivos: 5%</h1>
     <p>Mas o teste nao e perfeito. Ele tem uma <strong>taxa de falsos positivos de 5%</strong>
     (especificidade de 95%).</p>
     <p>Dos <strong>${HEALTHY} saudaveis</strong>, <strong>${FALSE_POS} testam positivo
     falsamente</strong>
     <span style="color:${COLOR_FALSE_POS}; font-weight:bold;">(falsos positivos)</span>.
     E aqui que a surpresa comeca!</p>
     <p>${katexify("P(+|\\neg D) = " + FPR)}</p>`,

    `<h1 class='step-title'>O Resultado Contra-Intuitivo</h1>
     <p>Total de resultados positivos: <strong>${TRUE_POS} + ${FALSE_POS} = ${TOTAL_POS}</strong>.</p>
     <p>Dos ${TOTAL_POS} que testaram positivo, apenas
     <strong style="color:${COLOR_TRUE_POS};">${TRUE_POS}</strong> realmente tem a doenca.
     Os outros <strong style="color:${COLOR_FALSE_POS};">${FALSE_POS}</strong> sao alarmes falsos!</p>
     <p><strong style="font-size: 1.2em;">Apenas ${pctFormat(POSTERIOR)} dos positivos
     realmente estao doentes!</strong></p>
     <p>Voce testou positivo, mas a chance de realmente estar doente e de apenas 1 em 6.</p>`,

    `<h1 class='step-title'>A Formula de Bayes</h1>
     <p>O Teorema de Bayes formaliza esse calculo:</p>
     <p style="text-align:center;">${katexify("P(D|+) = \\frac{P(+|D) \\cdot P(D)}{P(+)}", true)}</p>
     <p style="text-align:center;">${katexify("= \\frac{" + SENSITIVITY + " \\times " + PREVALENCE + "}{" + SENSITIVITY + " \\times " + PREVALENCE + " + " + FPR + " \\times " + (1 - PREVALENCE).toFixed(2) + "}", true)}</p>
     <p style="text-align:center;">${katexify("= \\frac{" + (SENSITIVITY * PREVALENCE).toFixed(4) + "}{" + (SENSITIVITY * PREVALENCE + FPR * (1 - PREVALENCE)).toFixed(4) + "} \\approx " + pctFormat(POSTERIOR), true)}</p>
     <p>A <em>prior baixa</em> (doenca rara) "domina" o calculo, mesmo com um teste excelente.</p>`,

    `<h1 class='step-title'>Atualizacao: Segundo Teste</h1>
     <p>Se re-testarmos apenas os <strong>${TOTAL_POS} positivos</strong>, a <em>nova priori</em>
     agora e ${pctFormat(POSTERIOR)} (muito maior que os ${pctFormatInt(PREVALENCE)} iniciais!).</p>
     <p>Resultado do segundo teste: <strong style="color:${COLOR_SECOND_POS};">${SECOND_TRUE_POS} verdadeiros positivos</strong>
     e apenas <strong>${SECOND_FALSE_POS} falsos positivos</strong>.</p>
     <p><strong style="font-size: 1.2em;">Agora ${pctFormat(SECOND_POSTERIOR)} dos positivos
     realmente estao doentes!</strong></p>
     <p>Assim funciona a atualizacao bayesiana: cada nova evidencia refina nossa crenca.</p>`,
  ];

  // Event handlers for each step
  const target2event = {
    0: () => drawStep0(),
    1: () => drawStep1(),
    2: () => drawStep2(),
    3: () => drawStep3(),
    4: () => drawStep4(),
    5: () => drawStep5(),
    6: () => drawStep6(),
  };

  $: if (typeof value !== "undefined") target2event[value]();

  // D3 drawing functions
  let svgEl;
  let barSvgEl;
  let cellSize = 8;
  let cellPad = 1;
  let initialized = false;

  function computeDimensions() {
    if (!svgEl) return;
    const container = svgEl.parentNode;
    width = container.clientWidth;
    // Height proportional to grid
    const availW = width - margin.left - margin.right;
    cellSize = Math.max(2, Math.floor((availW - (COLS - 1) * cellPad) / COLS));
    const gridH = ROWS * (cellSize + cellPad);
    height = gridH + margin.top + margin.bottom + 10;
  }

  function initChart() {
    if (!svgEl || initialized) return;
    computeDimensions();

    const svg = select(svgEl)
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("class", "waffle-group")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create cells
    g.selectAll("rect.cell")
      .data(population, d => d.id)
      .enter()
      .append("rect")
      .attr("class", "cell")
      .attr("x", d => d.col * (cellSize + cellPad))
      .attr("y", d => d.row * (cellSize + cellPad))
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("rx", 1)
      .attr("fill", COLOR_NEUTRAL)
      .attr("stroke", "none")
      .attr("opacity", 1);

    // Label group
    svg.append("g").attr("class", "label-group");

    initialized = true;
  }

  function initBarChart() {
    if (!barSvgEl) return;
    const container = barSvgEl.parentNode;
    const bw = container.clientWidth;
    const bh = 160;

    select(barSvgEl)
      .attr("width", bw)
      .attr("height", bh);

    select(barSvgEl).append("g").attr("class", "bar-group");
  }

  function drawStep0() {
    if (!svgEl || !initialized) return;
    const svg = select(svgEl);
    const g = svg.select("g.waffle-group");

    // Reset all to neutral grid
    g.selectAll("rect.cell")
      .transition()
      .duration(600)
      .attr("x", d => d.col * (cellSize + cellPad))
      .attr("y", d => d.row * (cellSize + cellPad))
      .attr("fill", COLOR_NEUTRAL)
      .attr("opacity", 1)
      .attr("width", cellSize)
      .attr("height", cellSize);

    // Clear labels
    svg.select("g.label-group").selectAll("*").remove();

    // Clear bar chart
    if (barSvgEl) {
      select(barSvgEl).select("g.bar-group").selectAll("*")
        .transition().duration(400).attr("opacity", 0).remove();
    }
  }

  function drawStep1() {
    if (!svgEl || !initialized) return;
    const svg = select(svgEl);
    const g = svg.select("g.waffle-group");

    // Color sick vs healthy
    g.selectAll("rect.cell")
      .transition()
      .duration(600)
      .attr("x", d => d.col * (cellSize + cellPad))
      .attr("y", d => d.row * (cellSize + cellPad))
      .attr("fill", d => d.sick ? COLOR_SICK : COLOR_HEALTHY)
      .attr("opacity", 1)
      .attr("width", cellSize)
      .attr("height", cellSize);

    // Draw prior bar
    drawPriorBar();
  }

  function drawStep2() {
    if (!svgEl || !initialized) return;
    const svg = select(svgEl);
    const g = svg.select("g.waffle-group");

    // Sick people who test positive = bright red, others dimmed
    g.selectAll("rect.cell")
      .transition()
      .duration(600)
      .attr("x", d => d.col * (cellSize + cellPad))
      .attr("y", d => d.row * (cellSize + cellPad))
      .attr("fill", d => {
        if (d.truePositive) return COLOR_TRUE_POS;
        if (d.falseNegative) return COLOR_FALSE_NEG;
        return COLOR_DIMMED;
      })
      .attr("opacity", d => {
        if (d.sick) return 1;
        return 0.4;
      })
      .attr("width", cellSize)
      .attr("height", cellSize);

    drawSensitivityBar();
  }

  function drawStep3() {
    if (!svgEl || !initialized) return;
    const svg = select(svgEl);
    const g = svg.select("g.waffle-group");

    // Show false positives among healthy
    g.selectAll("rect.cell")
      .transition()
      .duration(600)
      .attr("x", d => d.col * (cellSize + cellPad))
      .attr("y", d => d.row * (cellSize + cellPad))
      .attr("fill", d => {
        if (d.truePositive) return COLOR_TRUE_POS;
        if (d.falseNegative) return COLOR_FALSE_NEG;
        if (d.falsePositive) return COLOR_FALSE_POS;
        if (d.trueNegative) return COLOR_TRUE_NEG;
        return COLOR_NEUTRAL;
      })
      .attr("opacity", d => {
        if (d.testPositive) return 1;
        return 0.35;
      })
      .attr("width", cellSize)
      .attr("height", cellSize);

    drawFalsePositiveBar();
  }

  function computeGroupedPositions() {
    const positives = population.filter(d => d.testPositive);
    const negatives = population.filter(d => !d.testPositive);
    positives.sort((a, b) => (b.truePositive ? 1 : 0) - (a.truePositive ? 1 : 0));

    const posCols = 12;
    const gapCols = 2;
    const negStartCol = posCols + gapCols;
    const negCols = COLS - negStartCol;

    positives.forEach((d, i) => {
      d._gx = (i % posCols) * (cellSize + cellPad);
      d._gy = Math.floor(i / posCols) * (cellSize + cellPad);
    });

    negatives.forEach((d, i) => {
      d._gx = (negStartCol + (i % negCols)) * (cellSize + cellPad);
      d._gy = Math.floor(i / negCols) * (cellSize + cellPad);
    });
  }

  function drawStep4() {
    if (!svgEl || !initialized) return;
    const svg = select(svgEl);
    const g = svg.select("g.waffle-group");

    computeGroupedPositions();

    g.selectAll("rect.cell")
      .transition()
      .duration(800)
      .attr("x", d => d._gx)
      .attr("y", d => d._gy)
      .attr("fill", d => {
        if (d.truePositive) return COLOR_TRUE_POS;
        if (d.falsePositive) return COLOR_FALSE_POS;
        return COLOR_DIMMED;
      })
      .attr("opacity", d => d.testPositive ? 1 : 0.2)
      .attr("width", cellSize)
      .attr("height", cellSize);

    drawPosteriorBar();
  }

  function drawStep5() {
    if (!svgEl || !initialized) return;

    // Same layout as step 4, but add formula emphasis
    drawStep4Layout();
    drawFormulaBar();
  }

  function drawStep4Layout() {
    if (!svgEl || !initialized) return;
    const svg = select(svgEl);
    const g = svg.select("g.waffle-group");

    computeGroupedPositions();

    g.selectAll("rect.cell")
      .transition()
      .duration(600)
      .attr("x", d => d._gx)
      .attr("y", d => d._gy)
      .attr("fill", d => {
        if (d.truePositive) return COLOR_TRUE_POS;
        if (d.falsePositive) return COLOR_FALSE_POS;
        return COLOR_DIMMED;
      })
      .attr("opacity", d => d.testPositive ? 1 : 0.2)
      .attr("width", cellSize)
      .attr("height", cellSize);
  }

  function drawStep6() {
    if (!svgEl || !initialized) return;
    const svg = select(svgEl);
    const g = svg.select("g.waffle-group");

    computeGroupedPositions();

    // Fade out negatives entirely, show only positives
    g.selectAll("rect.cell")
      .transition()
      .duration(600)
      .attr("x", d => d._gx)
      .attr("y", d => d._gy)
      .attr("fill", d => {
        if (!d.testPositive) return COLOR_DIMMED;
        if (d.secondTestPositive && d.truePositive) return COLOR_SECOND_POS;
        if (d.secondTestPositive && d.falsePositive) return COLOR_FALSE_POS;
        if (d.truePositive) return COLOR_TRUE_POS;
        return COLOR_DIMMED;
      })
      .attr("opacity", d => {
        if (!d.testPositive) return 0.08;
        if (d.secondTestPositive) return 1;
        return 0.3;
      })
      .attr("width", cellSize)
      .attr("height", cellSize);

    drawSecondTestBar();
  }

  // Bar chart drawing functions
  function drawPriorBar() {
    if (!barSvgEl) return;
    const bsvg = select(barSvgEl);
    const bg = bsvg.select("g.bar-group");
    bg.selectAll("*").remove();

    const bw = parseInt(bsvg.attr("width")) || 300;
    const barW = bw - 40;
    const barH = 28;
    const startY = 20;

    // Title
    bg.append("text")
      .attr("x", 20)
      .attr("y", startY)
      .attr("font-family", "var(--font-heavy)")
      .attr("font-size", "13px")
      .attr("fill", "#333")
      .text("Probabilidade a Priori: P(D)");

    // Background bar
    bg.append("rect")
      .attr("x", 20).attr("y", startY + 8)
      .attr("width", barW).attr("height", barH)
      .attr("fill", COLOR_HEALTHY).attr("rx", 3);

    // Sick portion
    bg.append("rect")
      .attr("x", 20).attr("y", startY + 8)
      .attr("width", 0).attr("height", barH)
      .attr("fill", COLOR_SICK).attr("rx", 3)
      .transition().duration(600)
      .attr("width", Math.max(3, barW * PREVALENCE));

    // Label
    bg.append("text")
      .attr("x", 20 + barW * PREVALENCE + 6)
      .attr("y", startY + 8 + barH / 2 + 4)
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text(`${SICK} doentes (${pctFormatInt(PREVALENCE)})`);

    // Legend
    drawLegend(bg, startY + barH + 30, [
      { color: COLOR_SICK, label: `Doentes (${SICK})` },
      { color: COLOR_HEALTHY, label: `Saudaveis (${HEALTHY})` },
    ]);
  }

  function drawSensitivityBar() {
    if (!barSvgEl) return;
    const bsvg = select(barSvgEl);
    const bg = bsvg.select("g.bar-group");
    bg.selectAll("*").remove();

    const bw = parseInt(bsvg.attr("width")) || 300;
    const barW = bw - 40;
    const barH = 28;
    const startY = 20;

    bg.append("text")
      .attr("x", 20).attr("y", startY)
      .attr("font-family", "var(--font-heavy)")
      .attr("font-size", "13px")
      .attr("fill", "#333")
      .text("Dos " + SICK + " doentes:");

    // Bar showing TP vs FN
    bg.append("rect")
      .attr("x", 20).attr("y", startY + 8)
      .attr("width", barW).attr("height", barH)
      .attr("fill", COLOR_FALSE_NEG).attr("rx", 3);

    bg.append("rect")
      .attr("x", 20).attr("y", startY + 8)
      .attr("width", 0).attr("height", barH)
      .attr("fill", COLOR_TRUE_POS).attr("rx", 3)
      .transition().duration(600)
      .attr("width", barW * SENSITIVITY);

    bg.append("text")
      .attr("x", 20 + barW / 2)
      .attr("y", startY + 8 + barH / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("fill", "white")
      .attr("font-family", "var(--font-heavy)")
      .text(`${TRUE_POS} verdadeiros positivos (${pctFormatInt(SENSITIVITY)})`);

    drawLegend(bg, startY + barH + 30, [
      { color: COLOR_TRUE_POS, label: `Verdadeiros positivos (${TRUE_POS})` },
      { color: COLOR_FALSE_NEG, label: `Falsos negativos (${FALSE_NEG})` },
    ]);
  }

  function drawFalsePositiveBar() {
    if (!barSvgEl) return;
    const bsvg = select(barSvgEl);
    const bg = bsvg.select("g.bar-group");
    bg.selectAll("*").remove();

    const bw = parseInt(bsvg.attr("width")) || 300;
    const barW = bw - 40;
    const barH = 28;
    const startY = 20;

    bg.append("text")
      .attr("x", 20).attr("y", startY)
      .attr("font-family", "var(--font-heavy)")
      .attr("font-size", "13px")
      .attr("fill", "#333")
      .text("Dos " + HEALTHY + " saudaveis:");

    bg.append("rect")
      .attr("x", 20).attr("y", startY + 8)
      .attr("width", barW).attr("height", barH)
      .attr("fill", COLOR_TRUE_NEG).attr("rx", 3);

    bg.append("rect")
      .attr("x", 20).attr("y", startY + 8)
      .attr("width", 0).attr("height", barH)
      .attr("fill", COLOR_FALSE_POS).attr("rx", 3)
      .transition().duration(600)
      .attr("width", barW * FPR);

    bg.append("text")
      .attr("x", 20 + barW * FPR + 6)
      .attr("y", startY + 8 + barH / 2 + 4)
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text(`${FALSE_POS} falsos positivos (${pctFormatInt(FPR)})`);

    drawLegend(bg, startY + barH + 30, [
      { color: COLOR_FALSE_POS, label: `Falsos positivos (${FALSE_POS})` },
      { color: COLOR_TRUE_NEG, label: `Verdadeiros negativos (${TRUE_NEG})` },
    ]);
  }

  function drawPosteriorBar() {
    if (!barSvgEl) return;
    const bsvg = select(barSvgEl);
    const bg = bsvg.select("g.bar-group");
    bg.selectAll("*").remove();

    const bw = parseInt(bsvg.attr("width")) || 300;
    const barW = bw - 40;
    const barH = 28;
    const startY = 20;

    bg.append("text")
      .attr("x", 20).attr("y", startY)
      .attr("font-family", "var(--font-heavy)")
      .attr("font-size", "13px")
      .attr("fill", "#333")
      .text("Dos " + TOTAL_POS + " resultados positivos:");

    bg.append("rect")
      .attr("x", 20).attr("y", startY + 8)
      .attr("width", barW).attr("height", barH)
      .attr("fill", COLOR_FALSE_POS).attr("rx", 3);

    bg.append("rect")
      .attr("x", 20).attr("y", startY + 8)
      .attr("width", 0).attr("height", barH)
      .attr("fill", COLOR_TRUE_POS).attr("rx", 3)
      .transition().duration(600)
      .attr("width", barW * POSTERIOR);

    bg.append("text")
      .attr("x", 20 + barW * POSTERIOR / 2)
      .attr("y", startY + 8 + barH / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", "white")
      .attr("font-family", "var(--font-heavy)")
      .text(`${TRUE_POS} VP`);

    bg.append("text")
      .attr("x", 20 + barW * POSTERIOR + (barW * (1 - POSTERIOR)) / 2)
      .attr("y", startY + 8 + barH / 2 + 4)
      .attr("text-anchor", "middle")
      .attr("font-size", "11px")
      .attr("fill", "white")
      .attr("font-family", "var(--font-heavy)")
      .text(`${FALSE_POS} FP`);

    // Posterior label
    bg.append("text")
      .attr("x", 20 + barW / 2)
      .attr("y", startY + barH + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", COLOR_TRUE_POS)
      .attr("font-family", "var(--font-heavy)")
      .text(`P(D|+) = ${TRUE_POS}/${TOTAL_POS} = ${pctFormat(POSTERIOR)}`);

    drawLegend(bg, startY + barH + 50, [
      { color: COLOR_TRUE_POS, label: `Verdadeiros positivos (${TRUE_POS})` },
      { color: COLOR_FALSE_POS, label: `Falsos positivos (${FALSE_POS})` },
    ]);
  }

  function drawFormulaBar() {
    if (!barSvgEl) return;
    const bsvg = select(barSvgEl);
    const bg = bsvg.select("g.bar-group");
    bg.selectAll("*").remove();

    const bw = parseInt(bsvg.attr("width")) || 300;
    const barW = bw - 40;
    const barH = 28;
    const startY = 15;

    // Two bars: numerator and denominator
    bg.append("text")
      .attr("x", 20).attr("y", startY)
      .attr("font-family", "var(--font-heavy)")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text("Numerador: P(+|D) x P(D)");

    bg.append("rect")
      .attr("x", 20).attr("y", startY + 6)
      .attr("width", 0).attr("height", barH * 0.8)
      .attr("fill", COLOR_TRUE_POS).attr("rx", 3)
      .transition().duration(600)
      .attr("width", barW * (SENSITIVITY * PREVALENCE) / (SENSITIVITY * PREVALENCE + FPR * (1 - PREVALENCE)) );

    bg.append("text")
      .attr("x", 20).attr("y", startY + barH + 18)
      .attr("font-family", "var(--font-heavy)")
      .attr("font-size", "12px")
      .attr("fill", "#333")
      .text("Denominador: P(+)");

    bg.append("rect")
      .attr("x", 20).attr("y", startY + barH + 24)
      .attr("width", 0).attr("height", barH * 0.8)
      .attr("fill", COLOR_FALSE_POS).attr("rx", 3)
      .transition().duration(600)
      .attr("width", barW);

    bg.append("rect")
      .attr("x", 20).attr("y", startY + barH + 24)
      .attr("width", 0).attr("height", barH * 0.8)
      .attr("fill", COLOR_TRUE_POS).attr("rx", 3)
      .transition().duration(600)
      .attr("width", barW * (SENSITIVITY * PREVALENCE) / (SENSITIVITY * PREVALENCE + FPR * (1 - PREVALENCE)) );

    bg.append("text")
      .attr("x", 20 + barW / 2)
      .attr("y", startY + 2 * barH + 44)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("fill", COLOR_TRUE_POS)
      .attr("font-family", "var(--font-heavy)")
      .text(`P(D|+) = ${pctFormat(POSTERIOR)}`);

    drawLegend(bg, startY + 2 * barH + 60, [
      { color: COLOR_TRUE_POS, label: "P(+|D) x P(D)" },
      { color: COLOR_FALSE_POS, label: "P(+|~D) x P(~D)" },
    ]);
  }

  function drawSecondTestBar() {
    if (!barSvgEl) return;
    const bsvg = select(barSvgEl);
    const bg = bsvg.select("g.bar-group");
    bg.selectAll("*").remove();

    const bw = parseInt(bsvg.attr("width")) || 300;
    const barW = bw - 40;
    const barH = 22;
    const startY = 15;

    // First test bar
    bg.append("text")
      .attr("x", 20).attr("y", startY)
      .attr("font-family", "var(--font-heavy)")
      .attr("font-size", "11px")
      .attr("fill", "#333")
      .text("1o teste: P(D|+) = " + pctFormat(POSTERIOR));

    bg.append("rect")
      .attr("x", 20).attr("y", startY + 6)
      .attr("width", barW).attr("height", barH)
      .attr("fill", COLOR_FALSE_POS).attr("rx", 3);

    bg.append("rect")
      .attr("x", 20).attr("y", startY + 6)
      .attr("width", barW * POSTERIOR).attr("height", barH)
      .attr("fill", COLOR_TRUE_POS).attr("rx", 3);

    // Second test bar
    const secondY = startY + barH + 24;
    bg.append("text")
      .attr("x", 20).attr("y", secondY)
      .attr("font-family", "var(--font-heavy)")
      .attr("font-size", "11px")
      .attr("fill", "#333")
      .text("2o teste: P(D|++) = " + pctFormat(SECOND_POSTERIOR));

    bg.append("rect")
      .attr("x", 20).attr("y", secondY + 6)
      .attr("width", barW).attr("height", barH)
      .attr("fill", COLOR_FALSE_POS).attr("rx", 3);

    bg.append("rect")
      .attr("x", 20).attr("y", secondY + 6)
      .attr("width", 0).attr("height", barH)
      .attr("fill", COLOR_SECOND_POS).attr("rx", 3)
      .transition().duration(800)
      .attr("width", barW * SECOND_POSTERIOR);

    // Comparison text
    bg.append("text")
      .attr("x", 20 + barW / 2)
      .attr("y", secondY + barH + 28)
      .attr("text-anchor", "middle")
      .attr("font-size", "13px")
      .attr("fill", COLOR_SECOND_POS)
      .attr("font-family", "var(--font-heavy)")
      .text(`${pctFormatInt(PREVALENCE)} -> ${pctFormat(POSTERIOR)} -> ${pctFormat(SECOND_POSTERIOR)}`);

    drawLegend(bg, secondY + barH + 46, [
      { color: COLOR_TRUE_POS, label: "Verdadeiros positivos" },
      { color: COLOR_FALSE_POS, label: "Falsos positivos" },
      { color: COLOR_SECOND_POS, label: "Confirmados (2o teste)" },
    ]);
  }

  function drawLegend(g, y, items) {
    const legendG = g.append("g")
      .attr("transform", `translate(20, ${y})`);

    items.forEach((item, i) => {
      const lg = legendG.append("g")
        .attr("transform", `translate(${i * 150}, 0)`);

      lg.append("rect")
        .attr("width", 10).attr("height", 10)
        .attr("fill", item.color).attr("rx", 2);

      lg.append("text")
        .attr("x", 14).attr("y", 9)
        .attr("font-size", "10px")
        .attr("fill", "#555")
        .text(item.label);
    });
  }

  onMount(() => {
    computeDimensions();
    initChart();
    initBarChart();
    drawStep0();

    // Handle resize
    const handleResize = () => {
      if (!svgEl) return;
      initialized = false;
      select(svgEl).selectAll("*").remove();
      select(barSvgEl).selectAll("*").remove();
      computeDimensions();
      initChart();
      initBarChart();
      if (typeof value !== "undefined") {
        target2event[value]();
      } else {
        drawStep0();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });
</script>

<h2 class="body-header">Teste Medico para Doenca Rara</h2>
<p class="body-text">
  Acompanhe a visualizacao abaixo enquanto rola a pagina para entender
  por que um resultado positivo em um teste muito preciso nao significa
  necessariamente que voce esta doente.
</p>

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
      <div class="chart-waffle">
        <svg bind:this={svgEl}></svg>
      </div>
      <div class="chart-bars">
        <svg bind:this={barSvgEl}></svg>
      </div>
    </div>
  </div>
</section>

<style>
  .chart-waffle {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .chart-waffle svg {
    width: 100%;
    display: block;
  }

  .chart-bars {
    width: 100%;
    height: 160px;
    min-height: 140px;
  }

  .chart-bars svg {
    width: 100%;
    display: block;
  }

  .spacer {
    height: 40vh;
  }

  .charts-container {
    position: sticky;
    top: 10%;
    display: flex;
    flex-direction: column;
    width: 50%;
    height: 85vh;
    gap: 0.5rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.85);
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .section-container {
    margin-top: 1em;
    text-align: center;
    transition: background 100ms;
    display: flex;
  }

  .step {
    height: 110vh;
    display: flex;
    place-items: center;
    justify-content: center;
  }

  .step-content {
    font-size: 18px;
    background: var(--bg);
    color: #ccc;
    border-radius: 5px;
    padding: 0.75rem 1.25rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 500ms ease;
    text-align: left;
    width: 75%;
    margin: auto;
    max-width: 500px;
    font-family: var(--font-main);
    line-height: 1.4;
    border: 2px solid #ddd;
  }

  .step.active .step-content {
    background: #f1f3f3ee;
    color: var(--squidink);
    border-color: var(--primary);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .steps-container {
    height: 100%;
    flex: 1 1 40%;
    z-index: 10;
  }

  :global(.step-content .step-title) {
    font-family: var(--font-heavy);
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    color: var(--squidink);
  }

  :global(.step-content p) {
    margin: 0.4rem 0;
    line-height: 1.5;
  }

  @media screen and (max-width: 950px) {
    .section-container {
      flex-direction: column-reverse;
    }

    .steps-container {
      pointer-events: none;
    }

    .charts-container {
      top: 7.5%;
      width: 95%;
      margin: auto;
      height: 55vh;
    }

    .step {
      height: 130vh;
    }

    .step-content {
      width: 95%;
      max-width: 768px;
      font-size: 17px;
      line-height: 1.6;
    }

    .spacer {
      height: 100vh;
    }

    .chart-bars {
      height: 120px;
      min-height: 100px;
    }
  }
</style>
