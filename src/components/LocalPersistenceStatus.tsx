import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wifi, WifiOff, Loader2, Cloud, CloudOff } from 'lucide-react';
import { useLocalPersistenceStatus } from '../hooks/useLocalPersistenceStatus';
import { useCatalogOnlineStatus } from '../hooks/useCatalogOnlineStatus';

type Props = { sidebarMinimal: boolean };

const LocalPersistenceStatus: React.FC<Props> = ({ sidebarMinimal }) => {
  const { t } = useTranslation();
  const localStatus = useLocalPersistenceStatus();
  const catalogStatus = useCatalogOnlineStatus();

  const localTitle =
    localStatus === 'connected'
      ? t('persistence.titleConnected')
      : localStatus === 'disconnected'
        ? t('persistence.titleDisconnected')
        : t('persistence.checking');

  const catalogTitle =
    catalogStatus === 'online'
      ? t('persistence.titleCatalogOnline')
      : catalogStatus === 'offline'
        ? t('persistence.titleCatalogOffline')
        : t('persistence.catalogChecking');

  const iconSize = sidebarMinimal ? 18 : 16;

  return (
    <div className="sidebar-persistence-stack">
      <div
        className={`sidebar-persistence-status sidebar-persistence-status--${localStatus}`}
        role="status"
        aria-live="polite"
        title={localTitle}
      >
        {localStatus === 'checking' ? (
          <Loader2 size={iconSize} className="sidebar-persistence-status__spin" aria-hidden />
        ) : localStatus === 'connected' ? (
          <Wifi size={iconSize} className="sidebar-persistence-status__icon" aria-hidden />
        ) : (
          <WifiOff size={iconSize} className="sidebar-persistence-status__icon" aria-hidden />
        )}
        {!sidebarMinimal && (
          <span className="sidebar-persistence-status__label">
            {localStatus === 'checking'
              ? t('persistence.checking')
              : localStatus === 'connected'
                ? t('persistence.connected')
                : t('persistence.disconnected')}
          </span>
        )}
      </div>

      {catalogStatus !== 'idle' && (
        <div
          className={`sidebar-catalog-status sidebar-catalog-status--${catalogStatus}`}
          role="status"
          aria-live="polite"
          title={catalogTitle}
        >
          {catalogStatus === 'checking' ? (
            <Loader2 size={iconSize} className="sidebar-persistence-status__spin" aria-hidden />
          ) : catalogStatus === 'online' ? (
            <Cloud size={iconSize} className="sidebar-persistence-status__icon" aria-hidden />
          ) : (
            <CloudOff size={iconSize} className="sidebar-persistence-status__icon" aria-hidden />
          )}
          {!sidebarMinimal && (
            <span className="sidebar-persistence-status__label">
              {catalogStatus === 'checking'
                ? t('persistence.catalogChecking')
                : catalogStatus === 'online'
                  ? t('persistence.catalogOnline')
                  : t('persistence.catalogOffline')}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LocalPersistenceStatus;
