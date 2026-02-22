export {};

declare global {
  interface Window {
    electronAPI?: {
      execCommand: (command: string) => Promise<string>;
      toggleOverlay: () => Promise<void>;
      resizeOverlay: (height: number) => Promise<void>;
      captureScreenContext: () => Promise<{
        success: boolean;
        file: string;
        data: Record<string, unknown>;
      }>;
    };
  }
}
