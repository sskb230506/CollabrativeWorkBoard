import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useLogin } from '@features/auth/hooks/useAuthHooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginSchemaInput = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginSchemaInput) => {
    setApiError('');
    try {
      await login.mutateAsync(data);
      navigate('/boards', { replace: true });
    } catch {
      setApiError('Invalid email or password. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="mb-2 text-center">
        <h1 className="text-xl font-semibold text-surface-100">Welcome back</h1>
        <p className="mt-1 text-sm text-surface-400">Sign in to your workspace</p>
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {apiError}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        placeholder="you@company.com"
        autoComplete="email"
        leftIcon={<Mail size={15} />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        leftIcon={<Lock size={15} />}
        error={errors.password?.message}
        {...register('password')}
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
