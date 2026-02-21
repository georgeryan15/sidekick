export {};

declare global {
  interface Window {
    electronAPI?: {
      execCommand: (command: string) => Promise<string>;
      toggleOverlay: () => Promise<void>;
      resizeOverlay: (height: number) => Promise<void>;
    };
  }
}
