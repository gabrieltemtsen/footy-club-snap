export default function HomePage() {
  return (
    <main className="shell">
      <section className="card">
        <p className="eyebrow">Farcaster Snap</p>
        <h1>Club Finder</h1>
        <p>
          This project serves a feed-native Snap at <code>/api/snap</code>.
        </p>
        <p>
          Use the Farcaster emulator or send an <code>Accept:
          application/vnd.farcaster.snap+json</code> header to test it.
        </p>
      </section>
    </main>
  );
}
