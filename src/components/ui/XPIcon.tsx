import { getIconPath } from '@/lib/xp-icons';

interface XPIconProps {
  name: string;
  size?: 16 | 48;
  className?: string;
}

export function XPIcon({ name, size = 16, className }: XPIconProps) {
  return (
    <img
      src={getIconPath(name, size)}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={className}
    />
  );
}
