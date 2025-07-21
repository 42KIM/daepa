import { formatDateToYYYYMMDDString } from "@/lib/utils";
import { MatingByDateDto, PetSummaryDto } from "@repo/api-client";
import { ChevronDown, ChevronUp, Plus, Egg, Thermometer } from "lucide-react";
import { overlay } from "overlay-kit";
import { useState } from "react";
import CreateLayingModal from "./CreateLayingModal";
import Link from "next/link";

interface MatingItemProps {
  mating: MatingByDateDto;
  father?: PetSummaryDto;
  mother?: PetSummaryDto;
}

const MatingItem = ({ mating, father, mother }: MatingItemProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleAddLayingClick = () => {
    overlay.open(({ isOpen, close }) => (
      <CreateLayingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        father={father}
        mother={mother}
      />
    ));
  };

  return (
    <div key={mating.id} className="flex flex-col rounded-lg border-2 border-gray-200 p-3">
      <div
        className="flex cursor-pointer items-center justify-between rounded-t-md"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="font-bold">
          {formatDateToYYYYMMDDString(mating.matingDate, "yy년 MM월 dd일")}
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        )}
      </div>
      {isExpanded && (
        <div>
          {mating.layingsByDate &&
            mating.layingsByDate.length > 0 &&
            mating.layingsByDate.map(({ layingDate, layings }) => (
              <div key={layingDate} className="mb-4">
                <div className="mb-2 text-sm font-medium text-gray-600">
                  산란일: {formatDateToYYYYMMDDString(layingDate, "MM/dd")}
                </div>
                <div className="grid gap-2">
                  {layings.map((laying) => (
                    <Link
                      key={laying.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                      href={`/egg/${laying.eggId}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <Egg className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {layings.length}-{laying.layingOrder}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {laying.temperature && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Thermometer className="h-3 w-3" />
                            <span>{laying.temperature}°C</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

          <button
            onClick={handleAddLayingClick}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-100 p-2 font-bold text-blue-800 transition-colors hover:bg-blue-200"
          >
            <Plus className="h-4 w-4" />
            산란 추가
          </button>
        </div>
      )}
    </div>
  );
};

export default MatingItem;
