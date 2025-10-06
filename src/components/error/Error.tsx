
import { useNavigate } from 'react-router-dom';

import { NotFound } from './NotFound.tsx';
import { ServerError } from './ServerError.tsx';

import type { ClientResponseError } from 'pocketbase';

export const Error = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => {
  const navigate = useNavigate();
  if (error.name?.includes('ClientResponseError')) {
    const cre = error as ClientResponseError;
    if (cre.status === 404) {
      return <NotFound resetErrorBoundary={resetErrorBoundary} />;
    } else if (cre.status === 401) {
      resetErrorBoundary();
      navigate('/login');
    } else {
      return <ServerError />;
    }
  }

  return <ServerError />;
};
