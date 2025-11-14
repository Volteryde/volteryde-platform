import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface ClientOnlyProps {
  children: () => ReactNode;
  fallback?: ReactNode;
}

/**
 * ClientOnly Component
 * 
 * This component ensures that its children are only rendered on the client side,
 * preventing hydration mismatches and "window is not defined" errors.
 * 
 * Perfect for libraries like Leaflet that require browser APIs.
 */
export function ClientOnly({ children, fallback = null }: Readonly<ClientOnlyProps>) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children()}</>;
}
