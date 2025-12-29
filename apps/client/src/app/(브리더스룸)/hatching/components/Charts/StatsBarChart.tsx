import { ChartContainer } from "@/components/ui/chart";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from "recharts";

interface BarChartDataItem {
  name: string;
  count: number;
  percentage: number;
  fill: string;
}

interface StatsBarChartProps {
  data: BarChartDataItem[];
  itemHeight?: number;
  minHeight?: number;
}

const StatsBarChart = ({ data, itemHeight = 30, minHeight = 150 }: StatsBarChartProps) => {
  if (data.length === 0) return null;

  // 데이터 길이에 따라 높이 계산
  const calculatedHeight = Math.max(data.length * itemHeight, minHeight);

  return (
    <ChartContainer
      config={{
        count: { label: "개수", color: data[0]?.fill ?? "#3b82f6" },
      }}
      className="w-full"
      style={{ height: calculatedHeight }}
    >
      <BarChart data={data} layout="vertical" margin={{ right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={80}
          tick={{
            fontSize: 12,
          }}
        />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
          formatter={(value, _name, item) => {
            const payload = item?.payload as BarChartDataItem;
            if (!payload) return null;
            return [payload.name, ` ${value}마리 (${payload.percentage.toFixed(1)}%)`];
          }}
        />
        <Bar dataKey="count" radius={[12, 12, 12, 12]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList
            dataKey="count"
            position="right"
            className="fill-foreground"
            fontSize={12}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
};

export default StatsBarChart;
