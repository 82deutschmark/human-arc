/**
 * Author: Sonnet 4
 * Date: 2025-09-22
 * PURPOSE: Size slider component using shadcn/ui Slider for grid cell size control. Replaces the previous custom implementation that violated project standards by using raw HTML inputs with hardcoded colors.
 * SRP and DRY check: Pass. Single responsibility: provide a labeled slider for size selection. Uses standard shadcn/ui components as required.
 */

import React from 'react';
import { Slider } from '@/components/ui/slider';

interface SizeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function SizeSlider({
  value,
  onChange,
  min = 10,
  max = 40,
  step = 1,
  label = 'Example Size'
}: SizeSliderProps) {
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <label className="text-sm font-medium text-foreground whitespace-nowrap">
        {label}
      </label>
      <Slider
        value={[value]}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
      <span className="text-sm font-semibold text-foreground w-8 text-center">{value}px</span>
    </div>
  );
}
