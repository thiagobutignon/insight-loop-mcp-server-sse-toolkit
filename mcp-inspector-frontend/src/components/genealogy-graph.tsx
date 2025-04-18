
// components/GenealogyGraph.js
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import styles from './genealogy-graph.module.css';

const GenealogyGraph = ({ data }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  
  useEffect(() => {
    if (!data || !data.nodes || !data.edges) return;
    
    // Limpar o SVG existente
    d3.select(svgRef.current).selectAll("*").remove();
    
    // Dimensões do gráfico
    const width = 1000;
    const height = 600;
    
    // Criar o SVG
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // Criar um grupo para os elementos do grafo
    const g = svg.append("g");
    
    // Adicionar zoom
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    
    svg.call(zoom);
    
    // Criar a simulação de forças
    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.edges).id(d => d.id).distance(150))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(60));
    
    // Definir o marcador de seta
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999");
    
    // Criar as arestas
    const link = g.append("g")
      .selectAll("line")
      .data(data.edges)
      .enter()
      .append("line")
      .attr("class", styles.edge)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)");
    
    // Criar os nós
    const node = g.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("circle")
      .attr("class", d => `${styles.node} ${styles[d.status]}`)
      .attr("r", d => Math.max(20, Math.min(40, d.pontuacao / 3 + 15)))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => {
        d3.select(tooltipRef.current)
          .style("opacity", 1)
          .html(`
            <strong>${d.label}</strong><br>
            Pontuação: ${d.pontuacao}<br>
            Status: ${d.status}
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 20) + "px");
      })
      .on("mouseout", () => {
        d3.select(tooltipRef.current).style("opacity", 0);
      })
      .call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
    
    // Adicionar rótulos de ID para os nós
    const nodeLabels = g.append("g")
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append("text")
      .attr("class", styles.nodeLabel)
      .text(d => d.id)
      .attr("dy", ".35em")
      .attr("fill", "white");
    
    // Funções de arrastar
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Atualizar a posição dos elementos a cada "tick" da simulação
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
      
      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
      
      nodeLabels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });
    
    // Centralizar a visualização inicialmente
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8));
  }, [data]);
  
  return (
    <div className={styles.container}>
      <h2>Visualização da Genealogia</h2>
      <div className={styles.graphContainer}>
        <svg ref={svgRef} />
      </div>
      <div className={styles.legendContainer}>
        <h3>Legenda</h3>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.concluido}`}></div>
          <span>Concluído</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.falhou}`}></div>
          <span>Falhou</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.edge}`}></div>
          <span>Relação (mut-drast)</span>
        </div>
      </div>
      <div ref={tooltipRef} className={styles.tooltip}></div>
    </div>
  );
};

export default GenealogyGraph;