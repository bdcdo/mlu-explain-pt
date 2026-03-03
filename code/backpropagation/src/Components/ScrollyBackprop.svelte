<script>
  import { onMount } from "svelte";
  import Scrolly from "./Scrolly.svelte";
  import katexify from "../katexify";
  import { createNeuralNetwork, createLossChart } from "../NeuralNetworkVis";

  let value;
  let nnVis = null;
  let lossVis = null;
  let mounted = false;

  const steps = [
    `<h1 class='step-title'>Passo 0: A Rede Neural</h1>
     <p>Aqui temos uma rede neural simples com <strong>3 camadas</strong>:
     2 neuronios de entrada, 3 neuronios ocultos e 1 neuronio de saida.
     Cada conexao tem um <strong>peso</strong> (weight) associado, que
     determina a forca do sinal transmitido.</p>
     <p>Inicialmente, os pesos sao atribuidos aleatoriamente. A rede
     ainda nao "sabe" nada.</p>`,

    `<h1 class='step-title'>Passo 1: Valores de Entrada</h1>
     <p>Alimentamos a rede com os valores de entrada:
     ${katexify("x_1 = 0{,}5")} e ${katexify("x_2 = 0{,}8")}.</p>
     <p>Esses valores representam os <strong>atributos</strong> (features)
     de um exemplo do nosso conjunto de dados. Note os pesos nas conexoes
     que conectam a entrada a camada oculta.</p>`,

    `<h1 class='step-title'>Passo 2: Propagacao Direta</h1>
     <p>Na <strong>propagacao direta</strong> (forward pass), os dados
     fluem da esquerda para a direita. Cada neuronio oculto calcula
     a <em>soma ponderada</em> das entradas e aplica uma <em>funcao
     de ativacao</em> (sigmoid):</p>
     <p style="text-align:center">${katexify("h = \\sigma(w_1 x_1 + w_2 x_2 + b)", true)}</p>
     <p>Os valores resultantes aparecem nos neuronios da camada oculta.</p>`,

    `<h1 class='step-title'>Passo 3: Saida da Rede</h1>
     <p>O mesmo processo se repete: o neuronio de saida calcula a soma
     ponderada dos valores da camada oculta e aplica a funcao sigmoid.</p>
     <p>O resultado e a <strong>predicao</strong> da rede:
     ${katexify("\\hat{y} = 0{,}63")}. O valor esperado
     (alvo) e ${katexify("y = 1{,}0")}.</p>
     <p>A rede errou. Precisamos quantificar esse erro.</p>`,

    `<h1 class='step-title'>Passo 4: Funcao de Perda</h1>
     <p>A <strong>funcao de perda</strong> (loss function) mede o
     quanto a predicao se afasta do valor real. Usamos o
     <em>erro quadratico medio</em>:</p>
     <p style="text-align:center">${katexify("L = \\frac{1}{2}(y - \\hat{y})^2 = \\frac{1}{2}(1{,}0 - 0{,}63)^2 = 0{,}137", false)}</p>
     <p>Nosso objetivo e <strong>minimizar</strong> essa perda
     ajustando os pesos da rede.</p>`,

    `<h1 class='step-title'>Passo 5: Propagacao Reversa</h1>
     <p>Agora vem o <strong>backpropagation</strong>! Os gradientes
     fluem da saida de volta para a entrada, usando a
     <strong>regra da cadeia</strong>:</p>
     <p style="text-align:center">${katexify("\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}", true)}</p>
     <p>Cada gradiente indica o quanto e em que direcao cada peso
     deve mudar para reduzir a perda.</p>`,

    `<h1 class='step-title'>Passo 6: Atualizacao dos Pesos</h1>
     <p>Com os gradientes calculados, atualizamos os pesos usando a
     regra de <strong>descida do gradiente</strong>:</p>
     <p style="text-align:center">${katexify("w_{\\text{novo}} = w_{\\text{antigo}} - \\eta \\cdot \\frac{\\partial L}{\\partial w}", true)}</p>
     <p>Onde ${katexify("\\eta")} e a <strong>taxa de aprendizado</strong>
     (learning rate). Observe como a espessura das conexoes muda,
     refletindo os novos pesos.</p>`,

    `<h1 class='step-title'>Passo 7: Convergencia</h1>
     <p>Repetimos o ciclo (forward + backward + atualizacao) muitas
     vezes, uma para cada <strong>epoca</strong>. A cada iteracao, a
     perda diminui progressivamente.</p>
     <p>O grafico abaixo mostra a <strong>curva de perda</strong>
     convergindo para zero ao longo de 15 epocas. E assim que redes
     neurais aprendem!</p>`,
  ];

  const target2event = {
    0: () => {
      if (nnVis) nnVis.step0();
      if (lossVis) lossVis.hide();
    },
    1: () => {
      if (nnVis) nnVis.step1();
      if (lossVis) lossVis.hide();
    },
    2: () => {
      if (nnVis) nnVis.step2();
      if (lossVis) lossVis.hide();
    },
    3: () => {
      if (nnVis) nnVis.step3();
      if (lossVis) lossVis.hide();
    },
    4: () => {
      if (nnVis) nnVis.step4();
      if (lossVis) lossVis.showInitial();
    },
    5: () => {
      if (nnVis) nnVis.step5();
      if (lossVis) lossVis.showUpToEpoch(5);
    },
    6: () => {
      if (nnVis) nnVis.step6();
      if (lossVis) lossVis.showUpToEpoch(10);
    },
    7: () => {
      if (nnVis) nnVis.step7();
      if (lossVis) lossVis.showFull();
    },
  };

  $: if (typeof value !== "undefined" && mounted) {
    target2event[value]();
  }

  onMount(() => {
    nnVis = createNeuralNetwork("#nn-container");
    lossVis = createLossChart("#loss-container");
    mounted = true;
  });
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
      <div class="chart-one" id="nn-container"></div>
      <div class="chart-two" id="loss-container"></div>
    </div>
  </div>
</section>

<style>
  .chart-one {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .chart-two {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .spacer {
    height: 40vh;
  }

  .charts-container {
    position: sticky;
    top: 10%;
    display: grid;
    width: 50%;
    grid-template-columns: 100%;
    grid-row-gap: 0.5rem;
    grid-template-rows: 60% 35%;
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
    font-size: 17px;
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
    border: 2px solid var(--default);
  }

  .step.active .step-content {
    background: #f1f3f3ee;
    color: var(--squid-ink);
  }

  .steps-container {
    height: 100%;
    flex: 1 1 40%;
    z-index: 10;
  }

  :global(.step-content .step-title) {
    font-size: 20px;
    margin-bottom: 0.5rem;
    color: var(--primary);
    font-family: var(--font-heavy);
  }

  :global(.step-content p) {
    margin-bottom: 0.5rem;
    font-size: 16px;
    line-height: 1.5;
  }

  :global(.step-content strong) {
    font-family: var(--font-heavy);
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
    }

    .step {
      height: 130vh;
    }

    .step-content {
      width: 95%;
      max-width: 768px;
      font-size: 16px;
      line-height: 1.6;
    }

    .spacer {
      height: 100vh;
    }
  }
</style>
