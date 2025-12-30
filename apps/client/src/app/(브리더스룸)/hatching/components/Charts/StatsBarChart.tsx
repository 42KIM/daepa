import { ChartContainer } from "@/components/ui/chart";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatPrice } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from "recharts";

export interface BarChartDataItem {
  name: string;
  count: number;
  percentage: number;
  fill: string;
  averagePrice?: number;
  totalRevenue?: number;
}

interface StatsBarChartProps {
  data: BarChartDataItem[];
  itemHeight?: number;
  minHeight?: number;
  mode?: "count" | "revenue";
}

const StatsBarChart = ({
  data,
  itemHeight = 25,
  minHeight = 200,
  mode = "count",
}: StatsBarChartProps) => {
  if (data.length === 0) return null;

  // 데이터 길이에 따라 높이 계산
  const calculatedHeight = Math.max(data.length * itemHeight, minHeight);

  const dataKey = mode === "revenue" ? "totalRevenue" : "count";
  const label = mode === "revenue" ? "분양가" : "개수";

  return (
    <ChartContainer
      config={{
        [dataKey]: { label, color: data[0]?.fill ?? "#3b82f6" },
      }}
      className="w-full"
      style={{ height: calculatedHeight }}
    >
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 20, right: mode === "revenue" ? 50 : 20 }}
      >
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
            fontWeight: 500,
          }}
        />
        <ChartTooltip
          content={<ChartTooltipContent hideLabel />}
          formatter={(value, _name, item) => {
            const payload = item?.payload as BarChartDataItem;
            if (!payload) return null;
            if (mode === "revenue") {
              const countText = ` (${payload.count}마리)`;
              const avgText =
                payload.averagePrice !== undefined
                  ? ` | 평균 ${formatPrice(payload.averagePrice)}`
                  : "";
              return [payload.name, ` ${formatPrice(value as number)}원${countText}${avgText}`];
            }
            const priceText =
              payload.averagePrice !== undefined
                ? ` | 평균 ${payload.averagePrice >= 10000 ? `${Math.round(payload.averagePrice / 10000)}만원` : `${payload.averagePrice.toLocaleString()}원`}`
                : "";
            return [payload.name, ` ${value}마리 (${payload.percentage.toFixed(1)}%)${priceText}`];
          }}
        />
        <Bar dataKey={dataKey} radius={[12, 12, 12, 12]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList
            dataKey={dataKey}
            position="right"
            className="fill-foreground"
            fontSize={12}
            fontWeight={600}
            formatter={(value: number) => (mode === "revenue" ? formatPrice(value) : value)}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
};

export default StatsBarChart;
