"use client";

export default function GlobalError({
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <main className="appShell">
          <section className="errorState">
            <p className="eyebrow">SynapseNote</p>
            <h1>画面の読み込みに失敗しました</h1>
            <button type="button" onClick={reset}>
              再読み込み
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
