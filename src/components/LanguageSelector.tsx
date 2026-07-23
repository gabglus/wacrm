'use client';

import { useRouter } from 'next-intl';
import Link from 'next/link';

const LanguageSelector = () => {
  const router = useRouter();
  const { locales, locale } = router;

  return (
    <div>
      {locales?.map((currentLocale) => (
        <Link
          key={currentLocale}
          href={router.asPath}
          locale={currentLocale}
          className={locale === currentLocale ? 'active' : ''}
        >
          {currentLocale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
};

export default LanguageSelector;