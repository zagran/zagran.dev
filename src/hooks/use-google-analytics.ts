import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

export const useGoogleAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if gtag is available
    if (typeof window.gtag === "function") {
      // Wait for next tick to ensure document.title is updated by page components
      setTimeout(() => {
        window.gtag!("config", "G-9G6SHYS6WP", {
          page_path: location.pathname + location.search,
          page_title: document.title,
        });
      }, 0);
    }
  }, [location]);
};
