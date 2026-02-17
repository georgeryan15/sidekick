import { Outlet } from "react-router-dom";
import SidebarNav from "./components/SidebarNav";

function App() {
  return (
    <div className="flex h-screen bg-surface-secondary p-3 gap-2">
      {/* Floating Sidebar */}
      <SidebarNav />

      {/* Main Content */}
      <div className="flex-1 rounded-2xl overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
