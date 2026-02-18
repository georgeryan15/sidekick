import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import SidebarNav from "./components/SidebarNav";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { Spinner } from "@heroui/react";

function App() {
  const { user, isLoading } = useAuth();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showApp, setShowApp] = useState(false);

  useEffect(() => {
    if (user && !showApp) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setShowApp(true);
        setIsTransitioning(false);
      }, 400);
      return () => clearTimeout(timer);
    }
    if (!user) {
      setShowApp(false);
      setIsTransitioning(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-secondary">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={isTransitioning ? "auth-exit" : ""}>
        <Login />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen bg-surface-secondary p-3 gap-2 ${!showApp ? "auth-enter" : ""}`}
    >
      <SidebarNav />
      <div className="flex-1 rounded-2xl overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default App;
