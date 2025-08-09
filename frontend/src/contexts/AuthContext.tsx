import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, SignupForm } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
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
    // Check for stored user session on app load
    const storedUser = localStorage.getItem('skillsphere_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('skillsphere_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Mock login - in real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      // Mock user data based on email for demo
      let mockUser: User;
      if (email.includes('admin')) {
        mockUser = {
          id: '1',
          name: 'Admin User',
          email,
          role: 'admin',
          createdAt: new Date().toISOString(),
        };
      } else if (email.includes('mentor')) {
        mockUser = {
          id: '2',
          name: 'John Mentor',
          email,
          role: 'mentor',
          createdAt: new Date().toISOString(),
        };
      } else {
        mockUser = {
          id: '3',
          name: 'Jane Learner',
          email,
          role: 'learner',
          createdAt: new Date().toISOString(),
        };
      }

      setUser(mockUser);
      localStorage.setItem('skillsphere_user', JSON.stringify(mockUser));
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupForm): Promise<void> => {
    setIsLoading(true);
    try {
      // Mock signup - in real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      
      const mockUser: User = {
        id: Date.now().toString(),
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: new Date().toISOString(),
      };

      setUser(mockUser);
      localStorage.setItem('skillsphere_user', JSON.stringify(mockUser));
    } catch (error) {
      throw new Error('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('skillsphere_user');
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
