"use client";

import { useEffect, useRef } from "react";

export function ScrollScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let targetProgress = 0;
    let progress = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      targetProgress = maxScroll ? Math.min(window.scrollY / maxScroll, 1) : 0;
    };

    const draw = (time: number) => {
      progress += (targetProgress - progress) * 0.075;
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#050506";
      context.fillRect(0, 0, width, height);

      const maxDimension = Math.max(width, height);
      const centerX = width / 2 + Math.sin(time * 0.00035) * 10;
      const centerY = height / 2 - progress * height * 0.08;
      const base = Math.min(width, height) * (0.115 + progress * 0.065);
      const layers = 9;

      for (let index = 0; index < layers; index++) {
        const layer = index / (layers - 1);
        const expansion = layer * maxDimension * (0.11 + progress * 0.33);
        const wave = Math.sin(time * 0.001 + index * 0.8) * (1 + progress * 9);
        const rectangleWidth = base + expansion;
        const rectangleHeight = base * 0.58 + expansion * 0.48;
        context.save();
        context.translate(centerX, centerY);
        context.rotate((progress - 0.5) * 0.035 * (layer + 0.2));
        context.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - layer) * (0.72 + progress * 0.28)})`;
        context.shadowColor = "#ffffff";
        context.shadowBlur = 8 * (1 - layer);
        context.lineWidth = Math.max(1, 2.2 - layer * 1.2);
        context.strokeRect(-rectangleWidth / 2 + wave, -rectangleHeight / 2, rectangleWidth, rectangleHeight);
        context.restore();
      }

      const particles = 35;
      for (let index = 0; index < particles; index++) {
        const angle = index * 2.399 + time * 0.0002;
        const radius = base * 1.2 + (index % 11) * (21 + progress * 7);
        const x = centerX + Math.cos(angle) * radius * (1 + progress * 0.4);
        const y = centerY + Math.sin(angle) * radius * 0.54;
        context.fillStyle = `rgba(255,255,255,${0.035 + (index % 4) * 0.018})`;
        context.fillRect(x, y, 1.5, 1.5);
      }

      document.documentElement.style.setProperty("--scroll-progress", progress.toFixed(3));
      animationFrame = requestAnimationFrame(draw);
    };

    resize();
    updateScroll();
    animationFrame = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  return <canvas ref={canvasRef} className="scene" aria-hidden="true" />;
}
