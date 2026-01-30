import { useEffect, useRef, useState } from 'react';
import networkConfig from '../network-config.json';

const NeuralNetwork = () => {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null });
  const animationRef = useRef(null);
  const timeRef = useRef(0);
  const imagesRef = useRef({});
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Load configuration from JSON (editable via Python script)
  const layers = networkConfig.layers;
  const nodeData = networkConfig.nodes || [];
  const style = networkConfig.style || {};
  const nodeRadius = style.nodeRadius || 24;
  const connectionOpacity = style.connectionOpacity || 0.12;
  const heightPercent = style.heightPercent || 0.88;
  const nodeColor = style.nodeColor || "rgba(232, 196, 160, 0.6)";
  const glowColor = style.glowColor || "rgba(232, 196, 160, 0.15)";

  // Preload images
  useEffect(() => {
    nodeData.forEach(node => {
      if (node.coverImage && !imagesRef.current[node.coverImage]) {
        const img = new Image();
        img.src = node.coverImage;
        img.onload = () => {
          imagesRef.current[node.coverImage] = img;
        };
      }
    });
  }, []);

  const getNodeData = (layerIndex, nodeIndex) => {
    return nodeData.find(n => n.layer === layerIndex && n.index === nodeIndex);
  };

  const createNodes = (width, height) => {
    const nodes = [];
    const padding = 80;
    const usableWidth = width - padding * 2;
    const layerSpacing = layers.length > 1 ? usableWidth / (layers.length - 1) : 0;
    
    layers.forEach((nodeCount, layerIndex) => {
      const x = layers.length > 1 ? padding + layerSpacing * layerIndex : width / 2;
      const layerHeight = height * heightPercent;
      const startY = (height - layerHeight) / 2;
      const nodeSpacing = layerHeight / (nodeCount + 1);
      
      for (let i = 0; i < nodeCount; i++) {
        const baseY = startY + nodeSpacing * (i + 1);
        const data = getNodeData(layerIndex, i);
        nodes.push({
          baseX: x,
          baseY: baseY,
          x: x,
          y: baseY,
          layer: layerIndex,
          index: i,
          phase: Math.random() * Math.PI * 2,
          amplitude: 3 + Math.random() * 4,
          frequency: 0.5 + Math.random() * 0.5,
          data: data
        });
      }
    });
    
    return nodes;
  };

  const getConnections = (nodes) => {
    const connections = [];
    
    for (let i = 0; i < layers.length - 1; i++) {
      const currentLayerNodes = nodes.filter(n => n.layer === i);
      const nextLayerNodes = nodes.filter(n => n.layer === i + 1);
      
      currentLayerNodes.forEach(node1 => {
        nextLayerNodes.forEach(node2 => {
          connections.push({ from: node1, to: node2 });
        });
      });
    }
    
    return connections;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      const container = canvas.parentElement;
      canvas.width = container.offsetWidth;
      canvas.height = container.offsetHeight;
      nodesRef.current = createNodes(canvas.width, canvas.height);
    };

    const drawConnections = (connections) => {
      connections.forEach(({ from, to }) => {
        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
        gradient.addColorStop(0, `rgba(232, 196, 160, ${connectionOpacity})`);
        gradient.addColorStop(0.5, `rgba(232, 196, 160, ${connectionOpacity * 1.5})`);
        gradient.addColorStop(1, `rgba(232, 196, 160, ${connectionOpacity})`);
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    const drawNodes = (nodes, hoveredNodeId) => {
      nodes.forEach(node => {
        const isHovered = hoveredNodeId === `${node.layer}-${node.index}`;
        const currentRadius = isHovered ? nodeRadius * 1.15 : nodeRadius;
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(
          node.x, node.y, currentRadius,
          node.x, node.y, currentRadius * 2.5
        );
        glowGradient.addColorStop(0, isHovered ? 'rgba(232, 196, 160, 0.3)' : glowColor);
        glowGradient.addColorStop(1, 'rgba(232, 196, 160, 0)');
        
        ctx.beginPath();
        ctx.arc(node.x, node.y, currentRadius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glowGradient;
        ctx.fill();
        
        // Check if we have a cover image
        const coverImg = node.data?.coverImage ? imagesRef.current[node.data.coverImage] : null;
        
        if (coverImg) {
          // Draw circular clipped image
          ctx.save();
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
          ctx.clip();
          
          // Draw image centered and covering the circle
          const size = currentRadius * 2;
          ctx.drawImage(coverImg, node.x - currentRadius, node.y - currentRadius, size, size);
          ctx.restore();
          
          // Draw border
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered ? 'rgba(232, 196, 160, 0.9)' : nodeColor;
          ctx.lineWidth = isHovered ? 2.5 : 1.5;
          ctx.stroke();
        } else {
          // Draw circle with type indicator
          ctx.beginPath();
          ctx.arc(node.x, node.y, currentRadius, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered ? 'rgba(232, 196, 160, 0.9)' : nodeColor;
          ctx.lineWidth = isHovered ? 2.5 : 1.5;
          ctx.stroke();
          
          // Draw type indicator (small icon/letter)
          if (node.data) {
            const typeColors = {
              project: 'rgba(232, 196, 160, 0.7)',
              experience: 'rgba(160, 200, 232, 0.7)',
              misc: 'rgba(200, 232, 160, 0.7)'
            };
            ctx.fillStyle = typeColors[node.data.type] || nodeColor;
            ctx.font = `${currentRadius * 0.6}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const icons = { project: '◈', experience: '◉', misc: '◇' };
            ctx.fillText(icons[node.data.type] || '○', node.x, node.y);
          }
        }
      });
    };

    const updateNodes = (nodes, time) => {
      const mouse = mouseRef.current;
      
      nodes.forEach(node => {
        // Wave oscillation
        const waveOffset = Math.sin(time * node.frequency + node.phase) * node.amplitude;
        const verticalWave = Math.cos(time * node.frequency * 0.7 + node.phase) * (node.amplitude * 0.5);
        
        let targetX = node.baseX + waveOffset;
        let targetY = node.baseY + verticalWave;
        
        // Cursor attraction (subtle)
        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - node.baseX;
          const dy = mouse.y - node.baseY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;
          
          if (distance < maxDistance) {
            const strength = (1 - distance / maxDistance) * 15;
            targetX += (dx / distance) * strength;
            targetY += (dy / distance) * strength;
          }
        }
        
        // Smooth interpolation to target
        node.x += (targetX - node.x) * 0.1;
        node.y += (targetY - node.y) * 0.1;
      });
    };

    const findNodeAtPosition = (x, y) => {
      for (const node of nodesRef.current) {
        const dx = x - node.x;
        const dy = y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < nodeRadius * 1.2) {
          return node;
        }
      }
      return null;
    };

    const animate = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const nodes = nodesRef.current;
      const connections = getConnections(nodes);
      
      updateNodes(nodes, timeRef.current);
      drawConnections(connections);
      drawNodes(nodes, hoveredNode);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      
      const node = findNodeAtPosition(x, y);
      if (node && node.data) {
        setHoveredNode(`${node.layer}-${node.index}`);
        setTooltipPos({ 
          x: e.clientX, 
          y: e.clientY 
        });
      } else {
        setHoveredNode(null);
      }
    };

    const handleMouseOut = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
      setHoveredNode(null);
    };

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const node = findNodeAtPosition(x, y);
      if (node?.data?.link) {
        window.open(node.data.link, '_blank');
      }
    };

    resize();
    animate();

    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseout', handleMouseOut);
    canvas.addEventListener('click', handleClick);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseout', handleMouseOut);
      canvas.removeEventListener('click', handleClick);
    };
  }, [hoveredNode]);

  // Get hovered node data for tooltip
  const getHoveredNodeData = () => {
    if (!hoveredNode) return null;
    const [layer, index] = hoveredNode.split('-').map(Number);
    return nodeData.find(n => n.layer === layer && n.index === index);
  };

  const hoveredData = getHoveredNodeData();

  return (
    <div className="neural-network-container">
      <canvas ref={canvasRef} className="neural-network-canvas" />
      
      {hoveredData && (
        <div 
          className="node-tooltip"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y + 15
          }}
        >
          <div className="tooltip-header">
            <span className={`tooltip-type tooltip-type-${hoveredData.type}`}>
              {hoveredData.type}
            </span>
            <span className="tooltip-year">{hoveredData.year}</span>
          </div>
          <h4 className="tooltip-title">{hoveredData.title}</h4>
          {hoveredData.role && (
            <p className="tooltip-role">{hoveredData.role} @ {hoveredData.company}</p>
          )}
          <p className="tooltip-desc">{hoveredData.description}</p>
          {hoveredData.tools?.length > 0 && (
            <div className="tooltip-tools">
              {hoveredData.tools.map((tool, i) => (
                <span key={i} className="tooltip-tool">{tool}</span>
              ))}
            </div>
          )}
          {hoveredData.tags?.length > 0 && (
            <div className="tooltip-tags">
              {hoveredData.tags.map((tag, i) => (
                <span key={i} className="tooltip-tag">{tag}</span>
              ))}
            </div>
          )}
          {hoveredData.link && (
            <p className="tooltip-link">Click to view →</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NeuralNetwork;
