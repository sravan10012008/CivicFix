
 // @ts-nocheck

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

const getSessionAal = (session) => {
  try {
    const token = session?.access_token;

    if (!token) {
      return null;
    }

    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const base64 = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    const claims = JSON.parse(window.atob(padded));

    return claims.aal || null;
  } catch (error) {
    console.error("Unable to read session assurance level:", error);
    return null;
  }
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] =
    useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  const buildAppUser = async (authUser) => {
    if (!authUser) {
      return null;
    }

    let profile = null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("id", authUser.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load user profile:", error);
      } else {
        profile = data;
      }
    } catch (error) {
      console.error("Profile lookup failed:", error);
    }

    return {
      id: authUser.id,
      userId: authUser.id,
      email: authUser.email || "",
      name:
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        "",
      fullName:
        profile?.full_name ||
        authUser.user_metadata?.full_name ||
        "",
      phone:
        profile?.phone ||
        authUser.user_metadata?.phone ||
        "",
      role:
        profile?.role ||
        authUser.user_metadata?.role ||
        "citizen",
    };
  };

  // Keep worker routes unavailable until the session is at AAL2.
  // The backend independently verifies the token and enforces MFA.
  const applySession = async (session) => {
    if (!session?.user) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }

    const appUser = await buildAppUser(session.user);

    if (!appUser) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      setIsLoadingAuth(false);
      return;
    }

    const sessionAal = getSessionAal(session);
    const workerNeedsMfa =
      appUser.role === "worker" && sessionAal !== "aal2";

    setUser(appUser);
    setIsAuthenticated(!workerNeedsMfa);
    setAuthChecked(true);
    setIsLoadingAuth(false);

    if (workerNeedsMfa) {
      console.info(
        "Worker authentication pending MFA verification."
      );
    }
  };

  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      await applySession(session);
    } catch (error) {
      console.error("Authentication check failed:", error);

      setUser(null);
      setIsAuthenticated(false);

      setAuthError({
        type: "unknown",
        message:
          error.message ||
          "Failed to check authentication",
      });

      setAuthChecked(true);
    } finally {
      setIsLoadingAuth(false);
      setIsLoadingPublicSettings(false);
    }
  };

  useEffect(() => {
    // Initial authentication check.
    checkAppState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // User explicitly logged out.
        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);
          setAuthError(null);
          return;
        }

        // Login, restored session, profile update, or successful MFA.
        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "USER_UPDATED" ||
          event === "MFA_CHALLENGE_VERIFIED"
        ) {
          try {
            await applySession(session);
          } catch (error) {
            console.error(
              "Unable to update authentication state:",
              error
            );

            setUser(null);
            setIsAuthenticated(false);
            setAuthChecked(true);
            setIsLoadingAuth(false);
          }

          return;
        }

        // Do not reload the entire profile for a routine token refresh.
        // The backend independently checks the token on protected requests.
        if (event === "TOKEN_REFRESHED") {
          if (session?.user) {
            const sessionAal = getSessionAal(session);

            if (user?.role === "worker") {
              setIsAuthenticated(sessionAal === "aal2");
            }
          }

          return;
        }
      }
    );

    const handleLegacyAuthChange = () => {
      checkAppState();
    };

    window.addEventListener(
      "civicfix-auth-change",
      handleLegacyAuthChange
    );

    return () => {
      subscription.unsubscribe();

      window.removeEventListener(
        "civicfix-auth-change",
        handleLegacyAuthChange
      );
    };
  }, []);

  const checkUserAuth = async () => {
    await checkAppState();
  };

  const logout = async (shouldRedirect = true) => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase logout error:", error);
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }

    setUser(null);
    setIsAuthenticated(false);

    window.dispatchEvent(
      new Event("civicfix-auth-change")
    );

    if (shouldRedirect) {
      window.location.href = "/login";
    }
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider };

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};
