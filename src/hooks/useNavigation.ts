import { useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigationAllowed } from './useUnsaved';

/**
 * Exposes the app's route path and a guarded navigation action. BrowserRouter owns
 * route state; this adapter keeps existing page components independent of router APIs.
 */
export function useNavigation() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const currentIndex = useRef<number>(window.history.state?.idx ?? 0);
  const currentHref = useRef(window.location.href);
  const path = `${location.pathname}${location.search}`;

  useEffect(() => {
    const href = window.location.href;
    const index = window.history.state?.idx;
    // POP events update these refs synchronously in guardPop. Ignore a delayed
    // render effect from an older, lower-index entry so it cannot erase that
    // newer history position before the next Back/Forward event is guarded.
    if (typeof index === 'number' && index < currentIndex.current) return;
    if (typeof index === 'number') currentIndex.current = index;
    currentHref.current = href;
  }, [location.key]);

  useEffect(() => {
    let ignoredFragmentHashchange: string | null = null;
    let rollbackToIndex: number | null = null;
    /**
     * BrowserRouter applies POP events in the bubble phase. Intercepting during
     * capture lets us cancel Back/Forward before route content changes; on cancel,
     * move the browser back to its prior history index and let that event sync Router.
     */
    const guardPop = (event: PopStateEvent) => {
      const targetIndex = event.state?.idx;
      const targetHref = window.location.href;
      const previousUrl = new URL(currentHref.current);
      const targetUrl = new URL(targetHref);
      const isFragmentTraversal = targetUrl.origin === previousUrl.origin
        && targetUrl.pathname === previousUrl.pathname
        && targetUrl.search === previousUrl.search
        && targetUrl.hash !== previousUrl.hash;
      const isSamePageFragment = targetUrl.origin === previousUrl.origin
        && targetUrl.pathname === previousUrl.pathname
        && targetUrl.search === previousUrl.search
        && Boolean(targetUrl.hash);
      if (isFragmentTraversal || (typeof targetIndex !== 'number' && isSamePageFragment)) {
        ignoredFragmentHashchange = targetHref;
      }
      if (rollbackToIndex !== null && targetIndex === rollbackToIndex) {
        // The POP that restores a canceled entry is part of the same guarded
        // navigation. Sync it without prompting or treating it as a new fragment.
        currentIndex.current = rollbackToIndex;
        currentHref.current = targetHref;
        rollbackToIndex = null;
        return;
      }
      const isUnindexedFragmentEntry = typeof targetIndex !== 'number'
        && isSamePageFragment;
      if (isUnindexedFragmentEntry) {
        // Native same-page anchors can emit a POP with null state. Index the
        // newly created fragment entry here before a fast Back can reach it.
        const nextIndex = currentIndex.current + 1;
        window.history.replaceState({ ...event.state, idx: nextIndex }, '', targetHref);
        currentIndex.current = nextIndex;
        currentHref.current = targetHref;
        return;
      }
      if ((typeof targetIndex !== 'number' || targetIndex === currentIndex.current) && targetHref === currentHref.current) return;
      if (!navigationAllowed()) {
        event.stopImmediatePropagation();
        if (typeof targetIndex === 'number') {
          rollbackToIndex = currentIndex.current;
          window.history.go(currentIndex.current - targetIndex);
        }
        return;
      }
      if (typeof targetIndex === 'number') currentIndex.current = targetIndex;
      currentHref.current = targetHref;
    };
    /**
     * Native in-page links such as the skip link create history entries without
     * React Router's `idx`. Give each fragment entry its own index so a later
     * Back/Forward POP can be canceled with the same delta-based guard.
     */
    const stampCurrentFragment = (href: string) => {
      const state = window.history.state;
      const nextIndex = currentIndex.current + 1;
      window.history.replaceState({ ...state, idx: nextIndex }, '', href);
      currentIndex.current = nextIndex;
      currentHref.current = href;
    };
    const indexFragmentEntry = () => {
      const href = window.location.href;
      if (href === ignoredFragmentHashchange) {
        ignoredFragmentHashchange = null;
        return;
      }
      const index = window.history.state?.idx;
      if (typeof index === 'number') {
        currentIndex.current = index;
        currentHref.current = href;
        return;
      }
      if (href !== currentHref.current) stampCurrentFragment(href);
    };
    // BrowserRouter's initial document entry may not have an idx yet. Index it
    // before a native fragment link copies its state into the new history entry.
    const initialState = window.history.state;
    if (typeof initialState?.idx !== 'number') {
      window.history.replaceState({ ...initialState, idx: currentIndex.current }, '', window.location.href);
    }
    currentHref.current = window.location.href;
    window.addEventListener('popstate', guardPop, true);
    window.addEventListener('hashchange', indexFragmentEntry);
    return () => { window.removeEventListener('popstate', guardPop, true); window.removeEventListener('hashchange', indexFragmentEntry); };
  }, []);

  const navigate = useCallback((next: string) => {
    if (!navigationAllowed()) return;
    routerNavigate(next);
    window.scrollTo({ top: 0 });
  }, [routerNavigate]);

  return { path: location.pathname, navigate };
}
