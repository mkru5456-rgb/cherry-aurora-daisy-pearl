import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { VisualNovel } from "@/components/vn/VisualNovel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  if (!ready) {
    return <div className="vn-shell" />;
  }
  return <VisualNovel />;
}
