

// --- Implementação Concreta ---

import fs from 'fs';
import path from 'path';
import { callLLM } from './call-llm.js';
import { DadosGenealogia, GenealogiaEdge, GenealogiaNode, NivelEsperanca, Pai, StatusFilho } from "./nivel-de-esperanca.js";
/**
* Implementação concreta da interface Pai.
* Gerencia um ciclo de vida evolutivo para uma população de Niveis de Esperança.
*/
export class PaiConcreto implements Pai {
  listaDeEsperanca: NivelEsperanca[] = [];
  readonly threshold: number;
  readonly pontoOtimo: number;

  // --- Estado Interno ---
  /** Contador para gerar IDs únicos simples. Em produção, pode ser substituído por UUIDs ou outro mecanismo. */
  private proximoIdDisponivel: number = 1;
  /** Armazena o histórico completo para gerar a genealogia. */
  private historicoCompleto: { nodes: Map<number | string, GenealogiaNode>, edges: GenealogiaEdge[] } = { nodes: new Map(), edges: [] };
  /** Contador de gerações para controle de convergência ou limite. */
  numeroGeracaoAtual: number = 0;
  /** Número máximo de gerações como critério de parada (exemplo). */
  readonly maxGeracoes: number;
   /** Tamanho alvo da população para a próxima geração. */
  private readonly tamanhoPopulacaoAlvo: number;

  /**
   * Cria uma instância de PaiConcreto.
   * @param threshold O limiar mínimo de pontuação para sobrevivência.
   * @param pontoOtimo A pontuação considerada ideal.
   * @param tamanhoPopulacaoInicial O número de filhos a serem gerados inicialmente (se nenhum for fornecido).
   * @param maxGeracoes Critério de parada: número máximo de gerações a evoluir.
   * @param populacaoInicial (Opcional) Uma lista inicial de Niveis de Esperança.
   */
  constructor(
      threshold: number,
      pontoOtimo: number,
      tamanhoPopulacaoInicial: number = 10, // Default population size
      maxGeracoes: number = 50, // Default max generations
      private readonly comando: string,
      populacaoInicial?: NivelEsperanca[],
  ) {
      if (threshold < 0 || threshold > pontoOtimo) {
          throw new Error("Threshold deve estar entre 0 e pontoOtimo.");
      }
      if (pontoOtimo <= 0) {
          throw new Error("Ponto Otimo deve ser positivo.");
      }

      this.threshold = threshold;
      this.pontoOtimo = pontoOtimo;
      this.maxGeracoes = maxGeracoes;
      this.tamanhoPopulacaoAlvo = tamanhoPopulacaoInicial; // Mantém o tamanho da população

      if (populacaoInicial && populacaoInicial.length > 0) {
          this.listaDeEsperanca = JSON.parse(JSON.stringify(populacaoInicial)); // Deep copy inicial
          this.numeroGeracaoAtual = 1;
          // Registra população inicial no histórico e garante IDs únicos
          this.listaDeEsperanca.forEach(filho => {
              // Garante que IDs iniciais sejam únicos ou gera novos se necessário
              if (this.historicoCompleto.nodes.has(filho.id)) {
                  console.warn(`ID duplicado ${filho.id} na população inicial. Gerando novo ID.`);
                  filho.id = this.gerarIdUnico();
              } else {
                   // Atualiza o contador de ID se o ID fornecido for numérico e maior que o atual
                   if (typeof filho.id === 'number' && filho.id >= this.proximoIdDisponivel) {
                      this.proximoIdDisponivel = filho.id + 1;
                   }
              }
              this.adicionarNodeAoHistorico(filho);
          });
      } else {
        this.listaDeEsperanca = []
        this.numeroGeracaoAtual = 1; // Geração 1 é a inicial
          // Histórico já adicionado por gerarFilhosIniciais
      }
  }

