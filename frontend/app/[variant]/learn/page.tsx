"use client";
import { useParams, useRouter } from "next/navigation";
import LearnTutorial from "@/components/LearnTutorial";

// Standalone "How to play" route. The tutorial itself lives in LearnTutorial (also
// reused by the host's Start-Game gate in the guided-learn variant). Here it fills
// the page; finishing or closing returns to the variant's lobby.
export default function LearnPage() {
  const { variant: rawVariant } = useParams<{ variant: string }>();
  const variant =
    rawVariant === "app" ? "app" : rawVariant === "demo-learn" ? "demo-learn" : "demo";
  const router = useRouter();
  const leave = () => router.push(`/${variant}`);

  return <LearnTutorial onComplete={leave} onClose={leave} />;
}
