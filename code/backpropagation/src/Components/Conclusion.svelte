<script>
  import katexify from "../katexify";
</script>

<section id="conclusion">
  <h1 class="body-header">Conclusão</h1>
  <p class="body-text">
    A retropropagação (backpropagation) é o algoritmo fundamental que permite
    redes neurais aprenderem a partir de dados. O processo pode ser resumido
    em três etapas que se repetem ciclicamente:
  </p>
  <br />
  <ol class="body-text conclusion-list">
    <li>
      <strong>Propagação direta (forward pass)</strong>: os dados de entrada
      fluem pela rede, camada por camada, até gerar uma predição.
    </li>
    <li>
      <strong>Cálculo da perda</strong>: a função de perda quantifica a
      diferença entre a predição e o valor real.
    </li>
    <li>
      <strong>Propagação reversa (backward pass)</strong>: os gradientes da
      perda são propagados de volta pela rede usando a regra da cadeia,
      e os pesos são atualizados por descida do gradiente.
    </li>
  </ol>
  <br />
  <p class="body-text">
    A elegância da retropropagação está na regra da cadeia:
    {@html katexify("\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}")}
    &mdash; ela nos permite calcular eficientemente como cada peso individual
    afeta o erro final, mesmo em redes com milhões de parâmetros.
  </p>
  <br />
  <p class="body-text">
    Este artigo visualizou o processo em uma rede simples (2-3-1), mas o
    mesmo princípio se aplica a arquiteturas muito mais complexas, como redes
    convolucionais (CNNs) e transformers. A retropropagação é, sem exagero,
    o algoritmo que tornou possível a revolução do deep learning.
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
