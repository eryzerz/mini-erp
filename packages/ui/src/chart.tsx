import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface ChartDataPoint {
  [key: string]: string | number;
}

interface ChartProps {
  data: ChartDataPoint[];
  dataKey: string;
  xKey?: string;
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
}

const defaultFormatter = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

export const Chart = ({
  data,
  dataKey,
  xKey = "month",
  height = 280,
  color = "var(--primary)",
  formatValue = defaultFormatter,
}: ChartProps): React.ReactElement => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
      <XAxis dataKey={xKey} tickLine={false} axisLine={false} fontSize={12} tick={{ fill: "var(--muted-foreground)" }} />
      <YAxis
        tickLine={false}
        axisLine={false}
        fontSize={12}
        tick={{ fill: "var(--muted-foreground)" }}
        tickFormatter={(value: number) => formatValue(value)}
      />
      <Tooltip
        cursor={{ fill: "var(--muted)", opacity: 0.3 }}
        contentStyle={{
          backgroundColor: "var(--background)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          fontSize: 12,
        }}
        formatter={(value) => formatValue(Number(value))}
      />
      <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
