<script>
  import Scrolly from "./Scrolly.svelte";
  import katexify from "../katexify";
  import { onMount } from "svelte";
  import { select, selectAll } from "d3-selection";
  import { scaleLinear, scaleSequential } from "d3-scale";
  import { interpolateYlGnBu } from "d3-scale-chromatic";
  import { contours } from "d3-contour";
  import { geoPath, geoIdentity } from "d3-geo";
  import { axisBottom, axisLeft } from "d3-axis";
  import { range, extent } from "d3-array";
  import { transition } from "d3-transition";
  import { timer } from "d3-timer";

  // scroll iterator
  let value;

  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 45, left: 55 };
  let width = 420;
  let height = 420;
  let innerWidth = width - margin.left - margin.right;
  let innerHeight = height - margin.top - margin.bottom;

  // Grid for contour computation
  const gridSize = 100;
  const w0Range = [-4, 4];
  const w1Range = [-4, 4];

  // --- Loss functions ---
  // Convex: simple bowl f(x,y) = x^2 + y^2
  function convexLoss(x, y) {
    return x * x + y * y;
  }

  // Non-convex: has local minima
  function nonConvexLoss(x, y) {
    return (
      Math.sin(x * 1.5) * Math.cos(y * 1.5) +
      (x * x) / 8 +
      (y * y) / 8 +
      2
    );
  }

  // Current loss function
  let lossFn = convexLoss;
  let isNonConvex = false;

  // Compute gradient numerically
  function gradient(fn, x, y, eps = 0.001) {
    const dfdx = (fn(x + eps, y) - fn(x - eps, y)) / (2 * eps);
    const dfdy = (fn(x, y + eps) - fn(x, y - eps)) / (2 * eps);
    return [dfdx, dfdy];
  }

  // Generate contour data for a given loss function
  function generateContourValues(fn) {
    const values = new Array(gridSize * gridSize);
    for (let j = 0; j < gridSize; j++) {
      for (let i = 0; i < gridSize; i++) {
        const x =
          w0Range[0] + (i / (gridSize - 1)) * (w0Range[1] - w0Range[0]);
        const y =
          w1Range[0] + (j / (gridSize - 1)) * (w1Range[1] - w1Range[0]);
        values[j * gridSize + i] = fn(x, y);
      }
    }
    return values;
  }

  // Gradient descent path
  function gdPath(fn, startX, startY, lr, steps) {
    const path = [{ x: startX, y: startY }];
    let cx = startX;
    let cy = startY;
    for (let i = 0; i < steps; i++) {
      const [gx, gy] = gradient(fn, cx, cy);
      cx = cx - lr * gx;
      cy = cy - lr * gy;
      // clamp to range
      cx = Math.max(w0Range[0], Math.min(w0Range[1], cx));
      cy = Math.max(w1Range[0], Math.min(w1Range[1], cy));
      path.push({ x: cx, y: cy });
    }
    return path;
  }

  // State variables
  let startPoint = { x: 3.5, y: 3.0 };
  let currentPathIndex = 0;
  let showContour = false;
  let showPoint = false;
  let showGradientArrow = false;
  let showFirstStep = false;
  let showLRComparison = false;
  let showConvergence = false;
  let showNonConvex = false;
  let showSummary = false;

  // Learning rates for comparison
  const lrHigh = 1.2;
  const lrLow = 0.01;
  const lrGood = 0.15;

  // Paths
  let pathHigh = [];
  let pathLow = [];
  let pathGood = [];
  let pathNonConvex = [];

  // Precompute paths
  function computePaths() {
    pathHigh = gdPath(convexLoss, startPoint.x, startPoint.y, lrHigh, 30);
    pathLow = gdPath(convexLoss, startPoint.x, startPoint.y, lrLow, 30);
    pathGood = gdPath(convexLoss, startPoint.x, startPoint.y, lrGood, 30);
    pathNonConvex = gdPath(nonConvexLoss, 2.5, 2.5, 0.2, 40);
  }

  // Paragraph text for scrolly
  $: steps = [
    `<h1 class='step-title'>A Superfície de Perda</h1>
     <p>Aqui temos a <b>superfície de perda</b> (loss surface) de um modelo simples com dois parâmetros,
     ${katexify("w_0")} e ${katexify("w_1")}. As curvas de nível representam o valor da
     <b>função de custo</b> ${katexify("J(w_0, w_1)")}: cores mais escuras indicam
     valores menores (melhor). O centro é o <b>mínimo global</b> -- onde o erro é zero.</p>`,

    `<h1 class='step-title'>Onde Começamos?</h1>
     <p>O treinamento começa com uma <b>inicialização aleatória</b> dos pesos. O ponto laranja
     marca onde estamos: ${katexify("w_0 = 3.5")}, ${katexify("w_1 = 3.0")}.
     O custo aqui é alto -- estamos longe do mínimo. Precisamos de uma estratégia para descer.</p>`,

    `<h1 class='step-title'>O Gradiente</h1>
     <p>A <b>seta vermelha</b> indica a direção do <b>gradiente</b> ${katexify("\\nabla J(w)")},
     que aponta para onde a função <i>cresce mais rápido</i>. Para minimizar o custo,
     nos movemos na <b>direção oposta</b>. O comprimento da seta é proporcional à
     magnitude do gradiente -- quanto mais íngreme, mais forte o sinal.</p>`,

    `<h1 class='step-title'>Primeiro Passo</h1>
     <p>Aplicamos a regra de atualização:
     ${katexify("w_{t+1} = w_t - \\alpha \\nabla J(w_t)", false)}.
     Com uma taxa de aprendizado ${katexify("\\alpha = 0.15")}, o ponto se move na
     direção oposta ao gradiente. Observe que ele se aproximou do mínimo! Cada
     iteração nos leva um pouco mais perto do vale.</p>`,

    `<h1 class='step-title'>Taxa de Aprendizado</h1>
     <p>A <b>taxa de aprendizado</b> ${katexify("\\alpha")} controla o tamanho do passo:
     <br><br>
     <span style="color: #e74c3c;">&#9679; Vermelho</span>: ${katexify("\\alpha = 1.2")} (muito alta) -- o ponto <b>oscila</b> e diverge!
     <br>
     <span style="color: #3498db;">&#9679; Azul</span>: ${katexify("\\alpha = 0.01")} (muito baixa) -- convergência extremamente lenta.
     <br>
     <span style="color: #2ecc71;">&#9679; Verde</span>: ${katexify("\\alpha = 0.15")} (adequada) -- convergência suave e eficiente.
     <br><br>
     Escolher ${katexify("\\alpha")} corretamente é um dos desafios fundamentais do treinamento.</p>`,

    `<h1 class='step-title'>Convergência</h1>
     <p>Com a taxa de aprendizado adequada (${katexify("\\alpha = 0.15")}), o ponto verde
     segue um caminho direto até o mínimo. A cada passo, os gradientes ficam menores
     (a superfície fica mais plana perto do mínimo), e os passos diminuem
     naturalmente. Isso é a <b>convergência</b>.</p>`,

    `<h1 class='step-title'>Mínimo Local vs. Global</h1>
     <p>Nem toda superfície é tão simples. Em redes neurais, a superfície de perda é
     <b>não-convexa</b> -- tem vários vales e picos. O gradiente descendente pode
     ficar preso em um <b>mínimo local</b> (um vale que não é o mais profundo).
     Observe como o ponto laranja para em um mínimo que <i>não é</i> o ponto mais
     baixo da superfície. Técnicas como <b>momentum</b> e <b>SGD</b> ajudam a
     escapar desses mínimos locais.</p>`,

    `<h1 class='step-title'>Resumo</h1>
     <p>O <b>Gradiente Descendente</b> é o motor por trás do treinamento de quase todos
     os modelos de ML modernos. Suas variantes (SGD, Adam, RMSProp) são usadas para
     treinar desde regressões simples até redes neurais com bilhões de parâmetros.
     Os conceitos-chave são:
     <br><br>
     &#10003; O <b>gradiente</b> indica a direção de maior crescimento<br>
     &#10003; Nos movemos na <b>direção oposta</b> para minimizar o custo<br>
     &#10003; A <b>taxa de aprendizado</b> controla o tamanho do passo<br>
     &#10003; Superfícies <b>não-convexas</b> têm mínimos locais</p>`,
  ];

  // Scroll event handlers
  const target2event = {
    0: () => {
      showContour = true;
      showPoint = false;
      showGradientArrow = false;
      showFirstStep = false;
      showLRComparison = false;
      showConvergence = false;
      showNonConvex = false;
      showSummary = false;
      isNonConvex = false;
      lossFn = convexLoss;
      drawContour();
      hidePoint();
      hideArrow();
      hidePaths();
    },
    1: () => {
      showContour = true;
      showPoint = true;
      showGradientArrow = false;
      showFirstStep = false;
      showLRComparison = false;
      showConvergence = false;
      showNonConvex = false;
      showSummary = false;
      isNonConvex = false;
      lossFn = convexLoss;
      drawContour();
      drawPoint(startPoint.x, startPoint.y);
      hideArrow();
      hidePaths();
    },
    2: () => {
      showContour = true;
      showPoint = true;
      showGradientArrow = true;
      showFirstStep = false;
      showLRComparison = false;
      showConvergence = false;
      showNonConvex = false;
      showSummary = false;
      isNonConvex = false;
      lossFn = convexLoss;
      drawContour();
      drawPoint(startPoint.x, startPoint.y);
      drawArrow(startPoint.x, startPoint.y);
      hidePaths();
    },
    3: () => {
      showContour = true;
      showPoint = true;
      showGradientArrow = true;
      showFirstStep = true;
      showLRComparison = false;
      showConvergence = false;
      showNonConvex = false;
      showSummary = false;
      isNonConvex = false;
      lossFn = convexLoss;
      drawContour();
      hidePaths();
      drawFirstStep();
    },
    4: () => {
      showContour = true;
      showPoint = false;
      showGradientArrow = false;
      showFirstStep = false;
      showLRComparison = true;
      showConvergence = false;
      showNonConvex = false;
      showSummary = false;
      isNonConvex = false;
      lossFn = convexLoss;
      drawContour();
      hideArrow();
      drawLRComparison();
    },
    5: () => {
      showContour = true;
      showPoint = false;
      showGradientArrow = false;
      showFirstStep = false;
      showLRComparison = false;
      showConvergence = true;
      showNonConvex = false;
      showSummary = false;
      isNonConvex = false;
      lossFn = convexLoss;
      drawContour();
      hideArrow();
      drawConvergence();
    },
    6: () => {
      showContour = true;
      showPoint = true;
      showGradientArrow = false;
      showFirstStep = false;
      showLRComparison = false;
      showConvergence = false;
      showNonConvex = true;
      showSummary = false;
      isNonConvex = true;
      lossFn = nonConvexLoss;
      drawContour();
      hideArrow();
      hidePaths();
      drawNonConvexPath();
    },
    7: () => {
      showContour = true;
      showPoint = false;
      showGradientArrow = false;
      showFirstStep = false;
      showLRComparison = false;
      showConvergence = false;
      showNonConvex = false;
      showSummary = true;
      isNonConvex = false;
      lossFn = convexLoss;
      drawContour();
      hideArrow();
      drawSummary();
    },
  };

  // trigger events on scroll
  $: if (typeof value !== "undefined") target2event[value]();

  // D3 scales
  let xScale, yScale, colorScale;

  function initScales() {
    xScale = scaleLinear().domain(w0Range).range([0, innerWidth]);
    yScale = scaleLinear().domain(w1Range).range([innerHeight, 0]);
  }

  // --- D3 Drawing Functions ---
  let svgEl;
  let mainG;
  let contourG;
  let pointsG;
  let arrowsG;
  let pathsG;
  let axesG;
  let mounted = false;

  function initSVG() {
    if (!svgEl) return;
    const svg = select(svgEl)
      .attr("width", width)
      .attr("height", height);

    // Clear existing
    svg.selectAll("g").remove();
    svg.selectAll("defs").remove();

    // Arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 8)
      .attr("refY", 5)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M 0 0 L 10 5 L 0 10 z")
      .attr("fill", "#e74c3c");

    mainG = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    contourG = mainG.append("g").attr("class", "contour-layer");
    pathsG = mainG.append("g").attr("class", "paths-layer");
    arrowsG = mainG.append("g").attr("class", "arrows-layer");
    pointsG = mainG.append("g").attr("class", "points-layer");
    axesG = mainG.append("g").attr("class", "axes-layer");

    // Axes
    axesG
      .append("g")
      .attr("class", "x-axis")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(axisBottom(xScale).ticks(5));

    axesG
      .append("g")
      .attr("class", "y-axis")
      .call(axisLeft(yScale).ticks(5));

    // Axis labels
    axesG
      .append("text")
      .attr("class", "axis-label")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 40)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--squid-ink)")
      .attr("font-size", "14px")
      .attr("font-family", "var(--font-main)")
      .text("w\u2080");

    axesG
      .append("text")
      .attr("class", "axis-label")
      .attr("x", -innerHeight / 2)
      .attr("y", -40)
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("fill", "var(--squid-ink)")
      .attr("font-size", "14px")
      .attr("font-family", "var(--font-main)")
      .text("w\u2081");
  }

  function drawContour() {
    if (!mainG) return;

    const values = generateContourValues(lossFn);
    const ext = extent(values);

    colorScale = scaleSequential(interpolateYlGnBu).domain([ext[1], ext[0]]);

    const thresholds = range(ext[0], ext[1], (ext[1] - ext[0]) / 20);

    const contourGenerator = contours()
      .size([gridSize, gridSize])
      .thresholds(thresholds);

    const contourData = contourGenerator(values);

    const projection = geoIdentity().scale(innerWidth / gridSize);
    const pathGenerator = geoPath(projection);

    const paths = contourG.selectAll("path").data(contourData);

    paths
      .enter()
      .append("path")
      .attr("d", pathGenerator)
      .attr("fill", (d) => colorScale(d.value))
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("stroke-opacity", 0.3)
      .attr("opacity", 0)
      .transition()
      .duration(600)
      .attr("opacity", 1);

    paths
      .transition()
      .duration(600)
      .attr("d", pathGenerator)
      .attr("fill", (d) => colorScale(d.value))
      .attr("opacity", 1);

    paths.exit().transition().duration(300).attr("opacity", 0).remove();
  }

  function drawPoint(px, py) {
    if (!pointsG) return;

    const data = [{ x: px, y: py }];
    const circles = pointsG.selectAll("circle.main-point").data(data);

    circles
      .enter()
      .append("circle")
      .attr("class", "main-point")
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 0)
      .attr("fill", "#ff9900")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2.5)
      .transition()
      .duration(600)
      .attr("r", 10);

    circles
      .transition()
      .duration(600)
      .attr("cx", (d) => xScale(d.x))
      .attr("cy", (d) => yScale(d.y))
      .attr("r", 10);
  }

  function hidePoint() {
    if (!pointsG) return;
    pointsG
      .selectAll("circle.main-point")
      .transition()
      .duration(400)
      .attr("r", 0)
      .remove();
  }

  function drawArrow(px, py) {
    if (!arrowsG) return;

    const [gx, gy] = gradient(lossFn, px, py);
    const arrowScale = 0.25;
    const x1 = xScale(px);
    const y1 = yScale(py);
    const x2 = xScale(px + gx * arrowScale);
    const y2 = yScale(py + gy * arrowScale);

    const data = [{ x1, y1, x2, y2 }];
    const lines = arrowsG.selectAll("line.grad-arrow").data(data);

    lines
      .enter()
      .append("line")
      .attr("class", "grad-arrow")
      .attr("x1", (d) => d.x1)
      .attr("y1", (d) => d.y1)
      .attr("x2", (d) => d.x1)
      .attr("y2", (d) => d.y1)
      .attr("stroke", "#e74c3c")
      .attr("stroke-width", 3)
      .attr("marker-end", "url(#arrowhead)")
      .transition()
      .duration(600)
      .attr("x2", (d) => d.x2)
      .attr("y2", (d) => d.y2);

    lines
      .transition()
      .duration(600)
      .attr("x1", (d) => d.x1)
      .attr("y1", (d) => d.y1)
      .attr("x2", (d) => d.x2)
      .attr("y2", (d) => d.y2);

    // Label
    const labels = arrowsG.selectAll("text.grad-label").data(data);

    labels
      .enter()
      .append("text")
      .attr("class", "grad-label")
      .attr("x", (d) => d.x2 + 8)
      .attr("y", (d) => d.y2 - 8)
      .attr("fill", "#e74c3c")
      .attr("font-size", "13px")
      .attr("font-weight", "bold")
      .attr("font-family", "var(--font-main)")
      .attr("opacity", 0)
      .text("\u2207J(w)")
      .transition()
      .duration(600)
      .attr("opacity", 1);

    labels
      .transition()
      .duration(600)
      .attr("x", (d) => d.x2 + 8)
      .attr("y", (d) => d.y2 - 8);
  }

  function hideArrow() {
    if (!arrowsG) return;
    arrowsG
      .selectAll("line.grad-arrow")
      .transition()
      .duration(300)
      .attr("x2", function () {
        return select(this).attr("x1");
      })
      .attr("y2", function () {
        return select(this).attr("y1");
      })
      .remove();
    arrowsG
      .selectAll("text.grad-label")
      .transition()
      .duration(300)
      .attr("opacity", 0)
      .remove();
  }

  function hidePaths() {
    if (!pathsG) return;
    pathsG
      .selectAll("circle")
      .transition()
      .duration(300)
      .attr("r", 0)
      .remove();
    pathsG
      .selectAll("line")
      .transition()
      .duration(300)
      .attr("opacity", 0)
      .remove();
    pointsG
      .selectAll("circle.main-point")
      .transition()
      .duration(300)
      .attr("r", 0)
      .remove();
  }

  function drawFirstStep() {
    if (!pathsG) return;
    hidePaths();

    const lr = lrGood;
    const [gx, gy] = gradient(convexLoss, startPoint.x, startPoint.y);
    const newX = startPoint.x - lr * gx;
    const newY = startPoint.y - lr * gy;

    // Draw starting point
    setTimeout(() => {
      const startData = [{ x: startPoint.x, y: startPoint.y }];
      pointsG
        .selectAll("circle.main-point")
        .data(startData)
        .enter()
        .append("circle")
        .attr("class", "main-point")
        .attr("cx", (d) => xScale(d.x))
        .attr("cy", (d) => yScale(d.y))
        .attr("r", 0)
        .attr("fill", "#ff9900")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2.5)
        .transition()
        .duration(400)
        .attr("r", 10)
        .transition()
        .duration(600)
        .attr("cx", xScale(newX))
        .attr("cy", yScale(newY));

      // Draw trail line
      pathsG
        .append("line")
        .attr("class", "step-line")
        .attr("x1", xScale(startPoint.x))
        .attr("y1", yScale(startPoint.y))
        .attr("x2", xScale(startPoint.x))
        .attr("y2", yScale(startPoint.y))
        .attr("stroke", "#ff9900")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,3")
        .attr("opacity", 0.7)
        .transition()
        .delay(400)
        .duration(600)
        .attr("x2", xScale(newX))
        .attr("y2", yScale(newY));

      // Update arrow to show from new position
      drawArrow(startPoint.x, startPoint.y);
    }, 100);
  }

  function drawPathWithColor(path, color, maxSteps) {
    const n = Math.min(path.length, maxSteps || path.length);

    for (let i = 0; i < n - 1; i++) {
      pathsG
        .append("line")
        .attr("x1", xScale(path[i].x))
        .attr("y1", yScale(path[i].y))
        .attr("x2", xScale(path[i].x))
        .attr("y2", yScale(path[i].y))
        .attr("stroke", color)
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.6)
        .transition()
        .delay(i * 60)
        .duration(200)
        .attr("x2", xScale(path[i + 1].x))
        .attr("y2", yScale(path[i + 1].y));
    }

    for (let i = 0; i < n; i++) {
      pathsG
        .append("circle")
        .attr("cx", xScale(path[i].x))
        .attr("cy", yScale(path[i].y))
        .attr("r", 0)
        .attr("fill", color)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .transition()
        .delay(i * 60)
        .duration(200)
        .attr("r", i === 0 ? 7 : 4);
    }
  }

  function drawLRComparison() {
    if (!pathsG) return;
    hidePaths();

    computePaths();

    setTimeout(() => {
      drawPathWithColor(pathHigh, "#e74c3c", 15);
      drawPathWithColor(pathLow, "#3498db", 15);
      drawPathWithColor(pathGood, "#2ecc71", 15);
    }, 150);
  }

  function drawConvergence() {
    if (!pathsG) return;
    hidePaths();

    computePaths();

    setTimeout(() => {
      drawPathWithColor(pathGood, "#2ecc71", 30);
    }, 150);
  }

  function drawNonConvexPath() {
    if (!pathsG) return;
    hidePaths();

    computePaths();

    setTimeout(() => {
      // Draw the non-convex path ending at local minimum
      drawPathWithColor(pathNonConvex, "#ff9900", 40);

      // Mark the local minimum with an annotation
      const lastPt = pathNonConvex[pathNonConvex.length - 1];
      pathsG
        .append("text")
        .attr("x", xScale(lastPt.x))
        .attr("y", yScale(lastPt.y) - 15)
        .attr("text-anchor", "middle")
        .attr("fill", "#e74c3c")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .attr("font-family", "var(--font-main)")
        .attr("opacity", 0)
        .text("Mínimo Local")
        .transition()
        .delay(2000)
        .duration(600)
        .attr("opacity", 1);
    }, 150);
  }

  function drawSummary() {
    if (!pathsG) return;
    hidePaths();

    computePaths();

    setTimeout(() => {
      // Show the good path as the hero
      drawPathWithColor(pathGood, "#2ecc71", 30);

      // Add a pulsing circle at the minimum
      pathsG
        .append("circle")
        .attr("class", "pulse-ring")
        .attr("cx", xScale(0))
        .attr("cy", yScale(0))
        .attr("r", 5)
        .attr("fill", "none")
        .attr("stroke", "#2ecc71")
        .attr("stroke-width", 2)
        .attr("opacity", 1);

      // Minimum label
      pathsG
        .append("text")
        .attr("x", xScale(0) + 15)
        .attr("y", yScale(0) + 5)
        .attr("fill", "#2ecc71")
        .attr("font-size", "13px")
        .attr("font-weight", "bold")
        .attr("font-family", "var(--font-main)")
        .attr("opacity", 0)
        .text("Mínimo Global")
        .transition()
        .delay(1500)
        .duration(600)
        .attr("opacity", 1);
    }, 150);
  }

  onMount(() => {
    initScales();
    computePaths();
    initSVG();
    mounted = true;
  });
