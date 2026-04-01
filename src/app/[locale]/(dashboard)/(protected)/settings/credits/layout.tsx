import { getTranslations } from 'next-intl/server';

interface CreditsLayoutProps {
  children: React.ReactNode;
}

export default async function CreditsLayout({ children }: CreditsLayoutProps) {
  const t = await getTranslations('Dashboard.settings');

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6 space-y-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {t('credits.title')}
                </h1>
                <p className="text-muted-foreground mt-2">
                  {t('credits.description')}
                </p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
