import React from 'react';

/**
 * A simple toggle switch component.
 */
export const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <div className={`toggle-switch ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} />
);

/**
 * A styled range slider component with a custom accent color gradient.
 */
export const RangeSlider = ({ min, max, step, value, onChange, accent }: any) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <input type="range" min={min} max={max} step={step} value={value} onChange={onChange} className="w-32"
      style={{ background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, rgba(128,128,128,0.2) ${pct}%, rgba(128,128,128,0.2) 100%)` }}
    />
  );
};

/**
 * A layout wrapper for settings rows, providing a label, optional description, and a control element.
 */
export const SR = ({ label, desc, children }: { label: string, desc?: string, children: React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-medium">{label}</div>
      {desc && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</div>}
    </div>
    {children}
  </div>
);
