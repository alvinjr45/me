import React from 'react';

function AdminLogin({ access }) {
  return (
    <form className="admin-page__form admin-page__form--gate" onSubmit={access.login}>
      <header className="admin-page__header admin-page__welcome">
        <span className="admin-page__badge" aria-hidden="true">
          <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="16" cy="16" r="11" /><circle cx="16" cy="16" r="5" /><path d="M16 2v7M16 23v7M2 16h7M23 16h7" /><circle cx="23" cy="9" r="3" fill="currentColor" stroke="none" /></svg>
        </span>
        <p>AUTHORIZED PERSONNEL</p>
        <h1>Mission Control</h1>
        <div className="admin-page__intro">Your site. Your command center.<br />Sign in to manage blog posts, photos, and more.</div>
      </header>
      <section className="admin-page__panel admin-page__gate">
        <label htmlFor="mission-control-password">Admin password</label>
        <input
          id="mission-control-password"
          name="password"
          required
          type="password"
          autoComplete="current-password"
          autoFocus
          value={access.password}
          disabled={access.isChecking}
          aria-invalid={Boolean(access.error)}
          aria-describedby={access.error ? 'mission-control-login-error' : undefined}
          onChange={(event) => access.setPassword(event.target.value)}
        />
        <button type="submit" disabled={access.isChecking || !access.isConfigured}>
          {access.isChecking ? 'Verifying access...' : 'Sign in'}
        </button>
        <p className="admin-page__hint">Use your existing admin password. Access is verified before the dashboard opens.</p>
      </section>
      {!access.isConfigured && <p className="admin-page__message" role="status">Sign-in is unavailable until the site connection is configured.</p>}
      {access.error && <p id="mission-control-login-error" className="admin-page__message admin-page__message--error" role="alert">{access.error}</p>}
    </form>
  );
}

export default AdminLogin;
