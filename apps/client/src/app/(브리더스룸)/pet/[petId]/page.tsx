import { petControllerFindOne } from "@repo/api-client";
import PetDetail from "./petDetail";
import { generateQRCode } from "@/lib/utils";

interface PetDetailPageProps {
  params: {
    petId: string;
  };
}

async function PetDetailPage({ params }: PetDetailPageProps) {
  const pet = await petControllerFindOne(params.petId);
  const qrCodeDataUrl = await generateQRCode(`${"http://192.168.45.46:3000"}/pet/${params.petId}`);

  return <PetDetail pet={pet.data} qrCodeDataUrl={qrCodeDataUrl} />;
}

export default PetDetailPage;
