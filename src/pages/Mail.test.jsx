import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { DeviceSettingsContext } from '../components/deviceSettings';
import Mail, { DEFAULT_MAIL_BODY, DEFAULT_MAIL_SUBJECT, MAIL_RECIPIENT } from './Mail';

function Location() {
  return <output aria-label="Current location">{useLocation().pathname}</output>;
}

function renderMail(settings) {
  return render(
    <MemoryRouter initialEntries={['/mail']}>
      <DeviceSettingsContext.Provider value={settings}>
        <Mail />
        <Location />
      </DeviceSettingsContext.Provider>
    </MemoryRouter>
  );
}

test('builds an editable prefilled connect email', () => {
  renderMail({ isPhone: false });

  expect(screen.getByLabelText('To:')).toHaveValue(MAIL_RECIPIENT);
  expect(screen.getByLabelText('Subject:')).toHaveValue(DEFAULT_MAIL_SUBJECT);
  expect(screen.getByLabelText('Message')).toHaveValue(DEFAULT_MAIL_BODY);

  fireEvent.change(screen.getByLabelText('Subject:'), { target: { value: 'Hello AJ' } });
  fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Would you like to connect?' } });

  expect(screen.getByRole('link', { name: `Send email to ${MAIL_RECIPIENT}` })).toHaveAttribute(
    'href',
    `mailto:${MAIL_RECIPIENT}?subject=Hello%20AJ&body=Would%20you%20like%20to%20connect%3F`
  );
});

test('returns to the home screen when cancel is pressed on mobile', () => {
  renderMail({ isPhone: true });

  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(screen.getByLabelText('Current location')).toHaveTextContent('/');
});
