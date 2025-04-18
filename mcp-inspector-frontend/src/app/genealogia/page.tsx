'use client'
import GenealogyGraph from '@/components/genealogy-graph';
import { useEffect, useState } from 'react';

export default function GenealogiaPage() {
  const [genealogiaData, setGenealogiaData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Aqui você pode buscar os dados da sua API ou usar dados estáticos
    // Simulando uma chamada à API
    const fetchData = async () => {
      try {
        // Exemplo: const response = await fetch('/api/genealogia');
        // const data = await response.json();
        
        // Por enquanto, usando os dados fornecidos no exemplo
        const data = {
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
        
        setGenealogiaData(data);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar dados da genealogia:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Visualização da Genealogia</h1>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Carregando dados da genealogia...</p>
        </div>
      ) : genealogiaData ? (
        <GenealogyGraph data={genealogiaData} />
      ) : (
        <div className="flex justify-center items-center h-64">
          <p>Não foi possível carregar os dados da genealogia.</p>
        </div>
      )}
    </div>
  );
}