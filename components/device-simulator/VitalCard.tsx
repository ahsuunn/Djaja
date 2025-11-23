import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { StatusBadge } from './StatusBadge';
import { StreamingIndicator } from './StreamingIndicator';
import { LucideIcon } from 'lucide-react';

interface VitalCardProps {
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  name: string;
  value: string;
  unit: string;
  status: 'inactive' | 'safe' | 'warning' | 'danger';
  isStreaming: boolean;
  safeRangeText: string;
  widthPercentage: string;
  historyData: Array<{ timestamp: number; value: number }>;
  yDomain: [number, number];
  yTicks: number[];
  gradientFrom: string;
  gradientTo: string;
  chartColor: string;
  streamingColor: string;
}

export function VitalCard({
  icon: Icon,
  iconColor,
  iconBgColor,
  name,
  value,
  unit,
  status,
  isStreaming,
  safeRangeText,
  widthPercentage,
  historyData,
  yDomain,
  yTicks,
  gradientFrom,
  gradientTo,
  chartColor,
  streamingColor,
}: VitalCardProps) {
  return (
    <Card className="border-2 border-slate-200 bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 ${iconBgColor} rounded-lg`}>
              <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600">{name}</p>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{unit}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={status} />
            {isStreaming && (
              <span className="flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-2 w-2 rounded-full ${streamingColor} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${streamingColor.replace('bg-', 'bg-').replace('-400', '-500')}`}></span>
              </span>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Safe Range</span>
            <span className="font-medium">{safeRangeText}</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                status === 'danger' ? 'bg-red-500' :
                status === 'warning' ? 'bg-yellow-500' :
                status === 'safe' ? 'bg-green-500' : 'bg-slate-300'
              }`}
              style={{ width: widthPercentage }}
            />
          </div>
        </div>
        <div className={`h-20 mt-4 bg-gradient-to-b ${gradientFrom} ${gradientTo} rounded-lg`}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <YAxis domain={yDomain} ticks={yTicks} width={30} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Line type="monotone" dataKey="value" stroke={chartColor} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
