import React from "react";
import { Navigation } from "./Navigation";
import { Footer } from "./Footer";
import { ToastContainer as WSToastContainer } from "../notifications";
import { ToastContainer } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showFooter = true,
}) => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 bg-gray-50/30">{children}</main>

      {showFooter && <Footer />}

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* WebSocket Toast Notifications */}
      <WSToastContainer />
    </div>
  );
};

// Layout for authentication pages (no navigation/footer)
export const AuthLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};
