export function cmpBy<T>(...key: (keyof T)[]) {
  return (a: T, b: T) => {
    for (const k of key) {
      if (a[k] < b[k]) {
        return -1;
      }
      if (a[k] > b[k]) {
        return 1;
      }
    }
    return 0;
  };
}

export function sortedBy<T>(a: T[], ...key: (keyof T)[]): T[] {
  const copy = a.slice();
  return copy.sort(cmpBy(...key));
}
