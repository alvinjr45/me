import React from 'react';

export default function GuestbookAuthor({ name, isAdmin = false }) {
  return <>{isAdmin ? <>AJ <span className="guestbook-messages__admin-label">(Administrator)</span></> : name}</>;
}
