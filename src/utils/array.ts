export {};

declare global {
  interface Array<T> {
    batch(size: number): Array<Array<T>>;
  }
  interface ArrayConstructor {
    withSize<T>(size: number, initialValue: T): Array<T>;
  }
}

Array.prototype.batch = function (size: number) {
  const result = [];
  while (this.length > 0) {
    result.push(this.splice(0, size));
  }
  return result;
};

Array.withSize = function (size: number, initialValue: any) {
  const result = [];
  for (let i = 0; i < size; i++) {
    result.push(initialValue);
  }
  return result;
};
