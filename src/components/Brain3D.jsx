import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

const Brain3D = () => {
  const containerRef = useRef(null);
  const brainRef = useRef(null);
  const animationRef = useRef(null);
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0a, 1);
    container.appendChild(renderer.domElement);

    // Load STL
    const loader = new STLLoader();
    loader.load('/brain.stl', (geometry) => {
      geometry.computeBoundingBox();
      geometry.center();

      const box = geometry.boundingBox;
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 3.5 / maxDim;
      geometry.scale(scale, scale, scale);

      // Rotate geometry itself so brain is upright
      geometry.rotateX(-Math.PI / 2);

      // Create edges geometry - only shows outer edges, not internal triangles
      const edges = new THREE.EdgesGeometry(geometry, 15);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.6,
      });

      const brainMesh = new THREE.LineSegments(edges, lineMaterial);
      scene.add(brainMesh);
      brainRef.current = brainMesh;
    });

    // Animation
    const animate = () => {
      if (brainRef.current) {
        if (!isDragging.current) {
          rotationVelocity.current.x *= 0.95;
          rotationVelocity.current.y *= 0.95;

          if (Math.abs(rotationVelocity.current.y) < 0.001) {
            rotationVelocity.current.y = 0.002;
          }

          brainRef.current.rotation.x += rotationVelocity.current.x;
          brainRef.current.rotation.y += rotationVelocity.current.y;
        }
      }

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    const handleMouseDown = (e) => {
      isDragging.current = true;
      previousMouse.current = { x: e.clientX, y: e.clientY };
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current || !brainRef.current) return;

      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;

      brainRef.current.rotation.y += deltaX * 0.01;
      brainRef.current.rotation.x += deltaY * 0.01;

      rotationVelocity.current.y = deltaX * 0.005;
      rotationVelocity.current.x = deltaY * 0.005;

      previousMouse.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      container.style.cursor = 'grab';
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="constellation-container"
      style={{ cursor: 'grab' }}
    />
  );
};

export default Brain3D;
