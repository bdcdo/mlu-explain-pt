<script>
  import katexify from "../katexify";
</script>

<section>
  <h1 class="body-header">Conclusão</h1>
  <p class="body-text">
    O <span class="bold">Gradiente Descendente (Gradient Descent)</span> é um
    dos pilares fundamentais do Machine Learning. Praticamente todo modelo
    moderno -- de regressões lineares a grandes modelos de linguagem -- é
    treinado usando alguma variante desse algoritmo.
  </p>
  <br />
  <p class="body-text">
    Os pontos-chave que exploramos neste artigo:
  </p>
  <br />
  <ul class="body-text" style="padding-left: 1.5rem;">
    <li>
      A <span class="bold">função de custo</span> {@html katexify("J(w)")}
      define a "paisagem" que queremos navegar.
    </li>
    <li>
      O <span class="bold">gradiente</span> {@html katexify("\\nabla J(w)")}
      nos diz a direção de maior crescimento; nos movemos na direção oposta.
    </li>
    <li>
      A <span class="bold">taxa de aprendizado</span> {@html katexify("\\alpha")}
      controla o tamanho dos passos -- muito grande causa divergência, muito
      pequena causa lentidão.
    </li>
    <li>
      Em superfícies <span class="bold">não-convexas</span>, o algoritmo pode
      ficar preso em mínimos locais. Variantes como SGD com momentum, Adam e
      RMSProp ajudam a lidar com isso.
    </li>
  </ul>
  <br />
  <p class="body-text">
    Na prática, variantes estocásticas do gradiente descendente (que usam
    subconjuntos aleatórios dos dados em cada passo) são preferidas por serem
    mais eficientes computacionalmente e por ajudarem a escapar de mínimos
    locais.
  </p>
  <br />
  <p class="body-text">
    <i>
      Este artigo foi adaptado e traduzido para português brasileiro a
      partir do projeto
      <a href="https://mlu-explain.github.io/">MLU-Explain</a>, sob licença
      <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC-BY-SA 4.0</a>.
      Créditos aos autores originais do MLU-Explain.
    </i>
  </p>
  <br /><br />
</section>

<style>
  section {
    padding-bottom: 3rem;
  }

  li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }
</style>