  async init() {
    if (this.listaDeEsperanca.length === 0) {
      const result = await this.gerarFilhosIniciais(this.tamanhoPopulacaoAlvo);
      this.listaDeEsperanca = result;
      this.numeroGeracaoAtual = 1;
    }
  }

  /** Gera um ID numérico simples e único dentro desta instância. */
  private gerarIdUnico(): number {
      return this.proximoIdDisponivel++;
  }

   /** Adiciona um nó (filho) ao histórico de genealogia. */
  private adicionarNodeAoHistorico(filho: NivelEsperanca): void {
      if (!this.historicoCompleto.nodes.has(filho.id)) {
           const node: GenealogiaNode = {
              id: filho.id,
              label: `ID: ${filho.id}`, // Label simples
              pontuacao: filho.pontuacao,
              status: filho.status
           };
           this.historicoCompleto.nodes.set(filho.id, node);
      } else {
          // Atualiza informações do nó se ele já existe (ex: pontuação, status)
          const node = this.historicoCompleto.nodes.get(filho.id);
          if (node) {
              node.pontuacao = filho.pontuacao;
              node.status = filho.status;
          }
      }
  }

   /** Adiciona uma aresta (relação pai->filho) ao histórico. */
  private adicionarArestaAoHistorico(paiId: number | string, filhoId: number | string, tipo: string = ''): void {
       const edge: GenealogiaEdge = {
          source: paiId,
          target: filhoId,
          label: tipo // Ex: 'clone', 'mutação', 'cruzamento'
       };
       this.historicoCompleto.edges.push(edge);
  }

  // --- Implementação dos Métodos da Interface Pai ---

  realizarCorte(): NivelEsperanca[] {
      const removidos: NivelEsperanca[] = [];
      const sobreviventes: NivelEsperanca[] = [];

      this.listaDeEsperanca.forEach(filho => {
          if (filho.pontuacao < this.threshold && filho.status !== 'lisado') { // Não remove quem já foi lisado
              removidos.push(filho);
              // Atualiza status no histórico para 'falhou' (eliminado por pontuação baixa)
              const node = this.historicoCompleto.nodes.get(filho.id);
              if (node) {
                  node.status = 'falhou'; // Ou um status específico como 'eliminado'
                  node.label += ' (Eliminado)';
              }
          } else {
              sobreviventes.push(filho);
               // Atualiza dados do nó sobrevivente no histórico
               this.adicionarNodeAoHistorico(filho);
          }
      });

      // ATENÇÃO: A interface diz para retornar os removidos, mas para a evolução
      // precisamos dos sobreviventes. A implementação comum de algoritmos genéticos
      // é manter os sobreviventes e descartar os outros.
      // Esta implementação MODIFICA a listaDeEsperanca para conter apenas sobreviventes.
      this.listaDeEsperanca = sobreviventes;

      console.log(`Corte realizado: ${removidos.length} removidos, ${sobreviventes.length} sobreviventes.`);
      return removidos; // Retorna os que foram cortados, conforme a interface.
  }


