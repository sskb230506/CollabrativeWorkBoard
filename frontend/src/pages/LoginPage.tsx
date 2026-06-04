import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useLogin } from '@features/auth/hooks/useAuthHooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login.mutateAsync({ email, password });
      navigate('/boards', { replace: true });
    } catch {
      setError('Invalid email or password. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="mb-2 text-center">
        <h1 className="text-xl font-semibold text-surface-100">Welcome back</h1>
        <p className="mt-1 text-sm text-surface-400">Sign in to your workspace</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        autoComplete="email"
        required
        leftIcon={<Mail size={15} />}
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        required
        leftIcon={<Lock size={15} />}
      />

      <Button
        type="submit"
        fullWidth
        isLoading={login.isPending}
        leftIcon={<LogIn size={16} />}
        className="mt-1"
      >
        Sign in
      </Button>

      <p className="text-center text-sm text-surface-400">
        No account?{' '}
        <Link to="/register" className="font-medium text-primary-400 hover:text-primary-300">
          Create one
        </Link>
      </p>
    </form>
  );
};
