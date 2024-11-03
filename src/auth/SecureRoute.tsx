import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authRefresh } from '../lib';

// @ts-expect-error What is even type?
export const SecureRoute = ({ children }) => {
  const navigate = useNavigate();
  const [allowChildren, setAllowChildren] = useState(false);
  useEffect(() => {
    authRefresh()
      .then(() => {
        setAllowChildren(true);
      })
      .catch((err) => {
        console.log('err', typeof err, JSON.stringify(err));
        if (err.isAbort) {
          setAllowChildren(true);
        } else {
          setAllowChildren(false);
          navigate('/login');
        }
      });
  }, [navigate]);
  return allowChildren ? children : null;
};
