'use client';

import { Link, usePathname } from '@/i18n/routing';

const locales = ['en', 'es'] as const;

type Locale = (typeof locales)[number];

const LanguageSelector = () => {
  const pathname = usePathname();
  const [, currentLocale = 'en', ...pathSegments] = pathname.split('/');
  const basePath = `/${pathSegments.join('/')}` || '/';

  return (
    <div className="flex items-center gap-2">
      {locales.map((locale) => (
        <Link
          key={locale}
          href={basePath}
          locale={locale}
          className={currentLocale === locale ? 'active' : ''}
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
};

export default LanguageSelector;