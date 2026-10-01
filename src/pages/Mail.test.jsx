import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import Mail, { DEFAULT_MAIL_BODY, DEFAULT_MAIL_SUBJECT, MAIL_RECIPIENT } from './Mail';

test('builds an editable prefilled connect email', () => {
  render(<Mail />);

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
