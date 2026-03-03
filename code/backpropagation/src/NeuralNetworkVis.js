import { select, selectAll } from "d3-selection";
import { scaleLinear } from "d3-scale";
import { transition } from "d3-transition";
import { easeQuadInOut, easeCubicOut } from "d3-ease";
import { interpolateRgb } from "d3-interpolate";

// Network architecture: 2 input, 3 hidden, 1 output
const LAYERS = [2, 3, 1];

// Pre-calculated values for visualization
const WEIGHTS_INITIAL = [
  // input -> hidden (2x3 = 6 weights)
  [0.4, -0.3, 0.5, 0.2, -0.6, 0.1],
  // hidden -> output (3x1 = 3 weights)
  [0.7, -0.4, 0.3],
];

const WEIGHTS_UPDATED = [
  [0.38, -0.25, 0.52, 0.18, -0.55, 0.12],
  [0.65, -0.35, 0.32],
];

const INPUTS = [0.5, 0.8];
const HIDDEN_RAW = [0.58, 0.32, 0.67]; // pre-computed weighted sums
const HIDDEN_ACT = [0.64, 0.58, 0.66]; // after sigmoid
const OUTPUT_RAW = 0.52;
const OUTPUT_ACT = 0.63; // sigmoid(0.52)
const TARGET = 1.0;
const LOSS_VALUE = 0.137; // (1-0.63)^2 / 2

// Gradients for backward pass (pre-computed)
const OUTPUT_GRAD = -0.37; // dL/dy_hat = -(y - y_hat)
const HIDDEN_GRADS = [-0.060, 0.034, -0.026];

// Loss curve data (epoch, loss)
const LOSS_CURVE = [
  { epoch: 0, loss: 0.5 },
  { epoch: 1, loss: 0.38 },
  { epoch: 2, loss: 0.29 },
  { epoch: 3, loss: 0.22 },
  { epoch: 4, loss: 0.17 },
  { epoch: 5, loss: 0.137 },
  { epoch: 6, loss: 0.11 },
  { epoch: 7, loss: 0.085 },
  { epoch: 8, loss: 0.065 },
  { epoch: 9, loss: 0.05 },
  { epoch: 10, loss: 0.038 },
  { epoch: 11, loss: 0.03 },
  { epoch: 12, loss: 0.023 },
  { epoch: 13, loss: 0.018 },
  { epoch: 14, loss: 0.014 },
  { epoch: 15, loss: 0.011 },
];

const COLORS = {
  node: "#d4dada",
  nodeStroke: "#232f3e",
  input: "#2074d5",
  hidden: "#7c5aed",
  output: "#38ef7d",
  error: "#df2a5d",
  gradient: "#ff6b35",
  connection: "#aaa",
  connectionActive: "#2074d5",
  connectionBackward: "#ff6b35",
  lossLine: "#df2a5d",
  lossFill: "rgba(223,42,93,0.1)",
  text: "#232f3e",
};

