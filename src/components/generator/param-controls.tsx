'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { useEffect } from 'react';
import { useGenerator } from './generator-context';

export function ParamControls() {
  const { model, paramValues, setParamValue, selectedMode } = useGenerator();

  // Auto-switch hidden options: if a selected value becomes hidden, fall back
  useEffect(() => {
    for (const param of model.params) {
      if (param.type !== 'toggle' || !param.options) continue;
      const currentVal = paramValues[param.id] ?? String(param.default);
      const currentOpt = param.options.find((o) => o.value === currentVal);
      if (!currentOpt?.hideWhen) continue;
      const isHidden = Object.entries(currentOpt.hideWhen).every(
        ([pid, pval]) =>
          (paramValues[pid] ??
            String(model.params.find((p) => p.id === pid)?.default ?? '')) ===
          pval
      );
      if (isHidden) {
        const fallback = param.options.find(
          (o) =>
            !o.hideWhen ||
            !Object.entries(o.hideWhen).every(
              ([pid, pval]) =>
                (paramValues[pid] ??
                  String(
                    model.params.find((p) => p.id === pid)?.default ?? ''
                  )) === pval
            )
        );
        if (fallback) setParamValue(param.id, fallback.value);
      }
    }
  }, [paramValues, model.params, setParamValue]);

  if (model.params.length === 0) return null;

  // Reference mode locks speed to Fast
  const isReferenceLocked = selectedMode === 'reference';

  const priceIcon = (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="inline size-3.5 text-muted-foreground ml-1 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top">Affects price</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="space-y-4">
      {model.params.map((param) => {
        const currentValue = paramValues[param.id] ?? String(param.default);

        // Toggle buttons (flat grid)
        if (param.type === 'toggle' && param.options) {
          const locked = isReferenceLocked && param.id === 'model';
          const displayValue = locked ? 'fast' : currentValue;

          // Filter options based on hideWhen conditions
          const visibleOptions = param.options.filter((opt) => {
            if (!opt.hideWhen) return true;
            return !Object.entries(opt.hideWhen).every(
              ([pid, pval]) =>
                (paramValues[pid] ??
                  String(
                    model.params.find((p) => p.id === pid)?.default ?? ''
                  )) === pval
            );
          });

          // Determine grid columns based on visible option count
          const cols =
            visibleOptions.length <= 2
              ? 'grid-cols-2'
              : visibleOptions.length <= 3
                ? 'grid-cols-3'
                : 'grid-cols-4';

          return (
            <div key={param.id} className="space-y-2">
              <Label>
                {param.label}
                {param.affectsPrice && priceIcon}
                {locked && (
                  <span className="text-muted-foreground ml-2 text-xs font-normal">
                    (Reference requires Fast)
                  </span>
                )}
              </Label>
              <div className={`grid ${cols} gap-1.5`}>
                {visibleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={locked}
                    onClick={() => setParamValue(param.id, opt.value)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                      displayValue === opt.value
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                      locked && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          );
        }

        // Number slider + input
        if (
          param.type === 'number' &&
          param.min !== undefined &&
          param.max !== undefined
        ) {
          const numValue = Number(currentValue) || param.min;
          return (
            <div key={param.id} className="space-y-2">
              <Label htmlFor={`param-${param.id}`}>
                {param.label}
                {param.affectsPrice && priceIcon}
                <span className="text-muted-foreground ml-2 text-xs font-normal">
                  {numValue}
                </span>
              </Label>
              <div className="flex items-center gap-3">
                <Slider
                  id={`param-${param.id}`}
                  min={param.min}
                  max={param.max}
                  step={1}
                  value={[numValue]}
                  onValueChange={([v]) => setParamValue(param.id, String(v))}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={param.min}
                  max={param.max}
                  value={numValue}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v >= param.min! && v <= param.max!) {
                      setParamValue(param.id, String(v));
                    }
                  }}
                  className="w-16 text-center"
                />
              </div>
            </div>
          );
        }

        // Select dropdown (fallback)
        if (param.type === 'select' && param.options) {
          return (
            <div key={param.id} className="space-y-2">
              <Label htmlFor={`param-${param.id}`}>
                {param.label}
                {param.affectsPrice && priceIcon}
              </Label>
              <Select
                value={currentValue}
                onValueChange={(v) => setParamValue(param.id, v)}
              >
                <SelectTrigger id={`param-${param.id}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {param.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