  gerarNovaGeracao(sobreviventes: NivelEsperanca[]): NivelEsperanca[] {
      const novaGeracao: NivelEsperanca[] = [];
      const numSobreviventes = sobreviventes.length;

      if (numSobreviventes === 0) {
          console.warn("Nenhum sobrevivente para gerar nova geração. Retornando geração vazia.");
          // Poderia gerar aleatórios aqui como recuperação?
          // return this.gerarFilhosIniciais(this.tamanhoPopulacaoAlvo); // Opção
          return [];
      }

      // 1. Elitismo: Mantém os melhores diretamente? (Opcional, mas comum)
      // Ordena por pontuação descendente
      sobreviventes.sort((a, b) => b.pontuacao - a.pontuacao);
      const numElite = Math.min(numSobreviventes, Math.max(1, Math.floor(numSobreviventes * 0.1))); // Ex: top 10% ou pelo menos 1
      for (let i = 0; i < numElite && novaGeracao.length < this.tamanhoPopulacaoAlvo; i++) {
          // Apenas adiciona os melhores da geração anterior à nova
          // Não precisa clonar se eles não forem ser mutados depois
          novaGeracao.push(JSON.parse(JSON.stringify(sobreviventes[i]))); // Copia para evitar refs
          // Não adiciona aresta/nó aqui, pois já existem no histórico
      }

      // 2. Geração dos demais (até atingir tamanhoPopulacaoAlvo)
      while (novaGeracao.length < this.tamanhoPopulacaoAlvo) {
          // Seleciona pais (ex: roleta, torneio - aqui faremos seleção aleatória simples)
          const pai1 = sobreviventes[Math.floor(Math.random() * numSobreviventes)];

          // Decide a operação (ex: 70% mutação, 20% cruzamento, 10% clonagem)
          const chance = Math.random();
          let novoFilho: NivelEsperanca | null = null;
          let tipoOperacao = '';

          if (chance < 0.1 && pai1.pontuacao >= this.pontoOtimo) { // Clonagem dos ótimos (raro)
              novoFilho = this.clonar(pai1);
              tipoOperacao = 'clone';
          } else if (chance < 0.7) { // Mutação (mais comum)
              if (pai1.pontuacao >= (this.threshold + this.pontoOtimo) / 2) { // Mutação Leve (melhores)
                  novoFilho = this.mutarLeve(pai1);
                  tipoOperacao = 'mut-leve';
              } else { // Mutação Drástica (piores entre sobreviventes)
                  novoFilho = this.mutarDrastico(pai1);
                   tipoOperacao = 'mut-drast';
              }
          } else if (numSobreviventes > 1 && chance < 0.9) { // Cruzamento (precisa de 2 pais)
              let pai2 = sobreviventes[Math.floor(Math.random() * numSobreviventes)];
              // Garante que pai2 seja diferente de pai1 (se possível)
              while (numSobreviventes > 1 && pai2.id === pai1.id) {
                  pai2 = sobreviventes[Math.floor(Math.random() * numSobreviventes)];
              }
              novoFilho = this.cruzar(pai1, pai2);
              tipoOperacao = 'cruzamento';
          } else { // Geração Aleatória (para diversidade, menos comum)
              novoFilho = this.gerarNovoAleatorio();
              tipoOperacao = 'aleatorio';
              // Nota: Geração aleatória não tem pais diretos na genealogia desta iteração
          }


          if (novoFilho) {
               // Adiciona ao histórico antes de adicionar à lista
               this.adicionarNodeAoHistorico(novoFilho);
               if (novoFilho.payload.parentIds) {
                   novoFilho.payload.parentIds.forEach(parentId => {
                       this.adicionarArestaAoHistorico(parentId, novoFilho!.id, tipoOperacao);
                   });
               } else if (tipoOperacao === 'aleatorio') {
                   // Poderia ter um nó 'raiz' ou 'geração aleatória' para conectar? Opcional.
               }
               novaGeracao.push(novoFilho);
          } else {
               // Se alguma operação falhar em gerar filho, tenta de novo ou quebra
               // Para simplicidade, vamos apenas continuar (pode levar a loop infinito se sempre falhar)
               console.warn("Falha ao gerar filho para operação:", tipoOperacao);
          }
           // Segurança contra loops infinitos em caso de falha constante
           if (novaGeracao.length >= this.tamanhoPopulacaoAlvo * 2) {
               console.error("Potencial loop infinito detectado em gerarNovaGeracao. Interrompendo.");
               break;
           }
      }

      console.log(`Gerada nova geração com ${novaGeracao.length} filhos.`);
      return novaGeracao;
  }

