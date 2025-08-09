import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button, Input } from "../../components/ui";
import { AnimatedBackground } from "../../components/ui/AnimatedBackground";
import { useToast } from "../../hooks/useToast";
import { isValidEmail } from "../../utils";

export const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { error: showError, success: showSuccess } = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      showSuccess("Login successful!");

      // Navigate based on role (will be handled by the router)
      navigate("/dashboard");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <AnimatedBackground />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="glass-card rounded-3xl p-8 hover-lift">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center animate-pulse-glow">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
            </div>
            <span className="text-3xl font-bold gradient-text">
              SkillSphere
            </span>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-800">
              Welcome Back! ✨
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Or{" "}
              <Link
                to="/signup"
                className="font-semibold text-blue-600 hover:text-blue-500 transition-colors duration-300"
              >
                create a new account
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                label="Email address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter your email"
              />

              <Input
                label="Password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to="/forgot-password"
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                Sign in
              </Button>
            </div>

            {/* Enhanced Demo credentials */}
            <div className="mt-6 p-6 glass rounded-2xl border border-blue-200/30">
              <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                <span className="mr-2">🚀</span>
                Demo Credentials:
              </h3>
              <div className="text-xs text-blue-700 space-y-2">
                <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <strong>Learner:</strong>
                  <span className="font-mono">learner@demo.com / password</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <strong>Mentor:</strong>
                  <span className="font-mono">mentor@demo.com / password</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white/50 rounded-lg">
                  <strong>Admin:</strong>
                  <span className="font-mono">admin@demo.com / password</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
