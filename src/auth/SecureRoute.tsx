import {useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {currentUser} from "../lib/auth.ts";


// @ts-expect-error What is even type?
export const SecureRoute = ({children}) => {
  const navigate = useNavigate()
  const [allowChildren, setAllowChildren] = useState(false)
  useEffect(() => {
    currentUser().then(
      () => {
        setAllowChildren(true)
      }
    ).catch(() => {
      setAllowChildren(false)
      navigate("/login")
    })
  }, [navigate])

  return (allowChildren ? children : null)

}