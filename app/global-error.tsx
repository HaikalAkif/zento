'use client';

// Last line of defence: errors thrown in the root layout itself, which app/error.tsx
// can't catch because it renders inside that layout. Must bring its own <html>.

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: '#0d110f',
          color: '#ece7da',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: 420, padding: 24 }}>
          <p style={{ color: '#ff8a80', fontSize: 13, margin: 0 }}>Something went wrong</p>
          <h1
            style={{ fontSize: 28, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 0' }}
          >
            Zento couldn&apos;t load.
          </h1>
          {error.digest && (
            <p style={{ color: '#8d897d', fontSize: 13, fontFamily: 'monospace' }}>
              ref {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 24,
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#7fd1a8',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
