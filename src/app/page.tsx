import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid min-h-screen place-items-center bg-background text-foreground">
      <meta httpEquiv="refresh" content="0;url=/gr-watermark/zh" />
      <Link className="text-sm underline underline-offset-4" href="/zh">
        GR印迹
      </Link>
    </main>
  );
}
