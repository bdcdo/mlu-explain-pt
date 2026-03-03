<script>
  import katexify from "../katexify";
</script>

<section>
  <p class="body-text">
    Ao treinar um modelo de Machine Learning, precisamos encontrar os melhores
    valores para seus parâmetros -- aqueles que minimizam o erro entre as
    predições do modelo e os dados reais. Mas como encontrar esses valores
    ótimos em espaços com milhões de dimensões?
  </p>
  <br />
  <p class="body-text">
    A resposta está no <span class="bold">Gradiente Descendente (Gradient Descent)</span>,
    o algoritmo de otimização mais usado em Machine Learning. A ideia é
    surpreendentemente simples: imagine-se no topo de uma montanha em meio a
    uma neblina densa. Você não consegue ver o vale, mas pode sentir a
    inclinação do terreno sob seus pés. A estratégia natural é dar passos na
    direção onde o terreno desce mais acentuadamente. Isso é exatamente o que o
    gradiente descendente faz.
  </p>
  <br />
  <p class="body-text">
    Formalmente, dada uma <span class="bold">função de custo (loss function)</span>
    {@html katexify("J(w)")} que mede o erro do modelo, o gradiente descendente
    atualiza os pesos iterativamente usando a regra:
  </p>
  <p class="body-text" style="text-align: center; margin: 1.5rem auto;">
    {@html katexify("w_{t+1} = w_t - \\alpha \\nabla J(w_t)", true)}
  </p>
  <p class="body-text">
    onde {@html katexify("\\alpha")} é a <span class="bold">taxa de aprendizado
    (learning rate)</span> e {@html katexify("\\nabla J(w_t)")} é o gradiente
    da função de custo no ponto atual. O sinal negativo indica que nos movemos
    na direção <i>oposta</i> ao gradiente, ou seja, na direção de maior descida.
  </p>
  <br />
  <p class="body-text">
    Role para baixo para explorar visualmente como esse algoritmo funciona
    passo a passo.
  </p>
</section>

<style>
  section {
    padding: 1rem 0 2rem 0;
  }
</style>
