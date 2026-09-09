// @ts-nocheck

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
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

      if (session?.user) {
        const appUser = await buildAppUser(session.user);

        setUser(appUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setAuthChecked(true);
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
    // Initial authentication check
    checkAppState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        // User explicitly logged out
        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsAuthenticated(false);
          setAuthChecked(true);
          setIsLoadingAuth(false);
          return;
        }

        // Initial session / successful login / profile update
        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "USER_UPDATED"
        ) {
          if (session?.user) {
            const appUser =
              await buildAppUser(session.user);

            setUser(appUser);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }

          setAuthChecked(true);
          setIsLoadingAuth(false);
        }

        /*
         * IMPORTANT:
         *
         * Do NOT call checkAppState() for TOKEN_REFRESHED.
         *
         * Supabase may refresh the authentication token
         * when the browser tab becomes active again.
         *
         * The user is still logged in, so there is no need
         * to reload the profile or show the authentication
         * loading state again.
         */
        if (event === "TOKEN_REFRESHED") {
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
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Supabase logout error:",
          error
        );
      }
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
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

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};