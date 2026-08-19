import type { Metadata } from "next";
import { Studio } from "./studio";

export const metadata: Metadata = {
  title: "NodNexa Studio — De referencia a guion",
  description: "Convierte una referencia en un guion original, adaptado a la voz de tu marca, en menos de dos minutos.",
};

export default function Home() {
  return <Studio />;
}
