import React from 'react';

/**
 * Utility functions for dark mode support in Recharts
 * Provides colors that adapt to system theme
 */

export const getChartColors = () => {
  const isDark = document.documentElement.classList.contains('dark');
  
  return {
    // Grid and axis colors
    gridColor: isDark ? '#374151' : '#e5e7eb',
    axisColor: isDark ? '#9ca3af' : '#6b7280',
    axisLabelColor: isDark ? '#9ca3af' : '#6b7280',
    
    // Text colors for tooltips/legends
    textColor: isDark ? '#f3f4f6' : '#111827',
    subtleTextColor: isDark ? '#d1d5db' : '#4b5563',
    
    // Card/tooltip background
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderColor: isDark ? '#4b5563' : '#e5e7eb',
    
    // Chart line colors (keeping original brand colors)
    temperature: '#ef4444',
    humidity: '#3b82f6',
    pressure: '#8b5cf6',
    solarPower: '#f59e0b',
    current: '#10b981',
    voltage: '#3b82f6',
  };
};

/**
 * For dynamic color detection, use this hook version
 * in React components to update colors when theme changes
 */
export const useChartColors = () => {
  const [colors, setColors] = React.useState(getChartColors());
  
  React.useEffect(() => {
    setColors(getChartColors());
    
    // Listen for theme changes
    const observer = new MutationObserver(() => {
      setColors(getChartColors());
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  return colors;
};
