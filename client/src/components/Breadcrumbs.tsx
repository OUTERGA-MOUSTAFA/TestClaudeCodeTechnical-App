import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li className="flex items-center gap-1.5">
          <Link to="/" className="inline-flex items-center hover:text-foreground transition-colors">
            <Home className="size-4" />
          </Link>
        </li>
        {parts.map((p, i) => {
          const href = '/' + parts.slice(0, i + 1).join('/');
          const isLast = i === parts.length - 1;
          return (
            <li key={href} className="flex items-center gap-1.5">
              <ChevronRight className="size-3.5" />
              {isLast ? (
                <span className="text-foreground font-medium capitalize">
                  {p.replace(/-/g, ' ')}
                </span>
              ) : (
                <Link to={href} className="hover:text-foreground transition-colors capitalize">
                  {p.replace(/-/g, ' ')}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
