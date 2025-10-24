import { useEffect } from "react";

export function useDocumentTitle(title: string, suffix: string = "Serhii Zahranychnyi") {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = suffix ? `${title} | ${suffix}` : title;

    return () => {
      document.title = previousTitle;
    };
  }, [title, suffix]);
}
