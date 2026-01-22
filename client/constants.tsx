import React from 'react';

// Simple Icon wrapper for consistent sizing
export const Icon = ({ name, className = "", fill = false }: { name: string, className?: string, fill?: boolean }) => (
  <span className={`material-symbols-outlined ${fill ? 'material-fill' : ''} ${className}`}>
    {name}
  </span>
);
