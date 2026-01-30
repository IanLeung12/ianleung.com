# Neural Network Portfolio Builder
# Run this script to generate the network config for your website
# Each node represents a project, experience, or miscellaneous item

import json
from dataclasses import dataclass, field
from typing import List, Optional, Literal
from enum import Enum

class NodeType(str, Enum):
    PROJECT = "project"
    EXPERIENCE = "experience"
    MISC = "misc"

@dataclass
class Node:
    """Represents a node in the neural network - a project, experience, or misc item"""
    title: str
    year: str
    node_type: NodeType
    description: str
    cover_image: str = ""  # Circle image shown on the node
    main_image: str = ""   # Larger image for expanded view
    link: str = ""
    tags: List[str] = field(default_factory=list)
    company: str = ""      # For experience nodes
    role: str = ""         # For experience nodes
    tools: List[str] = field(default_factory=list)  # For project nodes
    highlights: List[str] = field(default_factory=list)
    
    def to_dict(self):
        return {
            "title": self.title,
            "year": self.year,
            "type": self.node_type.value,
            "description": self.description,
            "coverImage": self.cover_image,
            "mainImage": self.main_image,
            "link": self.link,
            "tags": self.tags,
            "company": self.company,
            "role": self.role,
            "tools": self.tools,
            "highlights": self.highlights
        }

@dataclass 
class Layer:
    """Represents a layer of nodes"""
    nodes: List[Node] = field(default_factory=list)
    label: Optional[str] = None
    
    @property
    def node_count(self):
        return len(self.nodes)

@dataclass
class NetworkStyle:
    """Visual style configuration"""
    node_radius: int = 24
    connection_opacity: float = 0.12
    height_percent: float = 0.88
    node_color: str = "rgba(232, 196, 160, 0.6)"
    connection_color: str = "rgba(232, 196, 160, {opacity})"
    glow_color: str = "rgba(232, 196, 160, 0.15)"
    hover_scale: float = 1.2
    
