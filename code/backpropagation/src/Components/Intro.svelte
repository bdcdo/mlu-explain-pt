<script>
  import katexify from "../katexify";
</script>

<section id="intro-text">
  <p class="body-text">
    Como uma rede neural aprende? O segredo esta em um algoritmo chamado
    <strong>retropropagacao (backpropagation)</strong>. Ele e o motor que
    permite que redes neurais ajustem seus pesos internos para fazer
    predicoes cada vez mais precisas.
  </p>
  <br />
  <p class="body-text">
    A ideia central e simples: primeiro, a rede faz uma predicao
    (<em>propagacao direta</em>). Depois, ela mede o quanto errou
    (<em>funcao de perda</em>). Finalmente, ela propaga esse erro de volta
    pela rede, ajustando os pesos de cada conexao para reduzir o erro
    na proxima vez.
  </p>
  <br />
  <p class="body-text">
    Matematicamente, a retropropagacao usa a <strong>regra da cadeia</strong>
    do calculo diferencial para calcular como cada peso individual
    contribui para o erro total. O gradiente
    {@html katexify("\\frac{\\partial L}{\\partial w}")}
    nos diz exatamente o quanto e em que direcao cada peso deve mudar.
  </p>
  <br />
  <p class="body-text">
    Vamos visualizar esse processo passo a passo em uma rede neural
    simples com <strong>2 entradas</strong>, <strong>3 neuronios ocultos</strong>
    e <strong>1 saida</strong>. Role para baixo para acompanhar cada etapa.
  </p>
</section>

<style>
  #intro-text {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 1rem;
  }
</style>
