import React, { useState, useEffect, useRef } from 'react';

export const FullscreenImageViewer = ({ src, onClose }: { src: string, onClose: () => void }) => {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(scale * zoomFactor, 10));
    
    // Zoom to mouse cursor
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;
    
    const dx = mouseX - pos.x;
    const dy = mouseY - pos.y;
    
    setPos({
      x: mouseX - dx * (newScale / scale),
      y: mouseY - dy * (newScale / scale)
    });
    setScale(newScale);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button === 1 || e.button === 0) {
      if (e.button === 1) e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY, posX: pos.x, posY: pos.y };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      setPos({
        x: dragStart.current.posX + (e.clientX - dragStart.current.x),
        y: dragStart.current.posY + (e.clientY - dragStart.current.y)
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Close on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[400] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden animate-fade-in"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      {/* Background click catcher to close */}
      <div className="absolute inset-0 z-0" onClick={onClose} />
      
      {/* Draggable/Zoomable Image */}
      <div className="relative z-10 select-none">
        <img 
          src={src} 
          className="max-w-none shadow-2xl rounded-lg" 
          alt="Fullscreen"
          draggable={false}
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            transformOrigin: 'center center',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        />
      </div>
      
      {/* Close Button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
      
      {/* Help Text */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-black/50 text-white/70 text-xs font-medium pointer-events-none">
        Scroll to zoom • Drag to pan
      </div>
    </div>
  );
};
