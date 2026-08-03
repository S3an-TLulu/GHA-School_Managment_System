// Convert an integer to British-English words (e.g. 426 -> "four hundred and
// twenty-six"). Used by place-value / number-representation generators.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function under1000(n: number): string {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  const h = Math.floor(n / 100), rest = n % 100;
  return ONES[h] + ' hundred' + (rest ? ' and ' + under1000(rest) : '');
}

export function numToWords(n: number): string {
  if (n === 0) return 'zero';
  if (n < 0) return 'minus ' + numToWords(-n);
  const scales = [
    { v: 1_000_000_000, name: 'billion' },
    { v: 1_000_000, name: 'million' },
    { v: 1_000, name: 'thousand' },
  ];
  let out = '';
  let rem = n;
  for (const { v, name } of scales) {
    if (rem >= v) {
      const chunk = Math.floor(rem / v);
      out += (out ? ' ' : '') + under1000(chunk) + ' ' + name;
      rem %= v;
    }
  }
  if (rem) out += (out ? (rem < 100 ? ' and ' : ' ') : '') + under1000(rem);
  return out.trim();
}

// Capitalise the first letter (for prompts like "Four hundred and twenty-six").
export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
