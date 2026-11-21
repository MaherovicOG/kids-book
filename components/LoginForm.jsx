'use client';
import { useState } from 'react';
import { LockKeyhole, LoaderCircle } from 'lucide-react';
export default function LoginForm() {
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email:data.get('email'),password:data.get('password')}) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      window.location.assign('/admin');
    } catch(err) { setError(err.message || 'Could not sign in.'); setBusy(false); }
  }
  return <form className="login-card" onSubmit={submit}><span className="login-icon"><LockKeyhole size={28}/></span><div className="eyebrow">LITTLE HERO BOOKS</div><h1>Admin sign in</h1><p>Your orders, photos, and delivery workspace.</p><label className="field">Email<input name="email" type="email" autoComplete="username" required/></label><label className="field">Password<input name="password" type="password" autoComplete="current-password" required/></label>{error&&<p role="alert" className="form-error">{error}</p>}<button className="button submit-button" disabled={busy}>{busy?<><LoaderCircle size={18} className="spin"/> Signing in…</>:'Sign in'}</button><a className="back-link" href="/">Back to the website</a></form>;
}
