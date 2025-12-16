import { UpdateParentRequestDtoStatus } from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { overlay } from "overlay-kit";
import RejectModal from "./RejectModal";

interface NotificationActionsProps {
  alreadyProcessed: boolean;
  onProcessedRequest: () => void;
  onUpdate: (
    status: UpdateParentRequestDtoStatus,
    rejectReason?: string,
    close?: () => void,
  ) => Promise<void>;
  onClose: () => void;
}

const NotificationActions = ({
  alreadyProcessed,
  onProcessedRequest,
  onUpdate,
  onClose,
}: NotificationActionsProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={(e) => {
          e.preventDefault();
          if (alreadyProcessed) return onProcessedRequest();

          overlay.open(({ isOpen, close }) => (
            <RejectModal
              isOpen={isOpen}
              close={close}
              handleUpdate={async (status, rejectReason) => {
                await onUpdate(status, rejectReason, close);
                onClose();
              }}
            />
          ));
        }}
        variant="outline"
        size="sm"
        className="flex-1"
      >
        거절
      </Button>
      <Button
        onClick={async (e) => {
          e.preventDefault();
          await onUpdate(UpdateParentRequestDtoStatus.APPROVED);
          onClose();
        }}
        size="sm"
        className="flex-1"
      >
        수락
      </Button>
    </div>
  );
};

export default NotificationActions;
