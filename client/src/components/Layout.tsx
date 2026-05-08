import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { cn } from '@/lib/utils';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dashboardPath =
    user?.role === 'ADMIN'
      ? '/dashboard/admin'
      : user?.role === 'SECRETARY'
        ? '/dashboard/secretary'
        : '/dashboard/patient';

  return (
    <div className="min-h-full flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="size-8 grid place-items-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </span>
            <span>HealthCare</span>
          </Link>
          <nav className="flex items-center gap-1">
            {user ? (
              <>
                <NavLink
                  to={dashboardPath}
                  className={({ isActive }) =>
                    cn(
                      'px-3 h-9 inline-flex items-center rounded-md text-sm transition-colors',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  Dashboard
                </NavLink>
                <span className="hidden sm:inline-block px-2 text-xs text-muted-foreground">
                  {user.firstName} · {user.role}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  aria-label="Logout"
                >
                  <LogOut className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    cn(
                      'px-3 h-9 inline-flex items-center rounded-md text-sm transition-colors',
                      isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )
                  }
                >
                  Login
                </NavLink>
                <Button asChild size="sm">
                  <Link to="/register">Register</Link>
                </Button>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <Breadcrumbs />
      </div>

      <main className="container mx-auto px-4 pb-12 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
