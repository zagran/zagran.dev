import { useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * React Router keeps the window scroll position across client-side navigations,
 * so moving from a long article back to /blog would leave you mid-page.
 *
 * BrowserRouter cannot use React Router's built-in <ScrollRestoration>, which is
 * data-router only, so this covers the same ground:
 *  - back/forward (POP) is left alone, so the browser restores where you were
 *  - a hash target owns the scroll position (see Navigation's section links)
 */
export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType === "POP") return;
    if (hash) return;

    window.scrollTo(0, 0);
  }, [pathname, hash, navigationType]);

  return null;
};
