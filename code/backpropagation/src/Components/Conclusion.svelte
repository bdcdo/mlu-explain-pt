<script>
  import katexify from "../katexify";
</script>

<section id="conclusion">
  <h1 class="body-header">Conclusao</h1>
  <p class="body-text">
    A retropropagacao (backpropagation) e o algoritmo fundamental que permite
    redes neurais aprenderem a partir de dados. O processo pode ser resumido
    em tres etapas que se repetem ciclicamente:
  </p>
  <br />
  <ol class="body-text conclusion-list">
    <li>
      <strong>Propagacao direta (forward pass)</strong>: os dados de entrada
      fluem pela rede, camada por camada, ate gerar uma predicao.
    </li>
    <li>
      <strong>Calculo da perda</strong>: a funcao de perda quantifica a
      diferenca entre a predicao e o valor real.
    </li>
    <li>
      <strong>Propagacao reversa (backward pass)</strong>: os gradientes da
      perda sao propagados de volta pela rede usando a regra da cadeia,
      e os pesos sao atualizados por descida do gradiente.
    </li>
  </ol>
  <br />
  <p class="body-text">
    A elegancia da retropropagacao esta na regra da cadeia:
    {@html katexify("\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}")}
    &mdash; ela nos permite calcular eficientemente como cada peso individual
    afeta o erro final, mesmo em redes com milhoes de parametros.
  </p>
  <br />
  <p class="body-text">
    Este artigo visualizou o processo em uma rede simples (2-3-1), mas o
    mesmo principio se aplica a arquiteturas muito mais complexas, como redes
    convolucionais (CNNs) e transformers. A retropropagacao e, sem exagero,
    o algoritmo que tornou possivel a revolucao do deep learning.
  </p>
</section>

<style>
  #conclusion {
    padding-bottom: 2rem;
  }

  .conclusion-list {
    padding-left: 1.5rem;
  }

  .conclusion-list li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
</style>