@dataclass
class NeuralNetworkConfig:
    """Configuration for the neural network portfolio visualization"""
    layers: List[Layer] = field(default_factory=list)
    style: NetworkStyle = field(default_factory=NetworkStyle)
    
    def add_layer(self, label: Optional[str] = None) -> Layer:
        """Add a new layer and return it for adding nodes"""
        layer = Layer(label=label)
        self.layers.append(layer)
        return layer
    
    def add_project(self, layer_index: int, 
                    title: str, 
                    year: str, 
                    description: str,
                    cover_image: str = "",
                    main_image: str = "",
                    link: str = "",
                    tools: List[str] = None,
                    highlights: List[str] = None) -> 'NeuralNetworkConfig':
        """Add a project node to a specific layer"""
        node = Node(
            title=title,
            year=year,
            node_type=NodeType.PROJECT,
            description=description,
            cover_image=cover_image,
            main_image=main_image,
            link=link,
            tools=tools or [],
            highlights=highlights or []
        )
        self._ensure_layer(layer_index)
        self.layers[layer_index].nodes.append(node)
        return self
    
    def add_experience(self, layer_index: int,
                       title: str,
                       year: str,
                       company: str,
                       role: str,
                       description: str,
                       cover_image: str = "",
                       main_image: str = "",
                       link: str = "",
                       highlights: List[str] = None) -> 'NeuralNetworkConfig':
        """Add an experience node to a specific layer"""
        node = Node(
            title=title,
            year=year,
            node_type=NodeType.EXPERIENCE,
            description=description,
            cover_image=cover_image,
            main_image=main_image,
            link=link,
            company=company,
            role=role,
            highlights=highlights or []
        )
        self._ensure_layer(layer_index)
        self.layers[layer_index].nodes.append(node)
        return self
    
    def add_misc(self, layer_index: int,
                 title: str,
                 year: str,
                 description: str,
                 cover_image: str = "",
                 main_image: str = "",
                 link: str = "",
                 tags: List[str] = None) -> 'NeuralNetworkConfig':
        """Add a miscellaneous node to a specific layer"""
        node = Node(
            title=title,
            year=year,
            node_type=NodeType.MISC,
            description=description,
            cover_image=cover_image,
            main_image=main_image,
            link=link,
            tags=tags or []
        )
        self._ensure_layer(layer_index)
        self.layers[layer_index].nodes.append(node)
        return self
    
    def _ensure_layer(self, index: int):
        """Ensure layers exist up to the given index"""
        while len(self.layers) <= index:
            self.layers.append(Layer())
    
    def set_style(self, **kwargs) -> 'NeuralNetworkConfig':
        """Configure visual style"""
        for key, value in kwargs.items():
            if hasattr(self.style, key):
                setattr(self.style, key, value)
        return self
    
    def to_dict(self):
        """Convert to dictionary for JSON export"""
        return {
            "layers": [layer.node_count for layer in self.layers],
            "layerLabels": [layer.label for layer in self.layers],
            "nodes": [
                {
                    "layer": layer_idx,
                    "index": node_idx,
                    **node.to_dict()
                }
                for layer_idx, layer in enumerate(self.layers)
                for node_idx, node in enumerate(layer.nodes)
            ],
            "style": {
                "nodeRadius": self.style.node_radius,
                "connectionOpacity": self.style.connection_opacity,
                "heightPercent": self.style.height_percent,
                "nodeColor": self.style.node_color,
                "connectionColor": self.style.connection_color,
                "glowColor": self.style.glow_color,
                "hoverScale": self.style.hover_scale
            }
        }
    
    def export(self, filepath: str = "src/network-config.json"):
        """Export configuration to JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
        
        total_nodes = sum(layer.node_count for layer in self.layers)
        projects = sum(1 for l in self.layers for n in l.nodes if n.node_type == NodeType.PROJECT)
        experiences = sum(1 for l in self.layers for n in l.nodes if n.node_type == NodeType.EXPERIENCE)
        misc = sum(1 for l in self.layers for n in l.nodes if n.node_type == NodeType.MISC)
        
        print(f"✓ Network config exported to {filepath}")
        print(f"  Layers: {len(self.layers)}")
        print(f"  Total nodes: {total_nodes}")
        print(f"    - Projects: {projects}")
        print(f"    - Experiences: {experiences}")
        print(f"    - Misc: {misc}")


# ===== EDIT YOUR PORTFOLIO BELOW =====

if __name__ == "__main__":
    network = NeuralNetworkConfig()
    
    # Layer 0 - Early projects/experiences
    network.add_experience(
        layer_index=0,
        title="Mesozoic Labs",
        year="2021-2023",
        company="Mesozoic Labs",
        role="Full Stack Developer",
        description="Developed full-stack web applications using modern technologies.",
        cover_image="/images/mesozoic.png",  # Add your images to public/images/
        highlights=["Built REST APIs", "Designed responsive UIs", "Deployed to production"]
    )
    
    network.add_project(
        layer_index=0,
        title="Fossil Finder",
        year="2023",
        description="Data management dashboard for analysis.",
        cover_image="/images/fossil-finder.png",
        tools=["Vue.js", "Python"],
        link="#"
    )
    
    # Layer 1 - Middle timeline
    network.add_project(
        layer_index=1,
        title="Brontosaurus API",
        year="2024",
        description="Scalable backend service. Handles heavy workloads.",
        cover_image="/images/bronto-api.png",
        tools=["Node.js", "Express"],
        link="#"
    )
    
    network.add_misc(
        layer_index=1,
        title="Hackathon Win",
        year="2024",
        description="Won first place at DinoCon Hackathon",
        cover_image="/images/hackathon.png",
        tags=["Award", "Competition"]
    )
    
    network.add_experience(
        layer_index=1,
        title="Jurassic Tech",
        year="2023-Present",
        company="Jurassic Tech",
        role="Lead Developer",
        description="Leading development of core features and mentoring junior developers.",
        cover_image="/images/jurassic.png",
        highlights=["Architected scalable microservices", "Improved performance by 40%", "Led team of 5"]
    )
    
    # Layer 2 - Current/Featured
    network.add_project(
        layer_index=2,
        title="Project T-Rex",
        year="2024",
        description="Data visualization web app. Modern charts and dashboards.",
        cover_image="/images/trex.png",
        main_image="/images/trex-full.png",
        tools=["React", "D3.js"],
        link="#",
        highlights=["Real-time data", "Interactive charts", "Dark mode"]
    )
    
    network.add_misc(
        layer_index=2,
        title="Open Source",
        year="2024",
        description="Contributing to various open source projects",
        cover_image="/images/opensource.png",
        tags=["GitHub", "Community"],
        link="https://github.com/IanLeung12"
    )
    
    # Customize style
    network.set_style(
        node_radius=28,
        connection_opacity=0.12,
        height_percent=0.85,
        hover_scale=1.15
    )
    
    network.export()
