// Mock Authentication Service for Development
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'worker' | 'admin' | 'supervisor';
  employeeId: string;
}

export interface AuthResponse {
  user: User | null;
  error: string | null;
}

// Mock users database
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'vikramank23cb@psnacet.edu.in',
    name: 'Vikram Kumar',
    role: 'worker',
    employeeId: 'CW001'
  },
  {
    id: '2',
    email: 'admin@coalmine.com',
    name: 'Mine Administrator',
    role: 'admin',
    employeeId: 'ADM001'
  },
  {
    id: '3',
    email: 'supervisor@coalmine.com',
    name: 'Site Supervisor',
    role: 'supervisor',
    employeeId: 'SUP001'
  }
];

class AuthService {
  private currentUser: User | null = null;

  async signIn(email: string, password: string): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find user by email
    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return {
        user: null,
        error: 'User not found'
      };
    }

    // For demo purposes, accept any password that matches the requirement
    if (password.length < 6) {
      return {
        user: null,
        error: 'Password must be at least 6 characters'
      };
    }

    this.currentUser = user;
    
    // Store in localStorage for persistence
    localStorage.setItem('coal_worker_auth', JSON.stringify(user));

    return {
      user,
      error: null
    };
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('coal_worker_auth');
  }

  getCurrentUser(): User | null {
    if (this.currentUser) {
      return this.currentUser;
    }

    // Try to restore from localStorage
    const stored = localStorage.getItem('coal_worker_auth');
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      } catch (e) {
        localStorage.removeItem('coal_worker_auth');
      }
    }

    return null;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  async signUp(email: string, password: string, name: string): Promise<AuthResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user already exists
    const existingUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return {
        user: null,
        error: 'User already exists'
      };
    }

    // Create new user
    const newUser: User = {
      id: (MOCK_USERS.length + 1).toString(),
      email,
      name,
      role: 'worker',
      employeeId: `CW${String(MOCK_USERS.length + 1).padStart(3, '0')}`
    };

    MOCK_USERS.push(newUser);
    this.currentUser = newUser;
    
    localStorage.setItem('coal_worker_auth', JSON.stringify(newUser));

    return {
      user: newUser,
      error: null
    };
  }

  // Reset password (mock implementation)
  async resetPassword(email: string): Promise<{ error: string | null }> {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { error: 'User not found' };
    }

    // In a real implementation, this would send an email
    console.log(`Password reset email sent to ${email}`);
    return { error: null };
  }
}

export const authService = new AuthService();
