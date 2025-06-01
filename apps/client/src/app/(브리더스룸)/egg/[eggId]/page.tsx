import { eggControllerFindOne } from "@repo/api-client";
import { notFound } from "next/navigation";
import EggDetail from "../ EggDetail";
interface PetDetailPageProps {
  params: {
    eggId: string;
  };
}

async function PetDetailPage({ params }: PetDetailPageProps) {
  const pet = await eggControllerFindOne(params.eggId);

  if (!pet.data) {
    notFound();
  }

  return <EggDetail egg={pet.data} />;
}

export default PetDetailPage;