  evoluirParaProximaGeracao(): void {
      console.log(`\n--- Iniciando Geração ${this.numeroGeracaoAtual + 1} ---`);

      // 0. Verificar condição de parada (convergência)
      if (this.numeroGeracaoAtual > this.maxGeracoes) {
          console.log(`Parada: Número máximo de gerações (${this.maxGeracoes}) atingido.`);
          return;
      }
      const melhorAtual = this.obterMelhorEsperancaAtual(); // Checar se já atingiu o ótimo
      if (melhorAtual && melhorAtual.pontuacao >= this.pontoOtimo) {
           console.log(`Parada: Ponto ótimo (${this.pontoOtimo}) atingido pelo filho ${melhorAtual.id}.`);
           return;
      }

      // 1. Garante população inicial (já feito no construtor, mas checa por segurança)
      if (this.precisaGerarFilhoInicial()) {
          console.warn("Lista de esperança está vazia inesperadamente. Tentando gerar filhos iniciais.");
          // A lógica do construtor já garante isso, mas por robustez:
        //   this.listaDeEsperanca = this.gerarFilhosIniciais(this.tamanhoPopulacaoAlvo);
          this.numeroGeracaoAtual = 1; // Reseta geração se estava vazio
          if (this.listaDeEsperanca.length === 0) {
              console.error("Falha ao gerar filhos iniciais. Interrompendo evolução.");
              return;
          }
      }

      // 2. Avaliação Externa (IMPORTANTE!)
      // !!! A pontuação de cada NivelEsperanca PRECISA ser atualizada ANTES de chamar evoluir !!!
      // Esta classe assume que a avaliação (cálculo da 'pontuacao') acontece externamente
      // entre as chamadas de evoluirParaProximaGeracao().
      // Simulando uma avaliação aleatória para demonstração (REMOVER EM USO REAL):
      // this.listaDeEsperanca.forEach(filho => {
      //     if (filho.status === 'pendente' || filho.status === 'executando') { // Assume que a execução ocorreu
      //        filho.pontuacao = Math.random() * this.pontoOtimo * 1.1; // Pontuação aleatória (pode passar do ótimo)
      //        filho.status = filho.pontuacao >= 0 ? 'concluido' : 'falhou'; // Simula sucesso/falha
      //        this.adicionarNodeAoHistorico(filho); // Atualiza histórico com nova pontuação/status
      //     }
      // });
      // !!! FIM DA SIMULAÇÃO DE AVALIAÇÃO !!!

      // 3. Realizar Corte (Seleção Natural)
      // Nota: realizarCorte() já atualiza this.listaDeEsperanca para conter apenas sobreviventes.
      this.realizarCorte();
      const sobreviventes = this.listaDeEsperanca; // Agora contém apenas os que passaram

      // 4. Gerar Nova Geração (Reprodução e Mutação)
      const novaGeracao = this.gerarNovaGeracao(sobreviventes);

      // 5. Atualizar População
      this.listaDeEsperanca = novaGeracao;
      this.numeroGeracaoAtual++;

      console.log(`--- Fim da Geração ${this.numeroGeracaoAtual -1}. População atual: ${this.listaDeEsperanca.length} ---`);

       // 6. Checar estagnação (opcional, mais complexo)
       // Se a melhor pontuação não melhora por X gerações, pode parar ou aumentar mutação.
  }

  precisaGerarFilhoInicial(): boolean {
      return !this.listaDeEsperanca || this.listaDeEsperanca.length === 0;
  }

