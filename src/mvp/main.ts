import { PaiEvolutivo } from "./pai-evolutivo.js";


const pai = new PaiEvolutivo(threshold: 10, pontoOtimo: 20);

for (let i = 0; i < 5; i++) {
  console.log(`--- Geração ${i} ---`);
  pai.evoluirParaProximaGeracao();
}

const genealogia = pai.obterDadosGenealogia();
console.log("\nGenealogia:");
console.log(JSON.stringify(genealogia, null, 2));

// Geração de gráfico Mermaid
const mermaid = gerarMermaid(genealogia);
console.log("\n--- Diagrama Mermaid ---");
console.log(mermaid);

function gerarMermaid(dados: ReturnType<PaiEvolutivo['obterDadosGenealogia']>): string {
  if (!dados) return "graph TD\n  A[Sem dados]";
  let graph = "graph TD\n";
  dados.nodes.forEach(n => {
    graph += `  ${n.id}["${n.label}"]\n`;
  });
  dados.edges.forEach(e => {
    graph += `  ${e.source} --> ${e.target}\n`;
  });
  return graph;
}
