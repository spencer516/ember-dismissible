export default function unindent(src) {
  let whiteMatch = /^\s*/;
  let lines = src.split('\n');

  let min = lines.reduce((min, line) => {
    let match = whiteMatch.exec(line);
    return line.length > 0 && match ? Math.min(min, match[0].length) : min;
  }, Infinity);

  if (!isFinite(min)) {
    return src;
  }

  let reg = new RegExp(`^\\s{${min}}`);
  return lines.map((line) => {
    return line.replace(reg, '');
  }).join('\n');
}
