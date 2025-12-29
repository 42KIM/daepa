import { CustomerAnalysisDto } from "@repo/api-client";
import { ChartCard } from "./index";
import { formatPrice } from "@/lib/utils";

interface CustomerAnalysisCardProps {
  data: CustomerAnalysisDto;
}

const CustomerAnalysisCard = ({ data }: CustomerAnalysisCardProps) => {
  if (data.totalCustomers === 0) return null;

  return (
    <ChartCard title="고객 분석">
      <div className="flex flex-col justify-between gap-4 p-2">
        <div className="mt-2 flex justify-center gap-6 text-[15px] text-gray-600">
          <span>
            평균 구매 횟수:{" "}
            <span className="font-bold text-gray-800">{data.averagePurchaseCount}회</span>
          </span>
          <span>
            고객당 평균 지출:{" "}
            <span className="font-bold text-gray-800">
              {formatPrice(data.averageCustomerSpending)}
            </span>
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <AnalysisItem label="총 고객 수" value={`${data.totalCustomers}명`} />
          <AnalysisItem label="재구매 고객" value={`${data.repeatCustomers}명`} />
          <AnalysisItem label="단골 고객 (3회+)" value={`${data.loyalCustomers}명`} />
          <AnalysisItem label="재구매율" value={`${data.repeatRate}%`} />
        </div>
      </div>
    </ChartCard>
  );
};

export default CustomerAnalysisCard;

const AnalysisItem = ({ label, value }: { label: string; value: string }) => {
  return (
    <div
      style={{
        background: "linear-gradient(90deg, rgba(182, 210, 247, .25), rgba(245, 223, 255, .25))",
      }}
      className="rounded-lg bg-gray-50 p-3 text-center"
    >
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
};
