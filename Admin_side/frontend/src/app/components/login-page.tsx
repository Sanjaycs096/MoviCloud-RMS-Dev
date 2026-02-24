import { useState } from 'react';
import { useAuth, UserRole } from '@/utils/auth-context';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { UtensilsCrossed, LogIn, Eye, EyeOff, ChefHat, UserCog, CreditCard, Users, Shield, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin: <Shield className="h-5 w-5" />,
  manager: <UserCog className="h-5 w-5" />,
  chef: <ChefHat className="h-5 w-5" />,
  waiter: <Users className="h-5 w-5" />,
  cashier: <CreditCard className="h-5 w-5" />,
};

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login successful!');
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-login-module flex items-center justify-center p-4 relative">
      {/* Back to Home Button - Top Left */}
      <button
        onClick={() => {
          // Send message to parent frame (User_side) to navigate home
          window.parent.postMessage({ type: 'MOVICLOUD_NAVIGATE', path: '/' }, '*');
        }}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white bg-black/30 backdrop-blur-md px-4 py-2 rounded-full hover:bg-black/50 transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="w-full max-w-md">
        {/* Login Form */}
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-4 pb-6 text-center">
            <div className="flex justify-center">
              <div className="p-4 bg-primary rounded-2xl">
                <UtensilsCrossed className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl">Restaurant Management</CardTitle>
              <CardDescription className="mt-2">Sign in with your staff credentials</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-11"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                <Lock className="h-4 w-4" />
                <span>Role-based access control</span>
              </div>
              <div className="flex justify-center gap-4 flex-wrap">
                {(['admin', 'manager', 'chef', 'waiter', 'cashier'] as UserRole[]).map((role) => (
                  <div key={role} className="flex flex-col items-center gap-1 text-muted-foreground">
                    <div className="p-2 rounded-lg bg-muted">
                      {ROLE_ICONS[role]}
                    </div>
                    <span className="text-xs capitalize">{role}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Contact admin if you don't have an account</p>
              <p className="mt-2 text-xs">Powered by Movicloud Labs</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
