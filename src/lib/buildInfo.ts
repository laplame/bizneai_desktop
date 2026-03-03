/**
 * Información de build - generada por scripts/bump-version.cjs en cada build
 */
import buildInfo from '../build-info.json';

export const APP_VERSION = buildInfo.version;
export const BUILD_TIMESTAMP = buildInfo.buildTimestamp;
export const BUILD_DATE = buildInfo.buildDate;

export const getVersionDisplay = (): string => {
  if (BUILD_TIMESTAMP > 0) {
    return `${APP_VERSION} (${BUILD_TIMESTAMP})`;
  }
  return APP_VERSION;
};
