import React from 'react';
import CommandTerminal from '../components/CommandTerminal';
import './Terminal.css';

function Terminal() {
  return (
    <main className="terminal-page">
      <CommandTerminal autoFocus showIntro={false} />
    </main>
  );
}

export default Terminal;
