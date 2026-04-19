import { useNavigate } from 'react-router-dom';

import { NotFound } from './NotFound.tsx';
import { ServerError } from './ServerError.tsx';

import type { FallbackProps } from 'react-error-boundary';

export function Error({ error, resetErrorBoundary }: FallbackProps) {
  const navigate = useNavigate();

  // @ts-expect-error it exists on ClientResponseError
  const status = error?.status ?? -1;

  if (status === 404) {
    return <NotFound resetErrorBoundary={resetErrorBoundary} />;
  } else if (status === 401) {
    resetErrorBoundary();
    navigate('/login');
  } else {
    return <ServerError />;
  }

  return <ServerError />;
}
