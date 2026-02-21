import OverlayChatbar from "./OverlayChatbar";

export default function OverlayRoot() {
  return (
    <div
      className="h-screen w-screen bg-transparent overflow-hidden"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <OverlayChatbar />
    </div>
  );
}
