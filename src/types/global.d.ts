declare global {
  interface Map extends Map<string, string> {
    default: string;
  }
}
export {};
