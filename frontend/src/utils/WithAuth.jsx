import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth", { replace: true });
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    }, [navigate]);

    if (isLoading || !isAuthenticated) {
      // Prevent flash of unauthorized content
      return null;
    }

    return React.createElement(WrappedComponent, props);
  };

  AuthComponent.displayName = `withAuth(${
    WrappedComponent.displayName || WrappedComponent.name || "Component"
  })`;

  return AuthComponent;
};

export default withAuth;