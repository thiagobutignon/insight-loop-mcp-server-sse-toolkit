export default function handler(req, res) {
    // Aqui você integraria com seu backend real
    // Por exemplo, chamando uma função que obtém os dados da genealogia do seu sistema
    
    // Simulação de dados para exemplo
    const genealogiaData = {
      nodes: [
        { id: 1, label: "ID: 1 (Eliminado)", pontuacao: 0, status: "falhou" },
        { id: 2, label: "ID: 2 (Eliminado)", pontuacao: 4, status: "falhou" },
        { id: 3, label: "ID: 3", pontuacao: 56, status: "concluido" },
        { id: 4, label: "ID: 4 (Eliminado)", pontuacao: 17, status: "falhou" },
        { id: 5, label: "ID: 5 (Eliminado)", pontuacao: 26, status: "falhou" },
        { id: 6, label: "ID: 6 (Eliminado)", pontuacao: 48, status: "falhou" },
        { id: 7, label: "ID: 7 (Eliminado)", pontuacao: 21, status: "falhou" },
        { id: 8, label: "ID: 8 (Eliminado)", pontuacao: 3, status: "falhou" },
        { id: 9, label: "ID: 9", pontuacao: 95, status: "concluido" },
        { id: 10, label: "ID: 10", pontuacao: 14, status: "falhou" },
        { id: 11, label: "ID: 11", pontuacao: 12, status: "falhou" },
        { id: 12, label: "ID: 12", pontuacao: 88, status: "concluido" },
        { id: 13, label: "ID: 13", pontuacao: 6, status: "falhou" },
        { id: 14, label: "ID: 14", pontuacao: 38, status: "falhou" },
        { id: 15, label: "ID: 15", pontuacao: 36, status: "falhou" }
      ],
      edges: [
        { source: 3, target: 9, label: "mut-drast" },
        { source: 3, target: 10, label: "mut-drast" },
        { source: 3, target: 11, label: "mut-drast" },
        { source: 3, target: 12, label: "mut-drast" },
        { source: 3, target: 13, label: "mut-drast" },
        { source: 3, target: 14, label: "mut-drast" },
        { source: 3, target: 15, label: "mut-drast" }
      ]
    };
  
    // Na sua implementação real, você substituiria o código acima
    // por uma chamada ao seu backend ou banco de dados
    
    // Exemplo de integração com uma função real:
    // const pai = require('../../lib/meuSistema');
    // const dadosGenealogia = pai.obterDadosGenealogia();
    
    res.status(200).json(genealogiaData);
  }