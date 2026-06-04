import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useRegister } from '@features/auth/hooks/useAuthHooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const register = useRegister();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register.mutateAsync({ email, name, password });
      navigate('/boards', { replace: true });
    } catch {
      setError('Could not create account. The email may already be in use.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="mb-2 text-center">
        <h1 className="text-xl font-semibold text-surface-100">Create your account</h1>
        <p className="mt-1 text-sm text-surface-400">Start collaborating in seconds</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Full name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Jane Smith"
        autoComplete="name"
        required
        leftIcon={<User size={15} />}
      />

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
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        required
        leftIcon={<Lock size={15} />}
      />

      <Button
        type="submit"
        fullWidth
        isLoading={register.isPending}
        leftIcon={<UserPlus size={16} />}
        className="mt-1"
      >
        Create account
      </Button>

      <p className="text-center text-sm text-surface-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">
          Sign in
        </Link>
      </p>
    </form>
  );
};
