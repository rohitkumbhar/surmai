import {createContext, useContext, useMemo, useState} from "react";
import {Models} from "appwrite";

const AuthContext = createContext<{
  user?: Models.User<Models.Preferences>,
  session?: Models.Session,
  loginComplete?: (user: Models.User<Models.Preferences>, session: Models.Session, logoutFn: () => void) => void,
  logoutFn?: () => void
}>({
  user: undefined,
  session: undefined,
  loginComplete: undefined,
  logoutFn: undefined
});

// @ts-expect-error I don't know the type
export const AuthProvider = ({children}) => {

  const [sessionState, setSessionState] = useState<{
    user?: Models.User<Models.Preferences>,
    session?: Models.Session, logoutFn?: () => void
  }>({user: undefined, session: undefined, logoutFn: undefined})


  const loginComplete = (user: Models.User<Models.Preferences>, session: Models.Session, logoutFn: () => void) => {
    setSessionState({user: user, session: session, logoutFn: logoutFn})
  }


  const value = useMemo(
    () => ({
      user: sessionState.user,
      session: sessionState.session,
      loginComplete,
      logoutFn: sessionState.logoutFn
    }),
    [sessionState]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};