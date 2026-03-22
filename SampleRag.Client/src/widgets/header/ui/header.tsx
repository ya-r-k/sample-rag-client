import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '../../../shared/store/ui-store'
import { cn } from '../../../shared/lib/cn'

export function Header() {
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const language = useUiStore((state) => state.language)
  const setLanguage = useUiStore((state) => state.setLanguage)

  const handleLanguageChange = (next: 'ru' | 'en') => {
    setLanguage(next)
    void i18n.changeLanguage(next)
  }

  return (
    <header className="border-b border-muted bg-background/80 px-8 py-4 backdrop-blur">
      <div className="flex items-center justify-between gap-6">
        <nav className="flex items-center gap-4" aria-label={t('common.mainNavigation')}>
          <Link
            to="/"
            className={cn(
              'text-base font-semibold tracking-wide transition-colors hover:text-foreground/90',
              location.pathname === '/' ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {t('appName')}
          </Link>
          <Link
            to="/chats"
            className={cn(
              'text-sm font-medium transition-colors hover:text-foreground',
              location.pathname.startsWith('/chats')
                ? 'text-foreground underline underline-offset-4'
                : 'text-muted-foreground',
            )}
          >
            {t('nav.chats')}
          </Link>
          <Link
            to="/documents"
            className={cn(
              'text-sm font-medium transition-colors hover:text-foreground',
              location.pathname.startsWith('/documents')
                ? 'text-foreground underline underline-offset-4'
                : 'text-muted-foreground',
            )}
          >
            {t('nav.documents')}
          </Link>
          <Link
            to="/scopes"
            className={cn(
              'text-sm font-medium transition-colors hover:text-foreground',
              location.pathname.startsWith('/scopes')
                ? 'text-foreground underline underline-offset-4'
                : 'text-muted-foreground',
            )}
          >
            {t('nav.scopes')}
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full border border-muted bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => handleLanguageChange('ru')}
              className={cn(
                'rounded-full px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                language === 'ru'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              RU
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={cn(
                'rounded-full px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                language === 'en'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              EN
            </button>
          </div>
          <div className="flex items-center rounded-full border border-muted bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            <span className="ml-2">{t('userMenu.placeholder')}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

