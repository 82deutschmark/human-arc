import React from 'react';
import { Link } from 'wouter';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs = [],
  actions
}: PageHeaderProps) {
  return (
    <div className="bg-slate-800 border-b border-slate-700 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {breadcrumbs.length > 0 && (
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <span className="text-slate-400 mx-2">/</span>
                  )}
                  {crumb.href ? (
                    <Link 
                      href={crumb.href}
                      className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-sm font-medium text-slate-300">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        
        <div className="md:flex md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-slate-300">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="mt-4 flex-shrink-0 md:mt-0 md:ml-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
