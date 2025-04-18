import { DadosGenealogia, NivelEsperanca, Pai } from "./nivel-de-esperanca.js";

type IdGenerator = () => string | number;

export class PaiEvolutivo implements Pai {
  listaDeEsperanca: NivelEsperanca[] = [];

  readonly threshold: number;
  readonly pontoOtimo: number;
  private maxGeneracoes: number;
  private geracaoAtual: number = 0;

  private idGenerator: IdGenerator;
  private genealogia: DadosGenealogia = { nodes: [], edges: [] };

  constructor(threshold: number, pontoOtimo: number, maxGeneracoes = 10, idGenerator?: IdGenerator) {
    this.threshold = threshold;
    this.pontoOtimo = pontoOtimo;
    this.maxGeneracoes = maxGeneracoes;
    this.idGenerator = idGenerator || (() => crypto.randomUUID());
  }

  precisaGerarFilhoInicial(): boolean {
    return this.listaDeEsperanca.length === 0;
  }

  gerarFilhosIniciais(): NivelEsperanca[] {
    const filhos: NivelEsperanca[] = [];
    for (let i = 0; i < 5; i++) {
      const id = this.idGenerator();
      const filho: NivelEsperanca = {
        id,
        pontuacao: Math.floor(Math.random() * 100),
        payload: {
          systemPrompt: "Você é um assistente útil.",
          prompt: `Realize a tarefa ${i}`,
          mcp: {
            tools: ["toolA"],
            algorithms: ["algo1"],
            resources: ["res1"],
            prompts: ["basePrompt"]
          },
          tokens: {
            entrada: 50,
            saida: 100
          }
        }
      };
      filhos.push(filho);
      this.genealogia.nodes.push({ id, label: `ID: ${id}, Score: ${filho.pontuacao}`, pontuacao: filho.pontuacao });
    }
    this.listaDeEsperanca = filhos;
    return filhos;
  }

  realizarCorte(): NivelEsperanca[] {
    const eliminados: NivelEsperanca[] = [];
    this.listaDeEsperanca = this.listaDeEsperanca.filter(filho => {
      const sobrevivente = filho.pontuacao >= this.threshold;
      if (!sobrevivente) eliminados.push(filho);
      return sobrevivente;
    });
    return eliminados;
  }

  gerarNovaGeracao(sobreviventes: NivelEsperanca[]): NivelEsperanca[] {
    const novaGeracao: NivelEsperanca[] = [];

    for (const pai of sobreviventes) {
      let filho: NivelEsperanca;

      if (pai.pontuacao >= this.pontoOtimo) {
        // Clonagem
        filho = this.clonar(pai);
      } else if (pai.pontuacao >= (this.threshold + this.pontoOtimo) / 2) {
        // Mutação leve
        filho = this.mutar(pai, "leve");
      } else {
        // Mutação drástica
        filho = this.mutar(pai, "drastica");
      }

      novaGeracao.push(filho);
    }

    // Cruzamento entre os 2 melhores (elitista)
    const ordenados = [...sobreviventes].sort((a, b) => b.pontuacao - a.pontuacao);
    if (ordenados.length >= 2) {
      const filhoCruzado = this.cruzar(ordenados[0], ordenados[1]);
      novaGeracao.push(filhoCruzado);
    }

    // Atualiza genealogia
    novaGeracao.forEach(filho => {
      this.genealogia.nodes.push({
        id: filho.id,
        label: `ID: ${filho.id}, Score: ${filho.pontuacao}`,
        pontuacao: filho.pontuacao
      });

      filho.payload.parentIds?.forEach(parentId => {
        this.genealogia.edges.push({
          source: parentId,
          target: filho.id
        });
      });
    });

    return novaGeracao;
  }

  evoluirParaProximaGeracao(): void {
    if (this.geracaoAtual >= this.maxGeneracoes) return;
    if (this.precisaGerarFilhoInicial()) {
      this.gerarFilhosIniciais();
    }

    const sobreviventes = this.realizarCorte();
    if (sobreviventes.length === 0) {
      console.warn("Nenhum sobrevivente após corte. Geração estagnada.");
      return;
    }

    const novaGeracao = this.gerarNovaGeracao(sobreviventes);
    this.listaDeEsperanca = novaGeracao;
    this.geracaoAtual++;

    const melhor = Math.max(...novaGeracao.map(n => n.pontuacao));
    if (melhor >= this.pontoOtimo) {
      console.log("Convergência alcançada! Melhor pontuação:", melhor);
    }
  }

  obterDadosGenealogia(): DadosGenealogia | null {
    return this.genealogia.nodes.length === 0 ? null : this.genealogia;
  }

  // --- Estratégias auxiliares ---
  private clonar(pai: NivelEsperanca): NivelEsperanca {
    const novoId = this.idGenerator();
    return {
      id: novoId,
      pontuacao: pai.pontuacao, // Pode ser reavaliado fora
      payload: {
        ...JSON.parse(JSON.stringify(pai.payload)),
        parentIds: [pai.id]
      }
    };
  }

  private mutar(pai: NivelEsperanca, intensidade: "leve" | "drastica"): NivelEsperanca {
    const novoId = this.idGenerator();
    const mutado: NivelEsperanca = {
      id: novoId,
      pontuacao: Math.floor(Math.random() * 100), // precisa ser avaliado externamente
      payload: {
        ...JSON.parse(JSON.stringify(pai.payload)),
        prompt: intensidade === "leve"
          ? pai.payload.prompt + " [ajuste leve]"
          : `Nova tentativa: ${Math.random().toString(36).slice(2)}`,
        parentIds: [pai.id],
        tokens: {
          entrada: pai.payload.tokens.entrada + (intensidade === "leve" ? 5 : 20),
          saida: pai.payload.tokens.saida + (intensidade === "leve" ? 5 : 30)
        }
      }
    };
    return mutado;
  }

  private cruzar(pai1: NivelEsperanca, pai2: NivelEsperanca): NivelEsperanca {
    const novoId = this.idGenerator();
    return {
      id: novoId,
      pontuacao: Math.floor(Math.random() * 100),
      payload: {
        systemPrompt: pai1.payload.systemPrompt,
        prompt: `${pai1.payload.prompt} + ${pai2.payload.prompt}`,
        mcp: {
          tools: [...new Set([...pai1.payload.mcp.tools, ...pai2.payload.mcp.tools])],
          algorithms: [...new Set([...pai1.payload.mcp.algorithms, ...pai2.payload.mcp.algorithms])],
          resources: [...new Set([...pai1.payload.mcp.resources, ...pai2.payload.mcp.resources])],
          prompts: [...new Set([...pai1.payload.mcp.prompts, ...pai2.payload.mcp.prompts])]
        },
        tokens: {
          entrada: (pai1.payload.tokens.entrada + pai2.payload.tokens.entrada) / 2,
          saida: (pai1.payload.tokens.saida + pai2.payload.tokens.saida) / 2
        },
        parentIds: [pai1.id, pai2.id]
      }
    };
  }
}


const pai = new PaiEvolutivo(40, 90, 5);

while (true) {
  pai.evoluirParaProximaGeracao();
  const melhor = Math.max(...pai.listaDeEsperanca.map(n => n.pontuacao));
  if (melhor >= pai.pontoOtimo || pai.listaDeEsperanca.length === 0) break;
}

console.log("Genealogia:", pai.obterDadosGenealogia());