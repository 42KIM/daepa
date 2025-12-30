import { ADOPTION_STATISTICS_COLORS } from "@/app/(브리더스룸)/constants";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PriceRangeItemDto } from "@repo/api-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { formatPrice } from "@/lib/utils";

interface PriceRangeChartProps {
  data: PriceRangeItemDto[];
  onRangeClick?: (range: PriceRangeItemDto) => void;
}

const PRICE_RANGE_COLORS = [
  "#bfdbfe", // 10만원 미만 (blue-200)
  "#93c5fd", // 10-30만원 (blue-300)
  "#60a5fa", // 30-60만원 (blue-400)
  "#3b82f6", // 60-100만원 (blue-500)
  "#2563eb", // 100-200만원 (blue-600)
  "#1d4ed8", // 200-400만원 (blue-700)
  "#1e40af", // 400-1000만원 (blue-800)
  "#1e3a8a", // 1000만원 이상 (blue-900)
];

const PriceRangeChart = ({ data, onRangeClick }: PriceRangeChartProps) => {
  const hasData = data.some((item) => item.count > 0);
  if (!hasData) return null;

  const chartData = data.map((item, index) => ({
    name: item.label,
    분양수: item.count,
    수익: item.revenue,
    평균분양가: item.averagePrice,
    비율: item.percentage,
    fill: PRICE_RANGE_COLORS[index % PRICE_RANGE_COLORS.length],
    original: item,
  }));

  const handleBarClick = (data: (typeof chartData)[0]) => {
    if (onRangeClick && data.original) {
      onRangeClick(data.original);
    }
  };

  return (
    <ChartContainer
      config={{
        분양수: { label: "분양 수", color: ADOPTION_STATISTICS_COLORS.count },
      }}
      className="h-[250px] w-full pt-4"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 15, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  if (name === "수익" || name === "평균분양가") {
                    return `${formatPrice(value as number)}`;
                  }
                  if (name === "비율") {
                    return `${value}%`;
                  }
                  return `${value}마리`;
                }}
              />
            }
          />
          <Bar
            dataKey="분양수"
            radius={[8, 8, 0, 0]}
            cursor="pointer"
            onClick={(data) => handleBarClick(data)}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
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

export default PriceRangeChart;
