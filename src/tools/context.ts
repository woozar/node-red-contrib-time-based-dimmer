export class Context {
  values: { [key: string]: any } = {}

  get(key: string): any {
    return this.values[key]
  }

  set(key: string, value: any): void {
    this.values[key] = value
  }
}
