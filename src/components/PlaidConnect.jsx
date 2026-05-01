import { useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { api } from '../lib/api.js';

export default function PlaidConnect({ onConnected }) {
  const [linkToken, setLinkToken] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.linkToken()
      .then(r => { if (alive) setLinkToken(r.link_token); })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      try {
        setBusy(true);
        await api.exchange(public_token, metadata.institution);
        await api.sync();
        onConnected?.();
      } catch (e) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    },
  });

  return (
    <>
      {error && <div className="error">Plaid error: {error}</div>}
      <button
        className="btn"
        onClick={() => open()}
        disabled={!ready || busy}
      >
        {busy ? 'Connecting…' : 'Connect a bank'}
      </button>
    </>
  );
}
