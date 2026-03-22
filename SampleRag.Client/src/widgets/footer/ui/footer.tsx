import { useTranslation } from 'react-i18next'
import { cn } from '../../../shared/lib/cn'

export function Footer({ className }: { className?: string }) {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className={cn("text-xs border-t border-muted bg-background/80 px-8 py-4 text-sm text-muted-foreground", className)}>
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <span className="leading-relaxed">
          © {year} {t('footer.appName')} · {t('footer.rights')}
        </span>
        <span className="text-xs">{t('footer.version', { version: '1.0.0' })}</span>
      </div>
    </footer>
  )
}

