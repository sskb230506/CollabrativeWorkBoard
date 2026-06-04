import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@api/auth.api';
import { queryKeys } from '@api/query-keys';
import { useAuth } from '@context/AuthContext';

export const useMe = () =>
  useQuery({ queryKey: queryKeys.me, queryFn: authApi.me, staleTime: Infinity });

export const useLogin = () => {
  const { login } = useAuth();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
  });
};

export const useRegister = () => {
  const { register } = useAuth();
  return useMutation({
    mutationFn: ({
      email,
      name,
      password,
    }: {
      email: string;
      name: string;
      password: string;
    }) => register(email, name, password),
  });
};

export const useLogout = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.clear(),
  });
};
