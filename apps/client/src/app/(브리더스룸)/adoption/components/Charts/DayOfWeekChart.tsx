import { ADOPTION_STATISTICS_COLORS } from "@/app/(브리더스룸)/constants";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatPrice } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";

interface DayOfWeekItem {
  dayOfWeek: number;
  count: number;
  revenue: number;
  averagePrice: number;
}

interface DayOfWeekChartProps {
  data: DayOfWeekItem[];
}

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const DayOfWeekChart = ({ data }: DayOfWeekChartProps) => {
  const hasData = data.some((item) => item.count > 0);
  if (!hasData) return null;

  const chartData = data.map((item) => ({
    name: DAY_NAMES[item.dayOfWeek] ?? "-",
    분양수: item.count,
    수익: item.revenue,
    평균분양가: item.averagePrice,
  }));

  return (
    <ChartContainer
      config={{
        분양수: { label: "분양 수", color: ADOPTION_STATISTICS_COLORS.count },
      }}
      className="h-[250px] w-full pt-4"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 15, left: -20, right: 10 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
          <ChartTooltip
            content={<ChartTooltipContent />}
            formatter={(value, name) => {
              if (name === "수익" || name === "평균분양가") {
                return [name, ` ${(value as number).toLocaleString()}원`];
              }
              return [name, ` ${value}마리`];
            }}
          />
          <Bar dataKey="분양수" fill={ADOPTION_STATISTICS_COLORS.count} radius={[12, 12, 0, 0]}>
            <LabelList
              dataKey="수익"
              position="top"
              formatter={(value: number) => formatPrice(value)}
              style={{ fontSize: 12, fontWeight: 600, fill: "#18a76bff" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default DayOfWeekChart;
