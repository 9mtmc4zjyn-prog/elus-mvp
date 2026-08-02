import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

import { colors } from '../../app/theme';

export type PlanType = 'free' | 'premium_person' | 'premium_business';

export type ProfileType = 'person' | 'business' | 'assisted';

export type PresenceMode = 'personal' | 'need_service' | 'offer_service';

export type VerificationStatus = 'unverified' | 'pending' | 'in_review' | 'verified';

export type ConnectionKind =
  | 'family'
  | 'company'
  | 'interest'
  | 'preference'
  | 'service'
  | 'friend'
  | 'assisted';

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export type AppUser = {
  id: string;
  name: string;
  email?: string;
  photo?: string;
  plan: PlanType;
  profileType: ProfileType;
  presenceMode: PresenceMode;
  service?: string;
  companyName?: string;
  companyId?: string;
  whatsapp?: string;
  phone?: string;
  instagram?: string;
  city?: string;
  state?: string;
  surname?: string;
  originCity?: string;
  originState?: string;
  verified: boolean;
  verificationStatus?: VerificationStatus;
  verificationSubmittedAt?: string;
  verificationDocumentType?: string;
  verificationSelfieUri?: string;
  interests: string[];
  preferences: string[];
  assistedBy?: string;
  supportContact?: string;
  profileCompleted: boolean;
  isOnline?: boolean;
};

export type AppConnection = {
  id: string;
  fromUserId: string;
  toUserId: string;
  kind: ConnectionKind;
  label: string;
  status: RequestStatus;
  createdAt: string;
  requiresMutualApproval?: boolean;
};

export type ConnectionRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  kind: ConnectionKind;
  label: string;
  status: RequestStatus;
  createdAt: string;
};

export type ContactInformationRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  requestedMethodIds: string[];
  approvedMethodIds: string[];
  status: RequestStatus;
  createdAt: string;
  respondedAt?: string;
  note?: string;
};

export type RelationshipColor = {
  kind: ConnectionKind;
  label: string;
  color: string;
};

export type ConnectionBranch = {
  kind: ConnectionKind;
  title: string;
  description: string;
  color: string;
  connections: AppConnection[];
};

type IdentityVerificationData = {
  documentType?: string;
  selfieUri?: string;
};

type AppContextValue = {
  user: AppUser;
  users: AppUser[];
  realUsers: AppUser[];
  connections: AppConnection[];
  incomingRequests: ConnectionRequest[];
  outgoingRequests: ConnectionRequest[];
  incomingContactInformationRequests: ContactInformationRequest[];
  outgoingContactInformationRequests: ContactInformationRequest[];
  blockedUserIds: string[];

  isPaidUser: boolean;
  isIdentityVerified: boolean;
  canRequestConnections: boolean;
  canUseAdvancedPresence: boolean;
  canUseCompanyBranches: boolean;

  relationshipColors: Record<ConnectionKind, RelationshipColor>;

  login: (data?: Partial<AppUser>) => void;
  signup: (data?: Partial<AppUser>) => void;
  logout: () => void;

  updateUser: (data: Partial<AppUser>) => void;
  completeProfile: (data: Partial<AppUser>) => void;
  setProfileType: (profileType: ProfileType) => void;
  setPresenceMode: (presenceMode: PresenceMode) => void;
  upgradePlan: (plan: PlanType) => void;

  submitIdentityVerification: (data?: IdentityVerificationData) => void;
  setIdentityVerified: () => void;
  setIdentityUnverified: () => void;

  createConnection: (targetUserId: string, kind: ConnectionKind, label?: string) => void;
  removeConnection: (targetUserId: string, kind: ConnectionKind) => void;
  toggleConnection: (targetUserId: string, kind: ConnectionKind, label?: string) => void;

  requestFamilyConnection: (targetUserId: string, label?: string) => void;
  acceptConnectionRequest: (requestId: string) => void;
  rejectConnectionRequest: (requestId: string) => void;

  requestContactInformation: (
    targetUserId: string,
    requestedMethodIds: string[],
    note?: string
  ) => void;
  acceptContactInformationRequest: (
    requestId: string,
    approvedMethodIds: string[]
  ) => void;
  rejectContactInformationRequest: (requestId: string) => void;

  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  isBlocked: (userId: string) => boolean;

  getUserById: (userId: string) => AppUser | undefined;
  getConnectionsByKind: (kind: ConnectionKind) => AppConnection[];
  getConnectionBranches: () => ConnectionBranch[];
  getSharedRelationshipKinds: (targetUserId: string) => ConnectionKind[];
  getRelationshipSegmentsForUser: (targetUserId: string) => RelationshipColor[];
};

const CURRENT_USER_ID = 'user_current';
const USER_STORAGE_KEY = '@elus/current-user/v2';

