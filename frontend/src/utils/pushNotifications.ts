import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Pede permissão, pega o token Expo do device e salva em push_tokens.
 * Melhor esforço — nunca deve travar login/carregamento do app: simuladores,
 * permissão negada ou falha de rede aqui não impedem o resto do app de
 * funcionar.
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<void> {
  try {
    if (!Device.isDevice) {
      // Emulador/simulador não recebe push de verdade.
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenResponse.data;

    if (!token) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    const { error } = await supabase.from('push_tokens').upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' },
    );

    if (error) {
      console.warn('registerForPushNotificationsAsync:', error.message);
    }
  } catch (err) {
    console.warn('registerForPushNotificationsAsync:', err);
  }
}

type NotifyPayload =
  | { type: 'message'; messageId: string }
  | { type: 'connection_accepted'; connectionId: string }
  | { type: 'connection_request'; requestId: string }
  | { type: 'contact_request'; requestId: string };

/**
 * Avisa a Edge Function push-notify pra mandar push pro destinatário.
 * Fire-and-forget: chamado logo após a ação (enviar mensagem, aceitar
 * conexão, criar solicitação) já ter sido salva com sucesso — falha aqui
 * não deve virar erro pra quem enviou.
 */
export function notifyPush(payload: NotifyPayload): void {
  supabase.functions.invoke('push-notify', { body: payload }).catch((err) => {
    console.warn('notifyPush:', err);
  });
}
