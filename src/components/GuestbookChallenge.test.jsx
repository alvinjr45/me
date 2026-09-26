import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import GuestbookChallenge from './GuestbookChallenge';

test('expires tokens, resets after each attempt, and removes the widget on unmount', async () => {
  const saved = window.turnstile;
  let callbacks;
  window.turnstile = { render: jest.fn((element, options) => { callbacks = options; return 'widget'; }), remove: jest.fn() };
  const onToken = jest.fn();
  try {
    const view = render(<GuestbookChallenge sitekey="test-key" onToken={onToken} resetKey={0} size="flexible" />);
    await waitFor(() => expect(window.turnstile.render).toHaveBeenCalledTimes(1));
    expect(callbacks.action).toBe('guestbook');
    expect(callbacks.size).toBe('flexible');
    act(() => callbacks.callback('token'));
    expect(onToken).toHaveBeenLastCalledWith('token');
    act(() => callbacks['expired-callback']());
    expect(onToken).toHaveBeenLastCalledWith('');
    view.rerender(<GuestbookChallenge sitekey="test-key" onToken={onToken} resetKey={1} size="flexible" />);
    await waitFor(() => expect(window.turnstile.render).toHaveBeenCalledTimes(2));
    expect(window.turnstile.remove).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(window.turnstile.remove).toHaveBeenCalledTimes(2);
  } finally { window.turnstile = saved; }
});
