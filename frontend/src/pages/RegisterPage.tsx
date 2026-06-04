import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User, UserPlus } from 'lucide-react';
import { useRegister } from '@features/auth/hooks/useAuthHooks';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const registerSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterSchemaInput = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const registerMut = useRegister();
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterSchemaInput) => {
    setApiError('');
    try {
      await registerMut.mutateAsync(data);
      navigate('/boards', { replace: true });
    } catch {
      setApiError('Could not create account. The email may already be in use.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div className="mb-2 text-center">
        <h1 className="text-xl font-semibold text-surface-100">Create your account</h1>
        <p className="mt-1 text-sm text-surface-400">Start collaborating in seconds</p>
      </div>

      {apiError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
          {apiError}
        </div>
      )}

      <Input
        label="Full name"
        type="text"
        placeholder="Jane Smith"
        autoComplete="name"
        leftIcon={<User size={15} />}
        error={errors.name?.message}
        {...register('name')}
      />

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
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        leftIcon={<Lock size={15} />}
        error={errors.password?.message}
        {...register('password')}
      />

      <Button
        type="submit"
        fullWidth
        isLoading={registerMut.isPending}
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
