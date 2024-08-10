import Image from "next/image";
import { Verify } from "../components/Verify";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Verify />
    </main>
  );
}
