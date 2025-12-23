import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, generateQRCode } from "@/lib/utils";
import { useEffect, useState } from "react";

const QRCode = ({ petId, isScrolled }: { petId: string; isScrolled: boolean }) => {
  const [qrOpen, setQrOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const fetchQrCode = async () => {
      const qrCodeDataUrl = await generateQRCode(petId);
      setQrCodeDataUrl(qrCodeDataUrl);
    };
    fetchQrCode();
  }, [petId]);

  return (
    <div className="ml-auto">
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className={cn(isScrolled ? "text-xs" : "text-sm")}>
            QR
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>펫 프로필 QR 코드</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2">
            {qrCodeDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrCodeDataUrl} alt="QR Code" className="h-[280px] w-[280px]" />
            ) : (
              <div className="text-sm text-gray-500">QR 코드를 생성 중입니다...</div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                if (!qrCodeDataUrl) return;
                const a = document.createElement("a");
                a.href = qrCodeDataUrl;
                a.download = `pet-${petId}-qr.png`;
                a.click();
              }}
            >
              다운로드
            </Button>
            <DialogClose asChild>
              <Button variant="outline">닫기</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QRCode;
