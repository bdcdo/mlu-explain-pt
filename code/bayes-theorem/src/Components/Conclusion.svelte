<script>
  import katexify from "../katexify";
</script>

<section id="conclusion-section">
  <h2 class="body-header">Conclusão</h2>
  <p class="body-text">
    O Teorema de Bayes nos ensina que a interpretação de uma evidência depende
    criticamente do <strong>contexto prévio</strong>. Um teste com 99% de
    sensibilidade pode gerar resultados surprendentemente enganosos quando a
    condição testada é rara.
  </p>
  <p class="body-text">
    Os pontos principais são:
  </p>
  <ul class="body-text conclusion-list">
    <li>
      A <strong>probabilidade a priori (prior)</strong> tem um impacto enorme
      no resultado final. Quando a doença é rara, mesmo testes excelentes
      produzem muitos falsos positivos.
    </li>
    <li>
      Um resultado positivo não é um diagnóstico definitivo. A <strong>probabilidade
      a posteriori (posterior)</strong> pode ser muito menor do que a sensibilidade
      do teste sugere.
    </li>
    <li>
      A <strong>atualização bayesiana</strong> permite refinar nossa crença
      iterativamente. Cada novo teste (ou evidência) atualiza o posterior,
      que se torna o novo prior.
    </li>
    <li>
      Esse raciocínio se aplica muito além da medicina: em filtros de spam,
      sistemas de recomendação, aprendizado de máquina e qualquer situação
      onde queremos inferir causas a partir de observações.
    </li>
  </ul>
  <p class="body-text">
    Em notação formal, o poder do Teorema de Bayes está em inverter
    a direção da probabilidade condicional:
  </p>
  <p class="body-text" style="text-align: center;">
    {@html katexify("P(\\text{causa}|\\text{efeito}) = \\frac{P(\\text{efeito}|\\text{causa}) \\cdot P(\\text{causa})}{P(\\text{efeito})}", true)}
  </p>
  <p class="body-text">
    Conhecemos facilmente {@html katexify("P(\\text{efeito}|\\text{causa})")}
    (se você está doente, qual a chance do teste dar positivo?), mas o que
    realmente queremos saber é {@html katexify("P(\\text{causa}|\\text{efeito})")}
    (se o teste deu positivo, qual a chance de estar doente?). Bayes nos dá
    exatamente essa inversão.
  </p>
</section>

<style>
  #conclusion-section {
    padding-bottom: 2rem;
  }

  .conclusion-list {
    max-width: 600px;
    margin: 0 auto;
    padding-left: 1.5rem;
  }

  .conclusion-list li {
    margin-bottom: 0.75rem;
    line-height: 1.5;
  }

  @media screen and (max-width: 950px) {
    .conclusion-list {
      max-width: 80%;
    }
  }
</style>
