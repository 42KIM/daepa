import { EggDto } from "@repo/api-client";
import { useRouter } from "next/navigation";

export const TreeView = ({ node }: { node: EggDto }) => {
  const router = useRouter();

  return (
    <button
      className="hover:bg-accent flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm shadow-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
      onClick={() => {
        router.push(`/egg/${node.eggId}`);
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          🥚
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm">{node.name}</h3>
            <div className="min-w-15 flex flex-col gap-1.5">
              {node.father && (
                <span className="rounded-full bg-[#247DFE]/70 px-2 py-0.5 text-xs text-white">
                  부: {node.father.name}
                </span>
              )}
              {node.mother && (
                <span className="rounded-full bg-red-400/70 px-2 py-0.5 text-xs text-white">
                  모: {node.mother.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
