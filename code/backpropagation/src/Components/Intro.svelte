<script>
  import katexify from "../katexify";
</script>

<section id="intro-text">
  <p class="body-text">
    Como uma rede neural aprende? O segredo está em um algoritmo chamado
    <strong>retropropagação (backpropagation)</strong>. Ele é o motor que
    permite que redes neurais ajustem seus pesos internos para fazer
    predições cada vez mais precisas.
  </p>
  <br />
  <p class="body-text">
    A ideia central é simples: primeiro, a rede faz uma predição
    (<em>propagação direta</em>). Depois, ela mede o quanto errou
    (<em>função de perda</em>). Finalmente, ela propaga esse erro de volta
    pela rede, ajustando os pesos de cada conexão para reduzir o erro
    na próxima vez.
  </p>
  <br />
  <p class="body-text">
    Matematicamente, a retropropagação usa a <strong>regra da cadeia</strong>
    do cálculo diferencial para calcular como cada peso individual
    contribui para o erro total. O gradiente
    {@html katexify("\\frac{\\partial L}{\\partial w}")}
    nos diz exatamente o quanto e em que direção cada peso deve mudar.
  </p>
  <br />
  <p class="body-text">
    Vamos visualizar esse processo passo a passo em uma rede neural
    simples com <strong>2 entradas</strong>, <strong>3 neurônios ocultos</strong>
    e <strong>1 saída</strong>. Role para baixo para acompanhar cada etapa.
  </p>
</section>

<style>
  #intro-text {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 1rem;
  }
</style>
