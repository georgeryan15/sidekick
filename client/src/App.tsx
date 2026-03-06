import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import { ConversationProvider } from "./context/ConversationContext";
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
    <ConversationProvider>
      <div
        className={`flex h-screen bg-background p-3 gap-2 ${
          !showApp ? "auth-enter" : ""
        }`}
      >
        <Sidebar />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    </ConversationProvider>
  );
}

export default App;