  async gerarFilhosIniciais(tamanhoPopulacao: number = 10): Promise<NivelEsperanca[]> {
      console.log(`------ comando ${this.comando}`)
      console.log(`Gerando ${tamanhoPopulacao} filhos iniciais...`);

      const oraculoSystemPrompt = `Você é o Oráculo, uma inteligência que não executa tarefas, apenas as planeja.

Sua função é estruturar **variações da mesma tarefa principal** a serem realizadas por assistentes inteligentes. Cada variação será enviada para um "filho", que será gerado a partir da sua resposta.

### Requisitos da Resposta:

Você **deve retornar exclusivamente um JSON** contendo uma **lista de objetos**, cada um com os seguintes campos:

- **systemPrompt**: define o papel do assistente, sua personalidade, limitações e estilo.
- **prompt**: define a tarefa exata que o assistente deve realizar, com as instruções claras.

---

### Regras obrigatórias:

1. Você **não executa a tarefa**.
2. Você deve analisar a tarefa original enviada pelo usuário e gerar **de 3 a 7 variações** dessa tarefa, cada uma com um foco, abordagem ou perspectiva diferente.
3. Todas as tarefas devem estar alinhadas com o mesmo objetivo central, mas podem divergir em método, profundidade, tom ou formato.
4. A linguagem deve ser clara, profissional e objetiva.
5. A resposta deve ser **exatamente neste formato**:

\`\`\`json
[
  {
    "systemPrompt": "[instruções sobre quem é o assistente e como deve agir]",
    "prompt": "[tarefa clara, específica e contextualizada que o assistente deve executar]"
  },
  ...
]
\`\`\`

---

### Exemplo de entrada (você receberá algo assim para processar):

Tarefa: "Qual a cor do céu?"

Sua saída deve conter múltiplas interpretações ou formas de abordar essa mesma pergunta (científica, poética, simplificada, infantil, etc.).

Agora, processe a seguinte tarefa e retorne o JSON estruturado:  
[TAREFA AQUI]
`;

    /**
     * TODO: Ele precisa se conectar ao MCP para receber o prompt inicial. Teremos que ter um MCP Server do ORACULO!
     * 
     *      
     */

      const oraculo = await callLLM(oraculoSystemPrompt, "Qual a cor do ceu?") as {systemPrompt: string, prompt: string}[]
      
      const iniciais: NivelEsperanca[] = [];
      for (let i = 0; i < oraculo.length; i++) {
          const novoId = this.gerarIdUnico();
          const filhoInicial: NivelEsperanca = {
              id: novoId,
              pontuacao: 0, // Pontuação inicial antes da primeira avaliação
              status: 'pendente',
              payload: {
                  // Payloads iniciais precisam ser definidos baseados no problema
                  // Exemplo genérico:
                  systemPrompt: oraculo[i].systemPrompt,
                  prompt: oraculo[i].prompt, // Prompts variados são melhores
                  mcp: { tools: [], algorithms: [], resources: [], prompts: [] },
                  tokens: { entrada: 0, saida: 0 }, // Zerado inicialmente
                  // parentIds: [], // Geração inicial não tem pais
              }
          };
          iniciais.push(filhoInicial);
          // Adiciona ao histórico
          this.adicionarNodeAoHistorico(filhoInicial);
      }
      this.listaDeEsperanca = iniciais; // Define a lista principal
      return iniciais;
  }

  obterDadosGenealogia(): DadosGenealogia | null {
      if (this.historicoCompleto.nodes.size === 0) {
          return null;
      }
      // Converte o Map de nós para um array
      const nodesArray = Array.from(this.historicoCompleto.nodes.values());
      return {
          nodes: nodesArray,
          edges: [...this.historicoCompleto.edges] // Retorna cópia das arestas
      };
  }

  // --- Métodos Auxiliares para Operações Genéticas (Placeholders) ---

  /** Cria uma cópia exata (clone) de um NivelEsperanca pai. */
  private clonar(pai: NivelEsperanca): NivelEsperanca {
      const novoId = this.gerarIdUnico();
      const clone: NivelEsperanca = {
          // Deep copy para evitar referências compartilhadas, especialmente no payload
          ...JSON.parse(JSON.stringify(pai)),
          id: novoId,
          status: 'pendente', // Novo filho sempre começa pendente
          pontuacao: 0, // Reseta pontuação para a nova avaliação
          payload: {
              ...JSON.parse(JSON.stringify(pai.payload)),
              parentIds: [pai.id], // Registra o pai
              resultadoExecucao: undefined, // Limpa resultado anterior
              motivoFalhaOuLise: undefined // Limpa motivo anterior
          }
      };
      console.log(`Clonado: ${pai.id} -> ${novoId}`);
      return clone;
  }