export function createNeuralNetwork(selector) {
  const container = select(selector);
  if (container.empty()) return null;

  const containerNode = container.node();
  const width = containerNode.clientWidth || 500;
  const height = containerNode.clientHeight || 340;
  const margin = { top: 30, right: 40, bottom: 30, left: 40 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("id", "nn-svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Compute node positions
  const layerX = LAYERS.map((_, i) => (i / (LAYERS.length - 1)) * innerW);
  const nodes = [];
  const connections = [];

  LAYERS.forEach((count, li) => {
    const spacing = innerH / (count + 1);
    for (let ni = 0; ni < count; ni++) {
      nodes.push({
        id: `n-${li}-${ni}`,
        layer: li,
        index: ni,
        x: layerX[li],
        y: spacing * (ni + 1),
      });
    }
  });

  // Build connections
  let weightIdx = 0;
  for (let li = 0; li < LAYERS.length - 1; li++) {
    const fromNodes = nodes.filter((n) => n.layer === li);
    const toNodes = nodes.filter((n) => n.layer === li + 1);
    let wIdx = 0;
    fromNodes.forEach((from) => {
      toNodes.forEach((to) => {
        connections.push({
          id: `c-${from.id}-${to.id}`,
          source: from,
          target: to,
          layerPair: li,
          weightIndex: wIdx,
          weight: WEIGHTS_INITIAL[li][wIdx],
          weightUpdated: WEIGHTS_UPDATED[li][wIdx],
        });
        wIdx++;
      });
    });
  }

  // Draw connections
  const connectionGroup = g.append("g").attr("class", "connections");
  const connectionLines = connectionGroup
    .selectAll("line")
    .data(connections)
    .enter()
    .append("line")
    .attr("class", "connection")
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y)
    .attr("stroke", COLORS.connection)
    .attr("stroke-width", 2)
    .attr("stroke-opacity", 0)
    .attr("data-id", (d) => d.id);

  // Animated particles group (for forward/backward pass)
  const particleGroup = g.append("g").attr("class", "particles");

  // Draw nodes
  const nodeGroup = g.append("g").attr("class", "nodes");
  const nodeCircles = nodeGroup
    .selectAll("g.node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .attr("transform", (d) => `translate(${d.x},${d.y})`);

  nodeCircles
    .append("circle")
    .attr("r", 0)
    .attr("fill", COLORS.node)
    .attr("stroke", COLORS.nodeStroke)
    .attr("stroke-width", 2);

  // Value labels inside nodes
  nodeCircles
    .append("text")
    .attr("class", "node-value")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .attr("font-size", "12px")
    .attr("font-family", "var(--font-mono, monospace)")
    .attr("fill", COLORS.text)
    .attr("opacity", 0)
    .text("");

  // Layer labels
  const layerLabels = [
    { text: "Entrada", x: layerX[0], y: -10 },
    { text: "Oculta", x: layerX[1], y: -10 },
    { text: "Saida", x: layerX[2], y: -10 },
  ];

  g.selectAll("text.layer-label")
    .data(layerLabels)
    .enter()
    .append("text")
    .attr("class", "layer-label")
    .attr("x", (d) => d.x)
    .attr("y", (d) => d.y)
    .attr("text-anchor", "middle")
    .attr("font-size", "13px")
    .attr("font-family", "var(--font-heavy)")
    .attr("fill", COLORS.text)
    .attr("opacity", 0)
    .text((d) => d.text);

  // Target value label (appears in step 3)
  const targetLabel = g.append("g")
    .attr("class", "target-label")
    .attr("transform", `translate(${layerX[2] + 50}, ${innerH / 2})`)
    .attr("opacity", 0);

  targetLabel.append("text")
    .attr("text-anchor", "start")
    .attr("dy", "-0.3em")
    .attr("font-size", "12px")
    .attr("font-family", "var(--font-main)")
    .attr("fill", COLORS.text)
    .text("Esperado:");

  targetLabel.append("text")
    .attr("text-anchor", "start")
    .attr("dy", "1em")
    .attr("font-size", "14px")
    .attr("font-family", "var(--font-heavy)")
    .attr("fill", COLORS.output)
    .text("y = 1.0");

  // Error label (appears in step 4)
  const errorLabel = g.append("g")
    .attr("class", "error-label")
    .attr("transform", `translate(${layerX[2] + 50}, ${innerH / 2 + 50})`)
    .attr("opacity", 0);

  errorLabel.append("text")
    .attr("text-anchor", "start")
    .attr("dy", "-0.3em")
    .attr("font-size", "12px")
    .attr("font-family", "var(--font-main)")
    .attr("fill", COLORS.error)
    .text("Erro:");

  errorLabel.append("text")
    .attr("text-anchor", "start")
    .attr("dy", "1em")
    .attr("font-size", "14px")
    .attr("font-family", "var(--font-heavy)")
    .attr("fill", COLORS.error)
    .text("|0.63 - 1.0| = 0.37");

  // Weight labels on connections (hidden initially)
  const weightLabels = connectionGroup
    .selectAll("text.weight-label")
    .data(connections)
    .enter()
    .append("text")
    .attr("class", "weight-label")
    .attr("x", (d) => (d.source.x + d.target.x) / 2)
    .attr("y", (d) => (d.source.y + d.target.y) / 2 - 8)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("font-family", "var(--font-mono, monospace)")
    .attr("fill", COLORS.text)
    .attr("opacity", 0)
    .text((d) => d.weight.toFixed(2));

  const nodeRadius = Math.min(24, innerW / 14);

  // ---- Step functions ----

  function step0() {
    // Network appears: nodes and connections in grey
    nodeCircles
      .select("circle")
      .transition()
      .duration(600)
      .ease(easeCubicOut)
      .attr("r", nodeRadius)
      .attr("fill", COLORS.node)
      .attr("stroke", COLORS.nodeStroke)
      .attr("stroke-width", 2);

    connectionLines
      .transition()
      .duration(600)
      .attr("stroke", COLORS.connection)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5);

    g.selectAll("text.layer-label")
      .transition()
      .duration(600)
      .attr("opacity", 1);

    // Hide everything else
    nodeCircles.select(".node-value")
      .transition()
      .duration(300)
      .attr("opacity", 0);

    targetLabel.transition().duration(300).attr("opacity", 0);
    errorLabel.transition().duration(300).attr("opacity", 0);
    weightLabels.transition().duration(300).attr("opacity", 0);
    particleGroup.selectAll("*").remove();
  }

  function step1() {
    // Input values appear with blue highlight
    nodeCircles.each(function (d) {
      const el = select(this);
      if (d.layer === 0) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.input)
          .attr("stroke", COLORS.input)
          .attr("r", nodeRadius);

        el.select(".node-value")
          .transition()
          .duration(600)
          .attr("opacity", 1)
          .attr("fill", "#fff");

        el.select(".node-value").text(INPUTS[d.index].toFixed(1));
      } else {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.node)
          .attr("stroke", COLORS.nodeStroke);

        el.select(".node-value")
          .transition()
          .duration(300)
          .attr("opacity", 0);
      }
    });

    connectionLines
      .transition()
      .duration(600)
      .attr("stroke", COLORS.connection)
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.5);

    weightLabels
      .transition()
      .duration(600)
      .attr("opacity", 0.7)
      .text((d) => d.weight.toFixed(2));

    targetLabel.transition().duration(300).attr("opacity", 0);
    errorLabel.transition().duration(300).attr("opacity", 0);
    particleGroup.selectAll("*").remove();
  }

  function step2() {
    // Forward pass animation: data flows L->R
    // Highlight input->hidden connections
    connectionLines
      .transition()
      .duration(600)
      .attr("stroke", (d) =>
        d.layerPair === 0 ? COLORS.connectionActive : COLORS.connection
      )
      .attr("stroke-width", (d) => (d.layerPair === 0 ? 3 : 2))
      .attr("stroke-opacity", 0.8);

    // Show hidden node values
    nodeCircles.each(function (d) {
      const el = select(this);
      if (d.layer === 0) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.input)
          .attr("stroke", COLORS.input);
        el.select(".node-value")
          .transition()
          .duration(600)
          .attr("opacity", 1)
          .attr("fill", "#fff");
        el.select(".node-value").text(INPUTS[d.index].toFixed(1));
      } else if (d.layer === 1) {
        el.select("circle")
          .transition()
          .duration(600)
          .delay(300)
          .attr("fill", COLORS.hidden)
          .attr("stroke", COLORS.hidden);
        el.select(".node-value")
          .text(HIDDEN_ACT[d.index].toFixed(2))
          .transition()
          .duration(600)
          .delay(300)
          .attr("opacity", 1)
          .attr("fill", "#fff");
      } else {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.node)
          .attr("stroke", COLORS.nodeStroke);
        el.select(".node-value")
          .transition()
          .duration(300)
          .attr("opacity", 0);
      }
    });

    // Animate particles from input to hidden
    animateForwardParticles(0);

    targetLabel.transition().duration(300).attr("opacity", 0);
    errorLabel.transition().duration(300).attr("opacity", 0);
  }

  function step3() {
    // Output appears
    connectionLines
      .transition()
      .duration(600)
      .attr("stroke", COLORS.connectionActive)
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 0.8);

    nodeCircles.each(function (d) {
      const el = select(this);
      if (d.layer === 0) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.input)
          .attr("stroke", COLORS.input);
        el.select(".node-value")
          .attr("opacity", 1)
          .attr("fill", "#fff")
          .text(INPUTS[d.index].toFixed(1));
      } else if (d.layer === 1) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.hidden)
          .attr("stroke", COLORS.hidden);
        el.select(".node-value")
          .attr("opacity", 1)
          .attr("fill", "#fff")
          .text(HIDDEN_ACT[d.index].toFixed(2));
      } else {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.output)
          .attr("stroke", COLORS.output)
          .attr("r", nodeRadius + 4);
        el.select(".node-value")
          .text("0.63")
          .transition()
          .duration(600)
          .attr("opacity", 1)
          .attr("fill", "#232f3e");
      }
    });

    // Show target
    targetLabel.transition().duration(600).delay(300).attr("opacity", 1);
    errorLabel.transition().duration(300).attr("opacity", 0);

    // Animate particles from hidden to output
    animateForwardParticles(1);
  }

  function step4() {
    // Error highlight
    const outputNode = nodes.find((n) => n.layer === 2);
    nodeCircles.each(function (d) {
      const el = select(this);
      if (d.layer === 2) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.error)
          .attr("stroke", COLORS.error)
          .attr("r", nodeRadius + 4);
        el.select(".node-value")
          .attr("opacity", 1)
          .text("0.63");
      }
    });

    connectionLines
      .transition()
      .duration(600)
      .attr("stroke", COLORS.connectionActive)
      .attr("stroke-width", 3)
      .attr("stroke-opacity", 0.6);

    targetLabel.transition().duration(300).attr("opacity", 1);
    errorLabel.transition().duration(600).delay(200).attr("opacity", 1);
    particleGroup.selectAll("*").remove();
  }

  function step5() {
    // Backward pass: gradients flow R->L
    connectionLines
      .transition()
      .duration(600)
      .attr("stroke", (d) =>
        d.layerPair === 1 ? COLORS.connectionBackward : COLORS.connection
      )
      .attr("stroke-width", (d) => (d.layerPair === 1 ? 3 : 2))
      .attr("stroke-opacity", 0.8);

    // Output node stays red
    nodeCircles.each(function (d) {
      const el = select(this);
      if (d.layer === 2) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.error)
          .attr("stroke", COLORS.error);
      } else if (d.layer === 1) {
        el.select("circle")
          .transition()
          .duration(600)
          .delay(300)
          .attr("fill", COLORS.gradient)
          .attr("stroke", COLORS.gradient);
        el.select(".node-value")
          .text(HIDDEN_GRADS[d.index].toFixed(3))
          .transition()
          .duration(600)
          .delay(300)
          .attr("opacity", 1)
          .attr("fill", "#fff");
      } else {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.node)
          .attr("stroke", COLORS.nodeStroke);
      }
    });

    animateBackwardParticles(1);

    targetLabel.transition().duration(300).attr("opacity", 0);
    errorLabel.transition().duration(600).attr("opacity", 1);
  }

  function step6() {
    // Weights update - connections change thickness
    connectionLines
      .transition()
      .duration(800)
      .ease(easeQuadInOut)
      .attr("stroke", COLORS.connectionActive)
      .attr("stroke-width", (d) =>
        Math.max(1, Math.abs(d.weightUpdated) * 8)
      )
      .attr("stroke-opacity", 0.8);

    weightLabels
      .transition()
      .duration(800)
      .attr("opacity", 0.9)
      .tween("text", function (d) {
        const i = interpolateRgb(COLORS.gradient, COLORS.connectionActive);
        const start = d.weight;
        const end = d.weightUpdated;
        return function (t) {
          select(this)
            .text((start + (end - start) * t).toFixed(2))
            .attr("fill", i(t));
        };
      });

    nodeCircles.each(function (d) {
      const el = select(this);
      if (d.layer === 0) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.input)
          .attr("stroke", COLORS.input);
        el.select(".node-value")
          .attr("opacity", 1)
          .attr("fill", "#fff")
          .text(INPUTS[d.index].toFixed(1));
      } else if (d.layer === 1) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.hidden)
          .attr("stroke", COLORS.hidden);
        el.select(".node-value")
          .text(HIDDEN_ACT[d.index].toFixed(2))
          .transition()
          .duration(600)
          .attr("opacity", 1)
          .attr("fill", "#fff");
      } else {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.output)
          .attr("stroke", COLORS.output)
          .attr("r", nodeRadius);
        el.select(".node-value")
          .text("0.63")
          .transition()
          .duration(600)
          .attr("opacity", 1);
      }
    });

    errorLabel.transition().duration(300).attr("opacity", 0);
    targetLabel.transition().duration(300).attr("opacity", 0);
    particleGroup.selectAll("*").remove();
  }

  function step7() {
    // Reset to nice state, all active
    connectionLines
      .transition()
      .duration(600)
      .attr("stroke", COLORS.connectionActive)
      .attr("stroke-width", (d) =>
        Math.max(1.5, Math.abs(d.weightUpdated) * 7)
      )
      .attr("stroke-opacity", 0.7);

    nodeCircles.each(function (d) {
      const el = select(this);
      if (d.layer === 0) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.input)
          .attr("stroke", COLORS.input)
          .attr("r", nodeRadius);
        el.select(".node-value")
          .attr("opacity", 1)
          .attr("fill", "#fff")
          .text(INPUTS[d.index].toFixed(1));
      } else if (d.layer === 1) {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.hidden)
          .attr("stroke", COLORS.hidden)
          .attr("r", nodeRadius);
        el.select(".node-value")
          .text(HIDDEN_ACT[d.index].toFixed(2))
          .attr("opacity", 1)
          .attr("fill", "#fff");
      } else {
        el.select("circle")
          .transition()
          .duration(600)
          .attr("fill", COLORS.output)
          .attr("stroke", COLORS.output)
          .attr("r", nodeRadius);
        el.select(".node-value")
          .text("0.63")
          .attr("opacity", 1)
          .attr("fill", "#232f3e");
      }
    });

    weightLabels
      .transition()
      .duration(600)
      .attr("opacity", 0.6)
      .text((d) => d.weightUpdated.toFixed(2));

    errorLabel.transition().duration(300).attr("opacity", 0);
    targetLabel.transition().duration(300).attr("opacity", 0);
  }

  // ---- Particle animation helpers ----
  function animateForwardParticles(layerPairIdx) {
    particleGroup.selectAll("*").remove();

    const relevantConns = connections.filter(
      (c) => c.layerPair === layerPairIdx
    );

    relevantConns.forEach((conn, i) => {
      const particle = particleGroup
        .append("circle")
        .attr("r", 4)
        .attr("fill", COLORS.connectionActive)
        .attr("opacity", 0.9)
        .attr("cx", conn.source.x)
        .attr("cy", conn.source.y);

      particle
        .transition()
        .duration(800)
        .delay(i * 60)
        .ease(easeQuadInOut)
        .attr("cx", conn.target.x)
        .attr("cy", conn.target.y)
        .attr("opacity", 0)
        .remove();
    });
  }

  function animateBackwardParticles(layerPairIdx) {
    particleGroup.selectAll("*").remove();

    const relevantConns = connections.filter(
      (c) => c.layerPair === layerPairIdx
    );

    relevantConns.forEach((conn, i) => {
      const particle = particleGroup
        .append("circle")
        .attr("r", 4)
        .attr("fill", COLORS.connectionBackward)
        .attr("opacity", 0.9)
        .attr("cx", conn.target.x)
        .attr("cy", conn.target.y);

      particle
        .transition()
        .duration(800)
        .delay(i * 60)
        .ease(easeQuadInOut)
        .attr("cx", conn.source.x)
        .attr("cy", conn.source.y)
        .attr("opacity", 0)
        .remove();
    });
  }

  return {
    step0,
    step1,
    step2,
    step3,
    step4,
    step5,
    step6,
    step7,
  };
}

