<script>
  import katexify from "../katexify";
</script>

<section id="intro-section">
  <p class="body-text">
    O <strong>Teorema de Bayes (Bayes' Theorem)</strong> e uma das ideias mais
    poderosas da teoria da probabilidade. Ele nos diz como <em>atualizar nossas
    crencas</em> sobre um evento a medida que obtemos novas evidencias.
  </p>
  <p class="body-text">
    Na sua essencia, o teorema responde a pergunta: <em>"Dado que observei uma
    evidencia, qual e a probabilidade de que minha hipotese seja verdadeira?"</em>
  </p>
  <p class="body-text">
    Matematicamente, o Teorema de Bayes e expresso como:
  </p>
  <p class="body-text" style="text-align: center;">
    {@html katexify("P(H|E) = \\frac{P(E|H) \\cdot P(H)}{P(E)}", true)}
  </p>
  <p class="body-text">
    Onde {@html katexify("P(H|E)")} e a <strong>probabilidade a posteriori (posterior)</strong>
    — a probabilidade da hipotese dado que observamos a evidencia.
    {@html katexify("P(E|H)")} e a <strong>verossimilhanca (likelihood)</strong>,
    {@html katexify("P(H)")} e a <strong>probabilidade a priori (prior)</strong>,
    e {@html katexify("P(E)")} e a <strong>probabilidade total da evidencia</strong>.
  </p>
  <p class="body-text">
    Para entender por que isso e tao importante (e contra-intuitivo!), vamos explorar
    um exemplo classico: <strong>um teste medico para uma doenca rara</strong>.
  </p>
</section>

<style>
  #intro-section {
    max-width: 600px;
    margin: 0 auto;
    padding: 1rem;
  }

  #intro-section p {
    margin-bottom: 1rem;
  }
</style>