  /** Aplica uma pequena modificação no payload do pai. */
  private mutarLeve(pai: NivelEsperanca): NivelEsperanca {
      const novoId = this.gerarIdUnico();
      const filhoMutado: NivelEsperanca = {
           // Deep copy
          ...JSON.parse(JSON.stringify(pai)),
          id: novoId,
          status: 'pendente',
          pontuacao: 0,
          payload: {
              ...JSON.parse(JSON.stringify(pai.payload)),
              parentIds: [pai.id],
              resultadoExecucao: undefined,
              motivoFalhaOuLise: undefined,
               // --- LÓGICA DE MUTAÇÃO LEVE (Exemplo: ajustar prompt) ---
               prompt: pai.payload.prompt + " (levemente ajustado)", // Placeholder
               // TODO: Implementar lógica real de mutação leve (ex: mudar uma palavra, ajustar parâmetro)
               // Poderia também ajustar recursos MCP levemente.
               // Exemplo: mcp: { ...pai.payload.mcp, tools: this.mutarListaLeve(pai.payload.mcp.tools) }
          }
      };
       console.log(`Mutação Leve: ${pai.id} -> ${novoId}`);
      return filhoMutado;
  }

   /** Aplica uma modificação significativa no payload do pai. */
  private mutarDrastico(pai: NivelEsperanca): NivelEsperanca {
      const novoId = this.gerarIdUnico();
      const filhoMutado: NivelEsperanca = {
          // Deep copy
          ...JSON.parse(JSON.stringify(pai)),
          id: novoId,
          status: 'pendente',
          pontuacao: 0,
          payload: {
              ...JSON.parse(JSON.stringify(pai.payload)),
              parentIds: [pai.id],
              resultadoExecucao: undefined,
              motivoFalhaOuLise: undefined,
               // --- LÓGICA DE MUTAÇÃO DRÁSTICA (Exemplo: mudar system prompt ou prompt significativamente) ---
               systemPrompt: "Tente uma abordagem completamente diferente.", // Placeholder
               prompt: `Nova tentativa radical baseada na tarefa original ${Math.random().toFixed(3)}.`, // Placeholder
               // TODO: Implementar lógica real de mutação drástica (ex: trocar algoritmo, usar ferramentas diferentes)
               // Exemplo: mcp: this.gerarMcpAleatorio(),
          }
      };
      console.log(`Mutação Drástica: ${pai.id} -> ${novoId}`);
      return filhoMutado;
  }

   /** Combina informações de dois pais para criar um novo filho. */
  private cruzar(pai1: NivelEsperanca, pai2: NivelEsperanca): NivelEsperanca {
      const novoId = this.gerarIdUnico();
      const filhoCruzado: NivelEsperanca = {
          // Começa com a estrutura de um dos pais (ex: pai1)
          ...JSON.parse(JSON.stringify(pai1)),
          id: novoId,
          status: 'pendente',
          pontuacao: 0,
          payload: {
               // Deep copy do payload base (pai1)
              ...JSON.parse(JSON.stringify(pai1.payload)),
              parentIds: [pai1.id, pai2.id], // Registra ambos os pais
              resultadoExecucao: undefined,
              motivoFalhaOuLise: undefined,

               // --- LÓGICA DE CRUZAMENTO (Exemplo: combinar prompts e recursos MCP) ---
              // Exemplo simples: pega systemPrompt de pai1 e prompt de pai2
              systemPrompt: pai1.payload.systemPrompt, // Ou combina de alguma forma
              prompt: pai2.payload.prompt, // Ou combina de alguma forma

              // Exemplo: combina recursos MCP (união simples, sem duplicatas)
              mcp: {
                  tools: [...new Set([...pai1.payload.mcp.tools, ...pai2.payload.mcp.tools])],
                  algorithms: [...new Set([...pai1.payload.mcp.algorithms, ...pai2.payload.mcp.algorithms])],
                  resources: [...new Set([...pai1.payload.mcp.resources, ...pai2.payload.mcp.resources])],
                  prompts: [...new Set([...pai1.payload.mcp.prompts, ...pai2.payload.mcp.prompts])]
              },

               // TODO: Implementar lógica real de cruzamento mais sofisticada.
          }
      };
       console.log(`Cruzamento: ${pai1.id} + ${pai2.id} -> ${novoId}`);
      return filhoCruzado;
  }

