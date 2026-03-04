<script>
  import katexify from "../katexify";
</script>

<section id="intro-section">
  <p class="body-text">
    O <strong>Teorema de Bayes (Bayes' Theorem)</strong> é uma das ideias mais
    poderosas da teoria da probabilidade. Ele nos diz como <em>atualizar nossas
    crenças</em> sobre um evento à medida que obtemos novas evidências.
  </p>
  <p class="body-text">
    Na sua essência, o teorema responde à pergunta: <em>"Dado que observei uma
    evidência, qual é a probabilidade de que minha hipótese seja verdadeira?"</em>
  </p>
  <p class="body-text">
    Matematicamente, o Teorema de Bayes é expresso como:
  </p>
  <p class="body-text" style="text-align: center;">
    {@html katexify("P(H|E) = \\frac{P(E|H) \\cdot P(H)}{P(E)}", true)}
  </p>
  <p class="body-text">
    Onde {@html katexify("P(H|E)")} é a <strong>probabilidade a posteriori (posterior)</strong>
    — a probabilidade da hipótese dado que observamos a evidência.
    {@html katexify("P(E|H)")} é a <strong>verossimilhança (likelihood)</strong>,
    {@html katexify("P(H)")} é a <strong>probabilidade a priori (prior)</strong>,
    e {@html katexify("P(E)")} é a <strong>probabilidade total da evidência</strong>.
  </p>
  <p class="body-text">
    Para entender por que isso é tão importante (e contra-intuitivo!), vamos explorar
    um exemplo clássico: <strong>um teste médico para uma doença rara</strong>.
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
