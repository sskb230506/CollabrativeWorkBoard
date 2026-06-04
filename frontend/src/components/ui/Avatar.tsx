import { cn } from '@utils/cn';

interface AvatarProps {
  name: string;
  avatarUrl?: string | null | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg' | undefined;
  className?: string | undefined;
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className,
}) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-surface-900',
      sizeMap[size],
      !avatarUrl && 'bg-primary-600/80 text-white',
      className,
    )}
    title={name}
  >
    {avatarUrl ? (
      <img
        src={avatarUrl}
        alt={name}
        className="h-full w-full rounded-full object-cover"
      />
    ) : (
      initials(name)
    )}
  </div>
);

interface AvatarGroupProps {
  users: Array<{ id: string; name: string; avatarUrl?: string | null | undefined }>;
  max?: number | undefined;
  size?: AvatarProps['size'] | undefined;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  users,
  max = 4,
  size = 'sm',
}) => {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((u) => (
        <Avatar key={u.id} name={u.name} avatarUrl={u.avatarUrl} size={size} />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-surface-700 font-semibold text-surface-200 ring-2 ring-surface-900',
            sizeMap[size],
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
};
