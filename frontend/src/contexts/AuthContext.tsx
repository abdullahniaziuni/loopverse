import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, AuthContextType, SignupForm } from "../types";
import { apiService } from "../services/api";
import { webSocketService } from "../services/websocket";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session and token on app load
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("skillsphere_user");
      const storedToken = localStorage.getItem("auth_token");

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          apiService.setToken(storedToken);

          // Verify token is still valid by fetching current user
          const response = await apiService.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Token is invalid, clear stored data
            localStorage.removeItem("skillsphere_user");
            localStorage.removeItem("auth_token");
            apiService.clearToken();
          }
        } catch (error) {
          console.error("Error validating stored session:", error);
          localStorage.removeItem("skillsphere_user");
          localStorage.removeItem("auth_token");
          apiService.clearToken();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    console.log("🔐 AuthContext.login - Starting login process");
    console.log("📧 Email:", email);
    console.log("🔑 Password length:", password.length);

    setIsLoading(true);
    console.log("⏳ AuthContext.login - Set loading to true");

    try {
      console.log("📡 AuthContext.login - Calling apiService.login");
      const response = await apiService.login({ email, password });
      console.log("📡 AuthContext.login - API response:", response);

      if (response.success && response.data) {
        const { user, token } = response.data;
        console.log("✅ AuthContext.login - Login successful");
        console.log("🎫 Token received:", token ? "YES" : "NO");
        console.log("👤 User data:", user);
        console.log("🏷️ User role:", user.role);
        console.log("📧 User email:", user.email);
        console.log("🆔 User ID:", user.id);

        apiService.setToken(token);
        console.log("🔑 AuthContext.login - Token set in apiService");

        setUser(user);
        console.log("👤 AuthContext.login - User set in context");

        localStorage.setItem("skillsphere_user", JSON.stringify(user));
        localStorage.setItem("auth_token", token);
        console.log("💾 AuthContext.login - Data saved to localStorage");

        // Connect to WebSocket
        webSocketService.connect(token);
        console.log("🔌 AuthContext.login - WebSocket connection initiated");
      } else {
        console.error("❌ AuthContext.login - Login failed");
        console.error("📄 Response:", response);
        throw new Error(response.error || "Login failed");
      }
    } catch (error) {
      console.error("💥 AuthContext.login - Login error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
      console.log("⏳ AuthContext.login - Set loading to false");
    }
  };

  const signup = async (data: SignupForm): Promise<void> => {
    console.log("🔐 AuthContext.signup - Starting signup process");
    console.log("📝 Signup data:", data);

    setIsLoading(true);
    console.log("⏳ AuthContext.signup - Set loading to true");

    try {
      console.log("📡 AuthContext.signup - Calling apiService.signup");

      // Split name into firstName and lastName
      const nameParts = data.name.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const signupData = {
        firstName,
        lastName,
        email: data.email,
        password: data.password,
        role: data.role,
      };

      console.log("📝 Transformed signup data:", signupData);

      const response = await apiService.signup(signupData);
      console.log("📡 AuthContext.signup - API response:", response);

      if (response.success && response.data) {
        const { user, token } = response.data;
        console.log("✅ AuthContext.signup - Signup successful");
        console.log("🎫 Token received:", token ? "YES" : "NO");
        console.log("👤 User data:", user);
        console.log("🏷️ User role:", user.role);

        apiService.setToken(token);
        console.log("🔑 AuthContext.signup - Token set in apiService");

        setUser(user);
        console.log("👤 AuthContext.signup - User set in context");

        localStorage.setItem("skillsphere_user", JSON.stringify(user));
        localStorage.setItem("auth_token", token);
        console.log("💾 AuthContext.signup - Data saved to localStorage");
      } else {
        console.error("❌ AuthContext.signup - Signup failed");
        console.error("📄 Response:", response);
        throw new Error(response.error || "Signup failed");
      }
    } catch (error) {
      console.error("💥 AuthContext.signup - Signup error:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
      console.log("⏳ AuthContext.signup - Set loading to false");
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      apiService.clearToken();
      localStorage.removeItem("skillsphere_user");
      localStorage.removeItem("auth_token");

      // Disconnect WebSocket
      webSocketService.disconnect();
      console.log("🔌 AuthContext.logout - WebSocket disconnected");
    }
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
