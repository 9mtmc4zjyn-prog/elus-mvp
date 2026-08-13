import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';

import { AppProvider, useApp } from '../src/context/AppContext';
import { FREE_ONLY_BUILD } from '../src/data/pricing';
import { supabase } from '../src/lib/supabase';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { Button } from '../src/components/Button';

const COLORS = {
  goldDark: '#8A6E35',
};

function normalizePathname(pathname: string) {
  if (!pathname) {
    return '';
  }

  const withoutQuery = pathname.split('?')[0] || pathname;
  const normalized = withoutQuery.replace(/\/+$/, '');

  return normalized || '/';
}

function isPlansRoute(pathname: string) {
  const path = normalizePathname(pathname);

  return path === '/plans' || path.startsWith('/plans/');
}

function isPreAppRoute(pathname: string, segments: readonly string[]) {
  const path = normalizePathname(pathname);

  if (!path || path === '/index') {
    return true;
  }

  if (path === '/' && segments[0] !== '(tabs)') {
    return true;
  }

  return (
    path === '/login' ||
    path === '/signup' ||
    path === '/onboarding' ||
    path === '/profile-type' ||
    path === '/profile-setup' ||
    path === '/verification' ||
    path === '/terms' ||
    path === '/privacy' ||
    path === '/privacy-policy' ||
    path === '/forgot-password'
  );
}

function isRestrictedProfileRoute(pathname: string) {
  const path = normalizePathname(pathname);

  return path.startsWith('/profile/') && path !== '/profile';
}

function isOwnProfileRoute(pathname: string, segments: readonly string[]) {
  const path = normalizePathname(pathname);

  if (path === '/profile' || path === '/(tabs)/profile') {
    return true;
  }

  return segments[0] === '(tabs)' && segments[1] === 'profile';
}

function shouldShowGlobalPlansButton({
  pathname,
  segments,
  profileCompleted,
}: {
  pathname: string;
  segments: readonly string[];
  profileCompleted?: boolean;
}) {
  // Build free-only (sem IAP): não expor atalho flutuante de "loja"/planos.
  if (FREE_ONLY_BUILD) {
    return false;
  }

  if (isPlansRoute(pathname)) {
    return false;
  }

  if (isPreAppRoute(pathname, segments)) {
    return false;
  }

  if (isRestrictedProfileRoute(pathname)) {
    return false;
  }

  if (profileCompleted !== true) {
    return false;
  }

  return true;
}

function GlobalPlansButton() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const app = useApp();

  const shouldShow = shouldShowGlobalPlansButton({
    pathname,
    segments,
    profileCompleted: app.user?.profileCompleted,
  });

  if (!shouldShow) {
    return null;
  }

  const ownProfileRoute = isOwnProfileRoute(pathname, segments);

  function openPlans() {
    router.push('/plans' as never);
  }

  return (
    <Button
      label="Planos"
      variant="warningAccent"
      icon="diamond"
      iconPosition="left"
      iconSize={15}
      pressedScale={0.98}
      textStyle={styles.globalPlansButtonText}
      containerStyle={[
        styles.globalPlansButton,
        ownProfileRoute && styles.globalPlansButtonOnProfile,
      ]}
      onPress={openPlans}
    />
  );
}

function AppShell() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments();
  const { colors } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const hasSession = !!data.session;
      const onProtectedRoute = !isPreAppRoute(pathname, segments);
      if (!hasSession && onProtectedRoute) {
        router.replace('/login');
      }
    });
  }, [pathname]);

  // Toque em notificação push (app em background/fechado ou aberto) —
  // leva pra tela relevante conforme o tipo gravado em push-notify.
  useEffect(() => {
    function handleResponse(response: Notifications.NotificationResponse) {
      const data = response.notification.request.content.data as
        | { type?: string; conversationId?: string }
        | undefined;

      if (!data?.type) return;

      if (data.type === 'message' && data.conversationId) {
        router.push(`/messages/${data.conversationId}` as never);
        return;
      }

      if (
        data.type === 'connection_accepted' ||
        data.type === 'connection_request' ||
        data.type === 'contact_request'
      ) {
        router.push('/(tabs)/connections' as never);
      }
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => subscription.remove();
  }, [router]);

  return (
    <View style={[styles.appShell, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />

      <View
        pointerEvents="none"
        style={[styles.statusBarShield, { backgroundColor: colors.background }]}
      />

      <GlobalPlansButton />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <ThemeProvider>
          <AppProvider>
            <AppShell />
          </AppProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  appShell: {
    flex: 1,
  },

  statusBarShield: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    zIndex: 998,
  },

  globalPlansButton: {
    position: 'absolute',
    top: 52,
    right: 18,
    zIndex: 999,
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowOpacity: 0.36,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },

  globalPlansButtonOnProfile: {
    right: 78,
  },

  globalPlansButtonText: {
    fontSize: 13,
  },
});
