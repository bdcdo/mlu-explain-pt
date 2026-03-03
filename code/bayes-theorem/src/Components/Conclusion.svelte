<script>
  import katexify from "../katexify";
</script>

<section id="conclusion-section">
  <h2 class="body-header">Conclusao</h2>
  <p class="body-text">
    O Teorema de Bayes nos ensina que a interpretacao de uma evidencia depende
    criticamente do <strong>contexto previo</strong>. Um teste com 99% de
    sensibilidade pode gerar resultados surprendentemente enganosos quando a
    condicao testada e rara.
  </p>
  <p class="body-text">
    Os pontos principais sao:
  </p>
  <ul class="body-text conclusion-list">
    <li>
      A <strong>probabilidade a priori (prior)</strong> tem um impacto enorme
      no resultado final. Quando a doenca e rara, mesmo testes excelentes
      produzem muitos falsos positivos.
    </li>
    <li>
      Um resultado positivo nao e um diagnostico definitivo. A <strong>probabilidade
      a posteriori (posterior)</strong> pode ser muito menor do que a sensibilidade
      do teste sugere.
    </li>
    <li>
      A <strong>atualizacao bayesiana</strong> permite refinar nossa crenca
      iterativamente. Cada novo teste (ou evidencia) atualiza o posterior,
      que se torna o novo prior.
    </li>
    <li>
      Esse raciocinio se aplica muito alem da medicina: em filtros de spam,
      sistemas de recomendacao, aprendizado de maquina e qualquer situacao
      onde queremos inferir causas a partir de observacoes.
    </li>
  </ul>
  <p class="body-text">
    Em notacao formal, o poder do Teorema de Bayes esta em inverter
    a direcao da probabilidade condicional:
  </p>
  <p class="body-text" style="text-align: center;">
    {@html katexify("P(\\text{causa}|\\text{efeito}) = \\frac{P(\\text{efeito}|\\text{causa}) \\cdot P(\\text{causa})}{P(\\text{efeito})}", true)}
  </p>
  <p class="body-text">
    Conhecemos facilmente {@html katexify("P(\\text{efeito}|\\text{causa})")}
    (se voce esta doente, qual a chance do teste dar positivo?), mas o que
    realmente queremos saber e {@html katexify("P(\\text{causa}|\\text{efeito})")}
    (se o teste deu positivo, qual a chance de estar doente?). Bayes nos da
    exatamente essa inversao.
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
