'use client';
import GenealogyGraph from '@/components/genealogy-graph';
import { useEffect, useState } from 'react';

export default function GenealogiaPage() {
  const [genealogiaData, setGenealogiaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/genealogia');
        const data = await response.json();
        setGenealogiaData(data);
      } catch (error) {
        console.error("Erro ao buscar dados da genealogia:", error);
      } finally {
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