export const relationshipColors: Record<ConnectionKind, RelationshipColor> = {
  family: {
    kind: 'family',
    label: 'Família',
    color: colors.family,
  },
  company: {
    kind: 'company',
    label: 'Profissional',
    color: colors.company,
  },
  interest: {
    kind: 'interest',
    label: 'Interesses',
    color: colors.interest,
  },
  preference: {
    kind: 'preference',
    label: 'Preferências',
    color: colors.preference,
  },
  service: {
    kind: 'service',
    label: 'Serviços',
    color: colors.service,
  },
  friend: {
    kind: 'friend',
    label: 'Amizade',
    color: colors.friend,
  },
  assisted: {
    kind: 'assisted',
    label: 'Apoio',
    color: colors.assisted,
  },
};

const currentUser: AppUser = {
  id: CURRENT_USER_ID,
  name: 'Novo usuário ELUS',
  email: '',
  photo: '',
  plan: 'free',
  profileType: 'person',
  presenceMode: 'personal',
  service: '',
  companyName: '',
  companyId: '',
  whatsapp: '',
  phone: '',
  instagram: '',
  city: '',
  state: '',
  verified: false,
  verificationStatus: 'unverified',
  verificationSubmittedAt: '',
  verificationDocumentType: '',
  verificationSelfieUri: '',
  interests: [],
  preferences: [],
  assistedBy: '',
  supportContact: '',
  profileCompleted: false,
};

const initialUsers: AppUser[] = [currentUser];

const AppContext = createContext<AppContextValue | null>(null);

function defaultLabelForKind(kind: ConnectionKind) {
  return relationshipColors[kind]?.label || 'Conexão';
}

function isBusinessUser(appUser?: AppUser) {
  return appUser?.profileType === 'business';
}

function normalizeVerificationStatus(
  verificationStatus?: string,
  legacyVerified?: boolean
): VerificationStatus {
  if (verificationStatus === 'verified') {
    return 'verified';
  }

  if (verificationStatus === 'in_review') {
    return 'in_review';
  }

  if (verificationStatus === 'pending') {
    return 'pending';
  }

  if (verificationStatus === 'unverified') {
    return 'unverified';
  }

  if (legacyVerified === true) {
    return 'verified';
  }

  return 'unverified';
}

function hasVerifiedIdentity(appUser?: AppUser) {
  const status = normalizeVerificationStatus(
    appUser?.verificationStatus,
    appUser?.verified
  );

  return appUser?.verified === true && status === 'verified';
}

function normalizeStoredUser(data: Partial<AppUser>): AppUser {
  const normalizedName = String(data.name ?? '').trim();
  const isPlaceholderUser =
    !normalizedName || normalizedName === 'Novo usuário ELUS';
  const profileCompleted = data.profileCompleted === true;

  const requestedVerificationStatus = normalizeVerificationStatus(
    data.verificationStatus,
    data.verified
  );

  const hasVerificationSubmission = Boolean(
    data.verificationSubmittedAt ||
      data.verificationDocumentType ||
      data.verificationSelfieUri
  );

  let verificationStatus: VerificationStatus = 'unverified';

  if (requestedVerificationStatus === 'verified') {
    // "Verificado" depende de verifications.status + o usuário já ter um nome
    // de verdade preenchido — não exige mais profile_completed (foto, bio etc),
    // mas evita mostrar "✓ Verificado" com nome ainda placeholder.
    verificationStatus = !isPlaceholderUser ? 'verified' : 'unverified';
  } else if (
    requestedVerificationStatus === 'in_review' ||
    requestedVerificationStatus === 'pending'
  ) {
    verificationStatus =
      hasVerificationSubmission || profileCompleted
        ? requestedVerificationStatus
        : 'unverified';
  }

  return {
    ...currentUser,
    ...data,
    id: data.id || CURRENT_USER_ID,
    name: normalizedName || currentUser.name,
    plan: data.plan || 'free',
    profileType: data.profileType || 'person',
    presenceMode: data.presenceMode || 'personal',
    verified: verificationStatus === 'verified',
    verificationStatus,
    verificationSubmittedAt:
      verificationStatus === 'unverified' ? '' : data.verificationSubmittedAt || '',
    verificationDocumentType:
      verificationStatus === 'unverified' ? '' : data.verificationDocumentType || '',
    verificationSelfieUri:
      verificationStatus === 'unverified' ? '' : data.verificationSelfieUri || '',
    interests: Array.isArray(data.interests) ? data.interests : currentUser.interests,
    preferences: Array.isArray(data.preferences) ? data.preferences : currentUser.preferences,
    profileCompleted,
  };
}

function normalizeMethodIds(methodIds: string[]) {
  return Array.from(
    new Set(
      methodIds
        .map((methodId) => String(methodId ?? '').trim())
        .filter(Boolean)
    )
  );
}

function getOtherUserId(connection: AppConnection, currentUserId: string) {
  if (connection.fromUserId === currentUserId) {
    return connection.toUserId;
  }

  if (connection.toUserId === currentUserId) {
    return connection.fromUserId;
  }

  return '';
}

function isSameUsersConnection(
  connection: AppConnection,
  currentUserId: string,
  targetUserId: string
) {
  return (
    (connection.fromUserId === currentUserId && connection.toUserId === targetUserId) ||
    (connection.fromUserId === targetUserId && connection.toUserId === currentUserId)
  );
}