   /** Gera um NivelEsperanca completamente novo, sem pais diretos nesta geração. */
  private gerarNovoAleatorio(): NivelEsperanca {
      const novoId = this.gerarIdUnico();
      const filhoAleatorio: NivelEsperanca = {
          id: novoId,
          pontuacao: 0,
          status: 'pendente',
          payload: {
              // --- LÓGICA DE GERAÇÃO ALEATÓRIA ---
              systemPrompt: "Sou um agente IA totalmente novo e aleatório.", // Placeholder
              prompt: `Tarefa gerada aleatoriamente: ${Math.random().toString(36).substring(7)}`, // Placeholder
              mcp: this.gerarMcpAleatorio(), // Função auxiliar para gerar recursos
              tokens: { entrada: 0, saida: 0 },
              // parentIds: [], // Sem pais nesta geração
              resultadoExecucao: undefined,
              motivoFalhaOuLise: undefined,
          }
      };
       console.log(`Geração Aleatória -> ${novoId}`);
      return filhoAleatorio;
  }

  /** Função auxiliar para gerar um conjunto aleatório de recursos MCP (Placeholder) */
  private gerarMcpAleatorio(): NivelEsperanca['payload']['mcp'] {
       // TODO: Substituir por lógica que seleciona recursos MCP válidos aleatoriamente
      const allTools = ["toolA", "toolB", "toolC"];
      const allAlgs = ["algX", "algY"];
      return {
          tools: Math.random() > 0.5 ? [allTools[Math.floor(Math.random() * allTools.length)]] : [],
          algorithms: Math.random() > 0.5 ? [allAlgs[Math.floor(Math.random() * allAlgs.length)]] : [],
          resources: Math.random() > 0.7 ? ["resource1"] : [],
          prompts: Math.random() > 0.8 ? ["prompt_template_Z"] : []
      };
  }

   // --- Outros métodos úteis (não na interface Pai, mas podem ser necessários) ---

  /** Retorna o melhor NivelEsperanca da população atual. */
  public obterMelhorEsperancaAtual(): NivelEsperanca | null {
      if (this.listaDeEsperanca.length === 0) {
          return null;
      }
      // Encontra o filho com a maior pontuação
      return this.listaDeEsperanca.reduce((melhor, atual) =>
          atual.pontuacao > melhor.pontuacao ? atual : melhor
      , this.listaDeEsperanca[0]);
  }

   /** Permite atualizar manualmente a pontuação de um filho pelo seu ID. */
  public atualizarPontuacaoFilho(id: number | string, pontuacao: number, status: StatusFilho, resultado?: any, motivoFalha?: string) {
      const filho = this.listaDeEsperanca.find(f => f.id === id);
      if (filho) {
          filho.pontuacao = pontuacao;
          filho.status = status;
          if (resultado !== undefined) filho.payload.resultadoExecucao = resultado;
          if (motivoFalha !== undefined) filho.payload.motivoFalhaOuLise = motivoFalha;
          // Atualiza também no histórico
          this.adicionarNodeAoHistorico(filho);
      } else {
          console.warn(`Tentativa de atualizar pontuação para filho não encontrado: ${id}`);
      }
  }
}

