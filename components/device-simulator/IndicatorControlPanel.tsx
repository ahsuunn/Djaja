import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, LucideIcon } from 'lucide-react';

interface IndicatorControlPanelProps {
  icon: LucideIcon;
  iconColor: string;
  name: string;
  bgColor: string;
  borderColor: string;
  isStreaming: boolean;
  isDisabled: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function IndicatorControlPanel({
  icon: Icon,
  iconColor,
  name,
  bgColor,
  borderColor,
  isStreaming,
  isDisabled,
  onStart,
  onStop,
}: IndicatorControlPanelProps) {
  return (
    <div className={`flex items-center justify-between p-3 ${bgColor} rounded-lg border ${borderColor}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <span className="text-sm font-medium text-slate-700">{name}</span>
      </div>
      {!isStreaming ? (
        <Button
          size="sm"
          onClick={onStart}
          disabled={isDisabled}
          className="h-8"
        >
          <Play className="w-3 h-3 mr-1" />
          Start
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          onClick={onStop}
          className="h-8"
        >
          <Pause className="w-3 h-3 mr-1" />
          Stop
        </Button>
      )}
    </div>
  );
}