function isSameUsersRequest(
  request: { fromUserId: string; toUserId: string },
  currentUserId: string,
  targetUserId: string
) {
  return (
    (request.fromUserId === currentUserId && request.toUserId === targetUserId) ||
    (request.fromUserId === targetUserId && request.toUserId === currentUserId)
  );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser>(currentUser);
  const [users, setUsers] = useState<AppUser[]>(initialUsers);
  const [realUsers, setRealUsers] = useState<AppUser[]>([]);
  const [connections, setConnections] = useState<AppConnection[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ConnectionRequest[]>([]);
  const [incomingContactInformationRequests, setIncomingContactInformationRequests] =
    useState<ContactInformationRequest[]>([]);
  const [outgoingContactInformationRequests, setOutgoingContactInformationRequests] =
    useState<ContactInformationRequest[]>([]);
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadContactRequestsFromSupabase(userId: string) {
      try {
        const [{ data: incomingRows }, { data: outgoingRows }] = await Promise.all([
          supabase
            .from('contact_requests')
            .select('id, from_user_id, to_user_id, requested_method_ids, approved_method_ids, status, created_at')
            .eq('to_user_id', userId),
          supabase
            .from('contact_requests')
            .select('id, from_user_id, to_user_id, requested_method_ids, approved_method_ids, status, created_at')
            .eq('from_user_id', userId),
        ]);

        if (!mounted) return;

        const mapContactRequest = (row: any): ContactInformationRequest => ({
          id: String(row.id),
          fromUserId: String(row.from_user_id),
          toUserId: String(row.to_user_id),
          requestedMethodIds: Array.isArray(row.requested_method_ids) ? row.requested_method_ids : [],
          approvedMethodIds: Array.isArray(row.approved_method_ids) ? row.approved_method_ids : [],
          status: (row.status as RequestStatus) || 'pending',
          createdAt: row.created_at || new Date().toISOString(),
        });

        if (mounted) {
          setIncomingContactInformationRequests((incomingRows ?? []).map(mapContactRequest));
          setOutgoingContactInformationRequests((outgoingRows ?? []).map(mapContactRequest));
        }
      } catch {
        // Mantém estado vazio se Supabase falhar.
      }
    }

    async function loadConnectionsFromSupabase(userId: string) {
      try {
        const [
          { data: incomingRows },
          { data: outgoingRows },
          { data: connectionRows },
        ] = await Promise.all([
          supabase
            .from('connection_requests')
            .select('id, from_user_id, to_user_id, kind, status, created_at')
            .eq('to_user_id', userId),
          supabase
            .from('connection_requests')
            .select('id, from_user_id, to_user_id, kind, status, created_at')
            .eq('from_user_id', userId),
          supabase
            .from('connections')
            .select('id, from_user_id, to_user_id, kind, created_at')
            .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`),
        ]);

        if (!mounted) return;

        const mapRequest = (row: any): ConnectionRequest => ({
          id: String(row.id),
          fromUserId: String(row.from_user_id),
          toUserId: String(row.to_user_id),
          kind: (row.kind as ConnectionKind) || 'friend',
          label: defaultLabelForKind((row.kind as ConnectionKind) || 'friend'),
          status: (row.status as RequestStatus) || 'pending',
          createdAt: row.created_at || new Date().toISOString(),
        });

        const incoming = (incomingRows ?? []).map(mapRequest);
        const outgoing = (outgoingRows ?? []).map(mapRequest);

        const mappedConnections: AppConnection[] = (connectionRows ?? []).map((row: any) => ({
          id: String(row.id),
          fromUserId: String(row.from_user_id),
          toUserId: String(row.to_user_id),
          kind: (row.kind as ConnectionKind) || 'friend',
          label: defaultLabelForKind((row.kind as ConnectionKind) || 'friend'),
          status: 'accepted' as RequestStatus,
          createdAt: row.created_at || new Date().toISOString(),
          requiresMutualApproval: true,
        }));

        if (mounted) {
          setIncomingRequests(incoming);
          setOutgoingRequests(outgoing);
          setConnections(mappedConnections);
        }
      } catch {
        // Mantém estado vazio se Supabase falhar.
      }
    }

    async function loadRealUsers(currentUserId: string) {
      try {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select(
            'id, name, city, state, surname, origin_city, origin_state, presence_mode, photo_url, last_seen_at'
          )
          .neq('id', currentUserId)
          .limit(100);

        if (!mounted || !profileRows || profileRows.length === 0) return;

        const ids = profileRows.map((p: any) => p.id as string);

        const [{ data: userRows }, { data: verificationRows }] = await Promise.all([
          supabase.from('users').select('id, plan, profile_type').in('id', ids),
          supabase
            .from('verifications')
            .select('user_id, status')
            .in('user_id', ids)
            .eq('is_current', true),
        ]);

        const userMap: Record<string, any> = {};
        (userRows ?? []).forEach((u: any) => { userMap[u.id] = u; });

        const verMap: Record<string, any> = {};
        (verificationRows ?? []).forEach((v: any) => { verMap[v.user_id] = v; });

        const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

        const mapped: AppUser[] = profileRows.map((profile: any) => {
          const userData = userMap[profile.id];
          const verData = verMap[profile.id];
          const verStatus: VerificationStatus = (verData?.status as VerificationStatus) || 'unverified';

          const lastSeenAt = profile.last_seen_at ? new Date(profile.last_seen_at).getTime() : null;
          const isOnline = lastSeenAt !== null && !Number.isNaN(lastSeenAt)
            ? Date.now() - lastSeenAt < ONLINE_THRESHOLD_MS
            : false;

          return {
            id: profile.id,
            name: profile.name || 'Usuário ELUS',
            email: '',
            photo: profile.photo_url || '',
            plan: (userData?.plan as PlanType) || 'free',
            profileType: (userData?.profile_type as ProfileType) || 'person',
            presenceMode: (profile.presence_mode as PresenceMode) || 'personal',
            city: profile.city || '',
            state: profile.state || '',
            surname: profile.surname || '',
            originCity: profile.origin_city || '',
            originState: profile.origin_state || '',
            verified: verStatus === 'verified',
            verificationStatus: verStatus,
            interests: [],
            preferences: [],
            profileCompleted: true,
            service: '',
            companyName: '',
            companyId: '',
            whatsapp: '',
            phone: '',
            instagram: '',
            assistedBy: '',
            supportContact: '',
            isOnline,
          };
        });

        // Deduplicar por ID (segurança contra chamadas concorrentes)
        const seen = new Set<string>();
        const deduplicated = mapped.filter(u => {
          if (seen.has(u.id)) return false;
          seen.add(u.id);
          return true;
        });

        if (mounted) {
          setRealUsers(deduplicated);
        }
      } catch {
        // Mantém lista vazia em caso de falha.
      }
    }

    async function loadBlockedUsers(userId: string) {
      try {
        const { data } = await supabase
          .from('blocked_users')
          .select('blocked_id')
          .eq('blocker_id', userId);

        if (!mounted || !data) return;

        const ids = (data as any[]).map((row) => String(row.blocked_id)).filter(Boolean);

        if (mounted) {
          setBlockedUserIds(ids);
        }
      } catch {
        // Mantém lista vazia se Supabase falhar.
      }
    }

    async function loadUserFromSupabase(userId: string) {
      try {
        const [{ data: userData }, { data: profileData }, { data: verificationData }] =
          await Promise.all([
            supabase.from('users').select('*').eq('id', userId).maybeSingle(),
            supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
            supabase.from('verifications').select('*').eq('user_id', userId).eq('is_current', true).maybeSingle(),
          ]);

        if (!mounted) return;

        if (userData && profileData) {
          updateUser({
            id: userId,
            email: userData.email || '',
            plan: userData.plan || 'free',
            profileType: userData.profile_type || 'person',
            profileCompleted: userData.profile_completed || false,
            name: profileData.name || 'Novo usuário ELUS',
            city: profileData.city || '',
            state: profileData.state || '',
            surname: profileData.surname || '',
            originCity: profileData.origin_city || '',
            originState: profileData.origin_state || '',
            presenceMode: profileData.presence_mode || 'personal',
            verified: verificationData?.status === 'verified',
            verificationStatus: verificationData?.status || 'unverified',
            verificationDocumentType: verificationData?.document_type || '',
          });
        }
      } catch {
        // Mantém dados locais se Supabase falhar.
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user && mounted) {
        const uid = data.session.user.id;
        loadUserFromSupabase(uid);
        loadRealUsers(uid);
        loadConnectionsFromSupabase(uid);
        loadContactRequestsFromSupabase(uid);
        loadBlockedUsers(uid);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Ignora eventos de logout — quem cuida de limpar o estado
      // é a função logout() do próprio contexto, não este listener.
      // Isso evita repopular o usuário com dados de um evento
      // tardio/atrasado que chegue depois do logout já ter rodado.
      if (event === 'SIGNED_OUT') {
        return;
      }

      // Ignora o evento de recuperação de senha — a tela
      // forgot-password.tsx é responsável por todo esse fluxo
      // (verificar código, atualizar senha e deslogar ao final).
      // Sem este early return, este listener trataria a sessão
      // temporária de recovery como um login normal.
      if (event === 'PASSWORD_RECOVERY') {
        return;
      }

      if (session?.user) {
        const uid = session.user.id;
        loadUserFromSupabase(uid);
        loadRealUsers(uid);
        loadConnectionsFromSupabase(uid);
        loadContactRequestsFromSupabase(uid);
        loadBlockedUsers(uid);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Atualiza last_seen_at do usuário logado sempre que o app volta pro
  // primeiro plano. Mesmo padrão de AppState usado em src/lib/supabase.ts
  // para o auto-refresh. Disparar e esquecer: não bloqueia nem trata erro,
  // é só um sinal de presença "melhor esforço".
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        return;
      }

      if (!user.id || user.id === CURRENT_USER_ID) {
        return;
      }

      supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id)
        .then(({ error }) => {
          if (error) {
            console.warn('[ELUS] Falha ao atualizar last_seen_at:', error.message);
          }
        });
    });

    return () => {
      subscription.remove();
    };
  }, [user.id]);

  const isPaidUser = user.plan === 'premium_person' || user.plan === 'premium_business';
  const isIdentityVerified = hasVerifiedIdentity(user);
  const canRequestConnections = isIdentityVerified;
  const canUseAdvancedPresence = isPaidUser;
  const canUseCompanyBranches = user.plan === 'premium_business';

  useEffect(() => {
    let mounted = true;

    async function loadStoredUser() {
      try {
        const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);

        if (!mounted) {
          return;
        }

        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as Partial<AppUser>;
          const { verified: _v, verificationStatus: _vs, ...restParsed } = parsedUser;
          const normalizedUser = normalizeStoredUser(restParsed);

          setUser(normalizedUser);
          setUsers((currentUsers) =>
            currentUsers.map((item) =>
              item.id === normalizedUser.id ? normalizedUser : item
            )
          );
        }
      } catch {
        // Mantém o usuário inicial se houver erro ao carregar o armazenamento local.
      } finally {
        if (mounted) {
          setStorageReady(true);
        }
      }
    }

    loadStoredUser();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user)).catch(() => {
      // Evita quebrar o app se o armazenamento local falhar.
    });
  }, [user, storageReady]);

  function getUserById(userId: string) {
    return users.find((item) => item.id === userId);
  }

  function syncUserInList(updatedUser: AppUser) {
    setUsers((currentUsers) =>
      currentUsers.map((item) => (item.id === updatedUser.id ? updatedUser : item))
    );
  }

  function updateUser(data: Partial<AppUser>) {
    setUser((current) => {
      const updatedUser = normalizeStoredUser({
        ...current,
        ...data,
      });

      syncUserInList(updatedUser);

      return updatedUser;
    });
  }

  function login(data?: Partial<AppUser>) {
    const nextStatus = normalizeVerificationStatus(
      data?.verificationStatus || user.verificationStatus,
      data?.verified ?? user.verified
    );

    updateUser({
      ...data,
      verified: nextStatus === 'verified',
      verificationStatus: nextStatus,
      profileCompleted: data?.profileCompleted ?? user.profileCompleted ?? true,
    });
  }

  function signup(data?: Partial<AppUser>) {
    updateUser({
      id: CURRENT_USER_ID,
      name: data?.name || 'Novo usuário ELUS',
      email: data?.email || '',
      photo: data?.photo || '',
      plan: data?.plan || 'free',
      profileType: data?.profileType || 'person',
      presenceMode: 'personal',
      service: '',
      companyName: '',
      companyId: '',
      whatsapp: '',
      phone: '',
      instagram: '',
      city: data?.city || '',
      state: data?.state || '',
      verified: false,
      verificationStatus: 'unverified',
      verificationSubmittedAt: '',
      verificationDocumentType: '',
      verificationSelfieUri: '',
      interests: Array.isArray(data?.interests) ? data.interests : [],
      preferences: Array.isArray(data?.preferences) ? data.preferences : [],
      assistedBy: '',
      supportContact: '',
      profileCompleted: false,
    });
  }

  function logout() {
    const loggedOutUser = normalizeStoredUser({
      id: CURRENT_USER_ID,
      name: 'Novo usuário ELUS',
      email: '',
      photo: '',
      plan: 'free',
      profileType: 'person',
      presenceMode: 'personal',
      service: '',
      companyName: '',
      companyId: '',
      whatsapp: '',
      phone: '',
      instagram: '',
      city: '',
      state: '',
      verified: false,
      verificationStatus: 'unverified',
      verificationSubmittedAt: '',
      verificationDocumentType: '',
      verificationSelfieUri: '',
      interests: [],
      preferences: [],
      assistedBy: '',
      supportContact: '',
      profileCompleted: false,
    });

    setUser(loggedOutUser);
    syncUserInList(loggedOutUser);

    AsyncStorage.removeItem(USER_STORAGE_KEY).catch(() => {
      // Evita quebrar o app se o armazenamento local falhar.
    });
  }

  function completeProfile(data: Partial<AppUser>) {
    const finalPresenceMode: PresenceMode =
      user.plan === 'free'
        ? 'personal'
        : data.presenceMode || user.presenceMode || 'personal';

    updateUser({
      ...data,
      presenceMode: finalPresenceMode,
      profileCompleted: true,
    });
  }

  function setProfileType(profileType: ProfileType) {
    updateUser({ profileType });
  }

  function setPresenceMode(presenceMode: PresenceMode) {
    if (!canUseAdvancedPresence && presenceMode !== 'personal') {
      updateUser({ presenceMode: 'personal' });
      return;
    }

    updateUser({ presenceMode });
  }

  function upgradePlan(plan: PlanType) {
    const nextPresenceMode: PresenceMode = plan === 'free' ? 'personal' : user.presenceMode;

    updateUser({
      plan,
      presenceMode: nextPresenceMode,
    });
  }

  function submitIdentityVerification(data?: IdentityVerificationData) {
    updateUser({
      verified: false,
      verificationStatus: 'in_review',
      verificationSubmittedAt: new Date().toISOString(),
      verificationDocumentType: data?.documentType || user.verificationDocumentType || '',
      verificationSelfieUri: data?.selfieUri || user.verificationSelfieUri || '',
    });
  }

  function setIdentityVerified() {
    updateUser({
      verified: true,
      verificationStatus: 'verified',
    });
  }

  function setIdentityUnverified() {
    updateUser({
      verified: false,
      verificationStatus: 'unverified',
      verificationSubmittedAt: '',
      verificationDocumentType: '',
      verificationSelfieUri: '',
    });
  }

  function getSharedRelationshipKinds(targetUserId: string) {
    if (!isIdentityVerified) {
      return [];
    }

    const targetUser = getUserById(targetUserId);

    if (!hasVerifiedIdentity(targetUser)) {
      return [];
    }

    const kinds = connections
      .filter((connection) => {
        const sameUsers = isSameUsersConnection(connection, user.id, targetUserId);

        return sameUsers && connection.status === 'accepted';
      })
      .map((connection) => connection.kind);

    const uniqueKinds = Array.from(new Set(kinds));

    if (isBusinessUser(targetUser)) {
      return uniqueKinds.filter((kind) => kind === 'company' || kind === 'interest').slice(0, 2);
    }

    const priority: ConnectionKind[] = [
      'family',
      'company',
      'interest',
      'preference',
      'service',
      'assisted',
      'friend',
    ];

    return priority.filter((kind) => uniqueKinds.includes(kind)).slice(0, 5);
  }

  function getRelationshipSegmentsForUser(targetUserId: string) {
    return getSharedRelationshipKinds(targetUserId).map((kind) => relationshipColors[kind]);
  }

  function hasAcceptedConnection(targetUserId: string, kind: ConnectionKind) {
    return connections.some((connection) => {
      const sameUsers = isSameUsersConnection(connection, user.id, targetUserId);

      return sameUsers && connection.kind === kind && connection.status === 'accepted';
    });
  }

  function hasPendingRequest(targetUserId: string, kind: ConnectionKind) {
    const pendingIncomingRequest = incomingRequests.some((request) => {
      const sameUsers = isSameUsersRequest(request, user.id, targetUserId);

      return sameUsers && request.kind === kind && request.status === 'pending';
    });

    const pendingOutgoingRequest = outgoingRequests.some((request) => {
      const sameUsers = isSameUsersRequest(request, user.id, targetUserId);

      return sameUsers && request.kind === kind && request.status === 'pending';
    });

    return pendingIncomingRequest || pendingOutgoingRequest;
  }

  function hasPendingContactInformationRequest(targetUserId: string) {
    const pendingIncomingRequest = incomingContactInformationRequests.some((request) => {
      const sameUsers = isSameUsersRequest(request, user.id, targetUserId);

      return sameUsers && request.status === 'pending';
    });

    const pendingOutgoingRequest = outgoingContactInformationRequests.some((request) => {
      const sameUsers = isSameUsersRequest(request, user.id, targetUserId);

      return sameUsers && request.status === 'pending';
    });

    return pendingIncomingRequest || pendingOutgoingRequest;
  }

  function canCreateProtectedRequest(targetUserId: string, kind: ConnectionKind) {
    if (!isIdentityVerified) return false;
    if (!targetUserId || targetUserId === user.id) return false;

    const targetUser = getUserById(targetUserId);

    if (!hasVerifiedIdentity(targetUser)) return false;

    const currentKinds = getSharedRelationshipKinds(targetUserId);

    if (isBusinessUser(targetUser)) {
      const allowedBusinessKinds: ConnectionKind[] = ['company', 'interest'];

      if (!allowedBusinessKinds.includes(kind)) return false;
      if (currentKinds.length >= 2 && !currentKinds.includes(kind)) return false;
    } else if (currentKinds.length >= 5 && !currentKinds.includes(kind)) {
      return false;
    }

    if (hasAcceptedConnection(targetUserId, kind)) return false;
    if (hasPendingRequest(targetUserId, kind)) return false;

    return true;
  }

  function createAcceptedConnection(targetUserId: string, kind: ConnectionKind, label?: string) {
    if (!isIdentityVerified) return;
    if (!targetUserId || targetUserId === user.id) return;

    const targetUser = getUserById(targetUserId);

    if (!hasVerifiedIdentity(targetUser)) return;

    const currentKinds = getSharedRelationshipKinds(targetUserId);

    if (isBusinessUser(targetUser)) {
      const allowedBusinessKinds: ConnectionKind[] = ['company', 'interest'];

      if (!allowedBusinessKinds.includes(kind)) return;
      if (currentKinds.length >= 2 && !currentKinds.includes(kind)) return;
    } else if (currentKinds.length >= 5 && !currentKinds.includes(kind)) {
      return;
    }

    if (hasAcceptedConnection(targetUserId, kind)) return;

    const newConnection: AppConnection = {
      id: `conn_${Date.now()}_${kind}`,
      fromUserId: user.id,
      toUserId: targetUserId,
      kind,
      label: label || defaultLabelForKind(kind),
      status: 'accepted',
      createdAt: new Date().toISOString(),
      requiresMutualApproval: true,
    };

    setConnections((current) => [newConnection, ...current]);
  }

  function createConnection(targetUserId: string, kind: ConnectionKind, label?: string) {
    if (!canCreateProtectedRequest(targetUserId, kind)) return;

    const request: ConnectionRequest = {
      id: `req_${Date.now()}_${kind}`,
      fromUserId: user.id,
      toUserId: targetUserId,
      kind,
      label: label || defaultLabelForKind(kind),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setOutgoingRequests((current) => [request, ...current]);

    supabase
      .from('connection_requests')
      .insert({ from_user_id: user.id, to_user_id: targetUserId, kind, status: 'pending' })
      .then(() => {});
  }

  function removeConnection(targetUserId: string, kind: ConnectionKind) {
    setConnections((current) =>
      current.filter((connection) => {
        const sameUsers = isSameUsersConnection(connection, user.id, targetUserId);

        return !(sameUsers && connection.kind === kind);
      })
    );
  }

  function toggleConnection(targetUserId: string, kind: ConnectionKind, label?: string) {
    if (!isIdentityVerified) return;

    const targetUser = getUserById(targetUserId);

    if (!hasVerifiedIdentity(targetUser)) return;

    const exists = getSharedRelationshipKinds(targetUserId).includes(kind);

    if (exists) {
      removeConnection(targetUserId, kind);
      return;
    }

    createConnection(targetUserId, kind, label);
  }

  function requestFamilyConnection(targetUserId: string, label = 'Confirmar vínculo familiar') {
    if (!canCreateProtectedRequest(targetUserId, 'family')) return;

    const request: ConnectionRequest = {
      id: `req_${Date.now()}_family`,
      fromUserId: user.id,
      toUserId: targetUserId,
      kind: 'family',
      label,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setOutgoingRequests((current) => [request, ...current]);

    supabase
      .from('connection_requests')
      .insert({ from_user_id: user.id, to_user_id: targetUserId, kind: 'family', status: 'pending' })
      .then(() => {});
  }

  function acceptConnectionRequest(requestId: string) {
    if (!isIdentityVerified) return;

    const request = incomingRequests.find((item) => item.id === requestId);

    if (!request || request.status !== 'pending') return;

    const requester = getUserById(request.fromUserId);

    if (!hasVerifiedIdentity(requester)) return;

    setIncomingRequests((current) =>
      current.map((item) => (item.id === requestId ? { ...item, status: 'accepted' } : item))
    );

    createAcceptedConnection(request.fromUserId, request.kind, request.label);

    supabase
      .from('connection_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
      .then(() => {});

    supabase
      .from('connections')
      .insert({ from_user_id: user.id, to_user_id: request.fromUserId, kind: request.kind })
      .then(() => {});
  }

  function rejectConnectionRequest(requestId: string) {
    setIncomingRequests((current) =>
      current.map((item) => (item.id === requestId ? { ...item, status: 'rejected' } : item))
    );

    supabase
      .from('connection_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .then(() => {});
  }

  function requestContactInformation(
    targetUserId: string,
    requestedMethodIds: string[],
    note?: string
  ) {
    if (!isIdentityVerified) return;
    if (!targetUserId || targetUserId === user.id) return;

    const normalizedMethodIds = normalizeMethodIds(requestedMethodIds);

    if (normalizedMethodIds.length === 0) return;
    if (hasPendingContactInformationRequest(targetUserId)) return;

    const request: ContactInformationRequest = {
      id: `contact_req_${Date.now()}`,
      fromUserId: user.id,
      toUserId: targetUserId,
      requestedMethodIds: normalizedMethodIds,
      approvedMethodIds: [],
      status: 'pending',
      createdAt: new Date().toISOString(),
      note: note?.trim() || '',
    };

    setOutgoingContactInformationRequests((current) => [request, ...current]);

    supabase
      .from('contact_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: targetUserId,
        requested_method_ids: normalizedMethodIds,
        status: 'pending',
      })
      .then(() => {});
  }

  function acceptContactInformationRequest(
    requestId: string,
    approvedMethodIds: string[]
  ) {
    const request = incomingContactInformationRequests.find(
      (item) => item.id === requestId
    );

    if (!request || request.status !== 'pending') return;

    const normalizedApprovedMethodIds = normalizeMethodIds(approvedMethodIds).filter(
      (methodId) => request.requestedMethodIds.includes(methodId)
    );

    if (normalizedApprovedMethodIds.length === 0) return;

    setIncomingContactInformationRequests((current) =>
      current.map((item) =>
        item.id === requestId
          ? {
              ...item,
              approvedMethodIds: normalizedApprovedMethodIds,
              status: 'accepted',
              respondedAt: new Date().toISOString(),
            }
          : item
      )
    );

    supabase
      .from('contact_requests')
      .update({ status: 'accepted', approved_method_ids: normalizedApprovedMethodIds })
      .eq('id', requestId)
      .then(() => {});
  }

  function rejectContactInformationRequest(requestId: string) {
    setIncomingContactInformationRequests((current) =>
      current.map((item) =>
        item.id === requestId
          ? {
              ...item,
              approvedMethodIds: [],
              status: 'rejected',
              respondedAt: new Date().toISOString(),
            }
          : item
      )
    );

    supabase
      .from('contact_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
      .then(() => {});
  }

  function isBlocked(userId: string): boolean {
    return blockedUserIds.includes(userId);
  }

  async function blockUser(userId: string): Promise<void> {
    if (!userId || userId === user.id) return;

    setBlockedUserIds((current) =>
      current.includes(userId) ? current : [...current, userId]
    );

    try {
      await supabase.from('blocked_users').insert({
        blocker_id: user.id,
        blocked_id: userId,
      });
    } catch {
      // Mantém o estado local mesmo se Supabase falhar.
    }
  }

  async function unblockUser(userId: string): Promise<void> {
    if (!userId) return;

    setBlockedUserIds((current) => current.filter((id) => id !== userId));

    try {
      await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);
    } catch {
      // Mantém o estado local mesmo se Supabase falhar.
    }
  }

  function getConnectionsByKind(kind: ConnectionKind) {
    if (!isIdentityVerified) {
      return [];
    }

    return connections.filter((connection) => {
      const belongsToUser = connection.fromUserId === user.id || connection.toUserId === user.id;

      if (!belongsToUser || connection.kind !== kind || connection.status !== 'accepted') {
        return false;
      }

      const otherUserId = getOtherUserId(connection, user.id);
      const otherUser = getUserById(otherUserId);

      return hasVerifiedIdentity(otherUser);
    });
  }

  function getConnectionBranches(): ConnectionBranch[] {
    return [
      {
        kind: 'family',
        title: 'Família',
        description: 'Vínculos familiares confirmados pelos dois perfis.',
        color: relationshipColors.family.color,
        connections: getConnectionsByKind('family'),
      },
      {
        kind: 'company',
        title: 'Profissional',
        description: 'Trabalho, empresa ou atividade profissional em comum.',
        color: relationshipColors.company.color,
        connections: getConnectionsByKind('company'),
      },
      {
        kind: 'interest',
        title: 'Interesses',
        description: 'Gostos, assuntos ou objetivos parecidos.',
        color: relationshipColors.interest.color,
        connections: getConnectionsByKind('interest'),
      },
      {
        kind: 'preference',
        title: 'Preferências',
        description: 'Escolhas e preferências semelhantes.',
        color: relationshipColors.preference.color,
        connections: getConnectionsByKind('preference'),
      },
      {
        kind: 'service',
        title: 'Serviços',
        description: 'Procura ou oferta de serviços.',
        color: relationshipColors.service.color,
        connections: getConnectionsByKind('service'),
      },
      {
        kind: 'assisted',
        title: 'Apoio',
        description: 'Apoio para perfil assistido.',
        color: relationshipColors.assisted.color,
        connections: getConnectionsByKind('assisted'),
      },
    ];
  }

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      users,
      realUsers,
      connections,
      incomingRequests,
      outgoingRequests,
      incomingContactInformationRequests,
      outgoingContactInformationRequests,
      blockedUserIds,

      isPaidUser,
      isIdentityVerified,
      canRequestConnections,
      canUseAdvancedPresence,
      canUseCompanyBranches,

      relationshipColors,

      login,
      signup,
      logout,

      updateUser,
      completeProfile,
      setProfileType,
      setPresenceMode,
      upgradePlan,

      submitIdentityVerification,
      setIdentityVerified,
      setIdentityUnverified,

      createConnection,
      removeConnection,
      toggleConnection,

      requestFamilyConnection,
      acceptConnectionRequest,
      rejectConnectionRequest,

      requestContactInformation,
      acceptContactInformationRequest,
      rejectContactInformationRequest,

      blockUser,
      unblockUser,
      isBlocked,

      getUserById,
      getConnectionsByKind,
      getConnectionBranches,
      getSharedRelationshipKinds,
      getRelationshipSegmentsForUser,
    }),
    [
      user,
      users,
      realUsers,
      connections,
      incomingRequests,
      outgoingRequests,
      incomingContactInformationRequests,
      outgoingContactInformationRequests,
      blockedUserIds,
      isPaidUser,
      isIdentityVerified,
      canRequestConnections,
      canUseAdvancedPresence,
      canUseCompanyBranches,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp precisa ser usado dentro de AppProvider');
  }

  return context;
}
