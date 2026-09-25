// Whole-word matching avoids censoring ordinary words such as "classic".
const words = [
  'fuck', 'fucks', 'fucked', 'fucker', 'fuckers', 'fucking', 'motherfucker', 'motherfuckers',
  'shit', 'shits', 'shitty', 'bullshit', 'shithead', 'shitheads', 'dipshit', 'dumbass', 'jackass', 'ass', 'asses', 'asshole', 'assholes',
  'bitch', 'bitches', 'bitching', 'bastard', 'bastards', 'cunt', 'cunts',
  'dick', 'dicks', 'cock', 'cocks', 'pussy', 'pussies', 'piss', 'pissed',
  'damn', 'dammit', 'goddamn', 'whore', 'whores', 'slut', 'sluts',
  'faggot', 'faggots', 'nigger', 'niggers', 'nigga', 'niggas', 'retard', 'retarded'
];

const variants: Record<string, string> = {
  a: '[a@4]', e: '[e3]', i: '[i1!|]', l: '[l1|]', o: '[o0]', s: '[s$5]', t: '[t7+]', u: '[uv]'
};

export function cleanText(value: unknown, max: number, label: string) {
  if (typeof value !== 'string' || value.length > max * 4) throw new Error(`${label} is too long or missing.`);
  const text = value.normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, ' ').replace(/\s+/g, ' ').trim();
  if (!text || [...text].length > max) throw new Error(`${label} must contain 1-${max} characters.`);
  if (/(?:https?:|www\.|[\p{L}\p{N}-]+\s*[.]\s*[a-z]{2,}(?:\b|\/)|[\w.+-]+@[\w.-]+)/iu.test(text)) {
    throw new Error('Please leave out links and email addresses.');
  }
  return text;
}

export function scrubProfanity(text: string, extraWords = '') {
  const blocked = [...words, ...extraWords.toLowerCase().split(',').map((word) => word.trim()).filter((word) => /^[a-z]{3,30}$/.test(word))];
  // Fold accents with an index map so only the matching original characters are replaced.
  const original = [...text];
  const positions: number[] = [];
  const folded = original.map((character, index) => {
    const normalized = character.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    for (let i = 0; i < normalized.length; i += 1) positions.push(index);
    return normalized;
  }).join('');
  const ranges: Array<[number, number]> = [];
  for (const word of blocked) {
    const pattern = [...word].map((letter) => `${variants[letter] || letter}+`).join('[\\s._*\\-]*');
    const regex = new RegExp(`(?<![\\p{L}\\p{N}])${pattern}(?![\\p{L}\\p{N}])`, 'giu');
    for (const match of folded.matchAll(regex)) {
      const start = match.index!;
      ranges.push([positions[start], positions[start + match[0].length - 1] + 1]);
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  let result = '';
  let end = 0;
  for (const [start, nextEnd] of ranges) {
    if (nextEnd <= end) continue;
    result += start >= end ? original.slice(end, start).join('') + '***' : '';
    end = nextEnd;
  }
  return result + original.slice(end).join('');
}