</script>

<h2 class="body-header">Visualizando o Gradiente Descendente</h2>
<p class="body-text">
  Acompanhe a animação ao lado enquanto rola para baixo. Cada seção revela
  um aspecto diferente do algoritmo.
</p>

<section>
  <!-- scroll container -->
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
      <div class="chart-one">
        <svg bind:this={svgEl} id="gd-svg"></svg>
      </div>
    </div>
  </div>
  <!-- end scroll -->
</section>

<style>
  .chart-one {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--stone);
  }

  #gd-svg {
    max-width: 100%;
    height: auto;
  }

  .spacer {
    height: 40vh;
  }

  .charts-container {
    position: sticky;
    top: 10%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 50%;
    height: 85vh;
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
    padding: 0.8rem 1.2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    transition: background 500ms ease;
    text-align: left;
    width: 75%;
    margin: auto;
    max-width: 500px;
    font-family: var(--font-main);
    line-height: 1.5;
    border: 2px solid var(--stone);
  }

  .step.active .step-content {
    background: #f1f3f3ee;
    color: var(--squid-ink);
    border-color: var(--primary);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .steps-container {
    height: 100%;
    flex: 1 1 40%;
    z-index: 10;
  }

  :global(.step-title) {
    font-size: 22px;
    margin-bottom: 0.5rem;
    color: var(--primary);
    font-family: var(--font-heavy);
  }

  /* Mobile responsive */
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
  }
</style>
