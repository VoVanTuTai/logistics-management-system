import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from '../store/queryClient';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps): React.JSX.Element {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