async function rodarEvolucao() {
  console.log("Criando instância do Pai...");
  const pai = new PaiConcreto(
      50,
      95,
      8,
      10,
      "gerar uma frase utilizando tres palavras"
  );

  await pai.init()

  console.log("População Inicial:");
  pai.listaDeEsperanca.forEach(f => console.log(` - ID: ${f.id}, Prompt: ${f.payload.prompt}`));

  for (let i = 0; i < 10; i++) { // Simula 10 ciclos de evolução
      console.log(`\n--- Ciclo de Avaliação e Evolução ${i + 1} ---`);

      // 1. SIMULAÇÃO: Executar tarefas e avaliar (NORMALMENTE EXTERNO)
      // Em um cenário real, aqui você pegaria cada filho 'pendente',
      // chamaria um sistema externo (LLM, etc.) com seu payload,
      // receberia o resultado, calcularia a pontuação, e atualizaria o NivelEsperanca.
      console.log("Simulando execução e avaliação dos filhos...");
      for (const filho of pai.listaDeEsperanca) {
           if (filho.status === 'pendente') {
               // Simula uma pontuação aleatória
               const pontuacao = Math.floor(Math.random() * 110); // 0-109
               const sucesso = pontuacao >= 0; // Assume falha se negativo (não usado aqui)
               const status: StatusFilho = pontuacao >= 50 ? 'concluido' : 'falhou';
               pai.atualizarPontuacaoFilho(filho.id, pontuacao, status, `Resultado simulado para ${filho.id}`);
               console.log(` -> Filho ${filho.id} avaliado: Pontuação=${pontuacao}, Status=${status}`);
           }
      }

      // 2. Evoluir para a próxima geração
      pai.evoluirParaProximaGeracao();

      // Verifica se atingiu ponto ótimo ou max gerações (a própria evoluir faz isso)
       const melhor = pai.obterMelhorEsperancaAtual();
      if (melhor && melhor.pontuacao >= pai.pontoOtimo) {
          console.log(`\n!!! Solução ótima encontrada na geração ${pai.numeroGeracaoAtual} !!!`);
          console.log(melhor);
          break;
      }
       if (pai.numeroGeracaoAtual > pai.maxGeracoes) {
           console.log("\n!!! Limite de gerações atingido !!!");
           break;
       }
      if (pai.listaDeEsperanca.length === 0) {
           console.log("\n!!! População extinta !!!");
           break;
      }
  }

  console.log("\n--- Evolução Concluída ---");
  const melhorFinal = pai.obterMelhorEsperancaAtual();
  if (melhorFinal) {
      console.log("Melhor filho encontrado:");
      console.log(melhorFinal);
  } else {
      console.log("Nenhum filho sobreviveu.");
  }

  // 3. Obter dados da genealogia para visualização
  const dadosGenealogia = pai.obterDadosGenealogia();
  if (dadosGenealogia) {
      console.log("\n--- Dados da Genealogia ---");
      console.log("Nós:", dadosGenealogia.nodes.length);
      console.log(JSON.stringify(dadosGenealogia.nodes, null, 2)); // Descomente para ver detalhes
      console.log("Arestas:", dadosGenealogia.edges.length);
      console.log(JSON.stringify(dadosGenealogia.edges, null, 2)); // Descomente para ver detalhes
      // Estes dados podem ser usados com bibliotecas como D3.js, Vis.js, etc. para desenhar o grafo.

      const filename = `genealogia.json`;
      const filePath = path.join('./mcp-inspector-frontend/src/app', 'logs', filename); // pasta logs no mesmo diretório

      const dataToSave = {
        nodes: dadosGenealogia.nodes,
        edges: dadosGenealogia.edges,
      };

      // Garante que a pasta 'logs' existe
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      // Salva o arquivo
      fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      console.log(`Arquivo salvo em: ${filePath}`);
  }
}

(async () => {
    try {
        await rodarEvolucao();
    } catch (err) {
      console.error('Erro na evolução:', err);
      process.exit(1);
    }
  })();
