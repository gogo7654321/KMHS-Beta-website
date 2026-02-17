'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { serviceHoursByMonth } from '@/lib/data';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const chartConfig = {
  "Service Hours": {
    label: "Service Hours",
    color: "hsl(var(--primary))",
  },
};

export function ServiceHoursChart() {
  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={serviceHoursByMonth} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
            <YAxis tickLine={false} axisLine={false} tick={{fill: 'hsl(var(--muted-foreground))'}} />
            <Tooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
            <Bar dataKey="Service Hours" fill="var(--color-Service-Hours)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
