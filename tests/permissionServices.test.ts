// Runtime validation coverage for: Android location and notification permissions
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nativeMocks = vi.hoisted(() => ({
  permissions: {
    ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
    ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
    POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS',
  },
  results: {
    GRANTED: 'granted',
    DENIED: 'denied',
    NEVER_ASK_AGAIN: 'never_ask_again',
  },
  requestMultiple: vi.fn(),
  check: vi.fn(),
  request: vi.fn(),
  platform: { OS: 'android', Version: 34 },
}));

vi.mock('react-native', () => ({
  PermissionsAndroid: {
    PERMISSIONS: nativeMocks.permissions,
    RESULTS: nativeMocks.results,
    requestMultiple: nativeMocks.requestMultiple,
    check: nativeMocks.check,
    request: nativeMocks.request,
  },
  Platform: nativeMocks.platform,
}));

import { locationService } from '../src/services/locationService';
import { notificationPermissionService } from '../src/services/notificationPermissionService';

describe('Android permission flows', () => {
  beforeEach(() => {
    nativeMocks.platform.OS = 'android';
    nativeMocks.platform.Version = 34;
    nativeMocks.requestMultiple.mockReset();
    nativeMocks.check.mockReset();
    nativeMocks.request.mockReset();
  });

  it('requests precise and approximate location together', async () => {
    nativeMocks.requestMultiple.mockResolvedValueOnce({
      [nativeMocks.permissions.ACCESS_FINE_LOCATION]: 'denied',
      [nativeMocks.permissions.ACCESS_COARSE_LOCATION]: 'granted',
    });

    await expect(locationService.requestPermission()).resolves.toEqual({
      precise: false,
      approximate: true,
    });
    expect(nativeMocks.requestMultiple).toHaveBeenCalledWith([
      nativeMocks.permissions.ACCESS_FINE_LOCATION,
      nativeMocks.permissions.ACCESS_COARSE_LOCATION,
    ]);
  });

  it('does not request POST_NOTIFICATIONS before Android 13', async () => {
    nativeMocks.platform.Version = 32;

    await expect(notificationPermissionService.requestPermission()).resolves.toBe('not-required');
    expect(nativeMocks.request).not.toHaveBeenCalled();
  });

  it('requests POST_NOTIFICATIONS on Android 13 and above', async () => {
    nativeMocks.check.mockResolvedValueOnce(false);
    nativeMocks.request.mockResolvedValueOnce('granted');

    await expect(notificationPermissionService.requestPermission()).resolves.toBe('granted');
    expect(nativeMocks.request).toHaveBeenCalledWith(
      nativeMocks.permissions.POST_NOTIFICATIONS,
      expect.objectContaining({ title: 'Permitir notificaciones' })
    );
  });

  it('reports when notification permission is permanently blocked', async () => {
    nativeMocks.check.mockResolvedValueOnce(false);
    nativeMocks.request.mockResolvedValueOnce('never_ask_again');

    await expect(notificationPermissionService.requestPermission()).resolves.toBe('blocked');
  });
});
