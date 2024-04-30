export function commonPrefix(strings: string[]) {
  const first = strings[0] || "";
  let commonLength = first.length;

  for (let i = 1; i < strings.length; ++i) {
    for (let j = 0; j < commonLength; ++j) {
      if (strings[i].charAt(j) !== first.charAt(j)) {
        commonLength = j;
        break;
      }
    }
  }

  return first.slice(0, commonLength);
}
