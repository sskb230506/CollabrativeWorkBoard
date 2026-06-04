import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => (
  <div className="flex h-screen flex-col items-center justify-center gap-6 bg-surface-950 text-center">
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-primary-700/10 blur-[100px]" />
      <div className="absolute -right-20 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-violet-700/10 blur-[100px]" />
    </div>
    <span className="relative text-8xl font-black text-surface-800">404</span>
    <div className="relative">
      <p className="text-xl font-semibold text-surface-200">Page not found</p>
      <p className="mt-1 text-sm text-surface-500">
        The page you are looking for doesn't exist or has been moved.
      </p>
    </div>
    <Link
      to="/boards"
      className="relative inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary-500"
    >
      <Home size={16} />
      Back to Boards
    </Link>
  </div>
);