// ---- Loss Chart ----

export function createLossChart(selector) {
  const container = select(selector);
  if (container.empty()) return null;

  const containerNode = container.node();
  const width = containerNode.clientWidth || 500;
  const height = containerNode.clientHeight || 180;
  const margin = { top: 25, right: 20, bottom: 35, left: 50 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  const svg = container
    .append("svg")
    .attr("id", "loss-svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const xScale = scaleLinear().domain([0, 15]).range([0, innerW]);
  const yScale = scaleLinear().domain([0, 0.55]).range([innerH, 0]);

  // Axes
  // X axis
  g.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${innerH})`)
    .call(function (sel) {
      sel
        .append("line")
        .attr("x1", 0)
        .attr("x2", innerW)
        .attr("stroke", "#232f3e")
        .attr("stroke-width", 1);

      [0, 5, 10, 15].forEach((tick) => {
        sel
          .append("text")
          .attr("x", xScale(tick))
          .attr("y", 20)
          .attr("text-anchor", "middle")
          .attr("font-size", "11px")
          .attr("font-family", "var(--font-main)")
          .attr("fill", "#232f3e")
          .text(tick);

        sel
          .append("line")
          .attr("x1", xScale(tick))
          .attr("x2", xScale(tick))
          .attr("y1", 0)
          .attr("y2", 5)
          .attr("stroke", "#232f3e");
      });
    });

  // X axis label
  g.append("text")
    .attr("x", innerW / 2)
    .attr("y", innerH + 34)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-family", "var(--font-heavy)")
    .attr("fill", "#232f3e")
    .text("Epoca");

  // Y axis
  g.append("g")
    .attr("class", "y-axis")
    .call(function (sel) {
      sel
        .append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", 0)
        .attr("y2", innerH)
        .attr("stroke", "#232f3e")
        .attr("stroke-width", 1);

      [0, 0.1, 0.2, 0.3, 0.4, 0.5].forEach((tick) => {
        sel
          .append("text")
          .attr("x", -8)
          .attr("y", yScale(tick) + 4)
          .attr("text-anchor", "end")
          .attr("font-size", "10px")
          .attr("font-family", "var(--font-main)")
          .attr("fill", "#232f3e")
          .text(tick.toFixed(1));

        sel
          .append("line")
          .attr("x1", -4)
          .attr("x2", 0)
          .attr("y1", yScale(tick))
          .attr("y2", yScale(tick))
          .attr("stroke", "#232f3e");
      });
    });

  // Y axis label
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerH / 2)
    .attr("y", -38)
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .attr("font-family", "var(--font-heavy)")
    .attr("fill", "#232f3e")
    .text("Perda (Loss)");

  // Title
  g.append("text")
    .attr("class", "loss-title")
    .attr("x", innerW / 2)
    .attr("y", -8)
    .attr("text-anchor", "middle")
    .attr("font-size", "14px")
    .attr("font-family", "var(--font-heavy)")
    .attr("fill", "#232f3e")
    .attr("opacity", 0)
    .text("Perda ao Longo das Epocas");

  // Loss line path (starts empty)
  const linePath = g
    .append("path")
    .attr("class", "loss-line")
    .attr("fill", "none")
    .attr("stroke", COLORS.lossLine)
    .attr("stroke-width", 2.5)
    .attr("d", "");

  // Loss area (fill under curve)
  const areaPath = g
    .append("path")
    .attr("class", "loss-area")
    .attr("fill", COLORS.lossFill)
    .attr("d", "");

  // Current epoch dot
  const epochDot = g
    .append("circle")
    .attr("class", "epoch-dot")
    .attr("r", 5)
    .attr("fill", COLORS.lossLine)
    .attr("stroke", "#fff")
    .attr("stroke-width", 2)
    .attr("opacity", 0);

  // Epoch value label
  const epochLabel = g
    .append("text")
    .attr("class", "epoch-label")
    .attr("font-size", "11px")
    .attr("font-family", "var(--font-mono, monospace)")
    .attr("fill", COLORS.lossLine)
    .attr("text-anchor", "middle")
    .attr("opacity", 0);

  function buildPathData(dataSlice) {
    if (dataSlice.length === 0) return "";
    let d = `M ${xScale(dataSlice[0].epoch)} ${yScale(dataSlice[0].loss)}`;
    for (let i = 1; i < dataSlice.length; i++) {
      d += ` L ${xScale(dataSlice[i].epoch)} ${yScale(dataSlice[i].loss)}`;
    }
    return d;
  }

  function buildAreaData(dataSlice) {
    if (dataSlice.length === 0) return "";
    let d = `M ${xScale(dataSlice[0].epoch)} ${yScale(0)}`;
    d += ` L ${xScale(dataSlice[0].epoch)} ${yScale(dataSlice[0].loss)}`;
    for (let i = 1; i < dataSlice.length; i++) {
      d += ` L ${xScale(dataSlice[i].epoch)} ${yScale(dataSlice[i].loss)}`;
    }
    d += ` L ${xScale(dataSlice[dataSlice.length - 1].epoch)} ${yScale(0)} Z`;
    return d;
  }

  function showInitial() {
    // Show just first point
    g.select(".loss-title")
      .transition()
      .duration(600)
      .attr("opacity", 1);

    linePath.attr("d", "");
    areaPath.attr("d", "");

    epochDot
      .transition()
      .duration(600)
      .attr("cx", xScale(0))
      .attr("cy", yScale(0.5))
      .attr("opacity", 1);

    epochLabel
      .transition()
      .duration(600)
      .attr("x", xScale(0) + 15)
      .attr("y", yScale(0.5) - 10)
      .attr("opacity", 1)
      .text("L = 0.50");
  }

  function showUpToEpoch(maxEpoch) {
    const dataSlice = LOSS_CURVE.filter((d) => d.epoch <= maxEpoch);
    const lastPt = dataSlice[dataSlice.length - 1];

    g.select(".loss-title")
      .transition()
      .duration(600)
      .attr("opacity", 1);

    linePath
      .transition()
      .duration(800)
      .ease(easeQuadInOut)
      .attr("d", buildPathData(dataSlice));

    areaPath
      .transition()
      .duration(800)
      .ease(easeQuadInOut)
      .attr("d", buildAreaData(dataSlice));

    epochDot
      .transition()
      .duration(800)
      .ease(easeQuadInOut)
      .attr("cx", xScale(lastPt.epoch))
      .attr("cy", yScale(lastPt.loss))
      .attr("opacity", 1);

    epochLabel
      .transition()
      .duration(800)
      .attr("x", xScale(lastPt.epoch) + 20)
      .attr("y", yScale(lastPt.loss) - 10)
      .attr("opacity", 1)
      .text(`L = ${lastPt.loss.toFixed(3)}`);
  }

  function showFull() {
    showUpToEpoch(15);
  }

  function hide() {
    g.select(".loss-title")
      .transition()
      .duration(300)
      .attr("opacity", 0);
    linePath.transition().duration(300).attr("d", "");
    areaPath.transition().duration(300).attr("d", "");
    epochDot.transition().duration(300).attr("opacity", 0);
    epochLabel.transition().duration(300).attr("opacity", 0);
  }

  return {
    showInitial,
    showUpToEpoch,
    showFull,
    hide,
  };
}
