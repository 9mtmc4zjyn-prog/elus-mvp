import React from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

const COLORS = {
  background: '#03040A',
  card: 'rgba(12,15,27,0.94)',
  border: 'rgba(255,255,255,0.10)',
  text: '#FFFFFF',
  muted: 'rgba(210,218,236,0.80)',
  soft: 'rgba(255,255,255,0.46)',
  blue: '#2D64FF',
  blueLight: '#8FB3FF',
  cyan: '#26D9FF',
  gold: '#D9B46A',
  green: '#22C55E',
};

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Paragraph({ children }: { children: string }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function BulletItem({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export default function TermsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Termos de Uso</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>ELUS · Vigência: junho de 2026</Text>
        </View>

        <Text style={styles.introText}>
          Bem-vindo ao ELUS — uma plataforma de infraestrutura de confiança humana. Ao criar uma
          conta e usar o ELUS, você concorda integralmente com estes Termos de Uso. Leia com atenção.
        </Text>

        {/* 1 */}
        <SectionTitle>1. O que é o ELUS</SectionTitle>
        <Paragraph>
          O ELUS é uma plataforma de conexões humanas baseada em identidade real, verificação de
          identidade e aprovação explícita. Seu propósito é criar vínculos de confiança entre pessoas,
          empresas e organizações — com respeito, intenção e profundidade.
        </Paragraph>
        <Paragraph>
          O ELUS não é uma rede social convencional. Nenhuma conexão, contato ou vínculo é criado
          automaticamente. Tudo depende da vontade e aprovação das partes envolvidas.
        </Paragraph>

        {/* 2 */}
        <SectionTitle>2. Idade mínima</SectionTitle>
        <Paragraph>
          O uso do ELUS é permitido apenas para pessoas com 16 (dezesseis) anos de idade ou mais.
          Menores de 16 anos não podem criar perfis, enviar dados pessoais ou utilizar qualquer
          funcionalidade da plataforma.
        </Paragraph>
        <Paragraph>
          Caso identifiquemos que um perfil pertence a menor de 16 anos, ele será imediatamente
          suspenso e os dados removidos.
        </Paragraph>

        {/* 3 */}
        <SectionTitle>3. Identidade real e verificação obrigatória</SectionTitle>
        <Paragraph>
          O ELUS exige que todos os usuários utilizem identidade real. É proibido criar perfis com
          nomes falsos, apelidos substitutos de identidade, identidades fictícias ou dados inventados.
        </Paragraph>
        <Paragraph>
          Para desbloquear conexões reais e acesso completo à plataforma, o usuário deve concluir o
          processo de verificação de identidade, que consiste em:
        </Paragraph>
        <BulletItem>Envio de selfie segurando documento oficial com foto (RG, CNH ou passaporte)</BulletItem>
        <BulletItem>Análise manual ou automatizada pelo ELUS</BulletItem>
        <BulletItem>Aprovação do status "Verificado"</BulletItem>
        <Paragraph>
          A verificação é única e não é solicitada a cada login. Perfis não verificados têm acesso
          limitado à plataforma.
        </Paragraph>

        {/* 4 */}
        <SectionTitle>4. Proibições absolutas</SectionTitle>
        <Paragraph>É estritamente proibido no ELUS:</Paragraph>
        <BulletItem>Criar perfis falsos, duplicados ou de terceiros sem autorização</BulletItem>
        <BulletItem>Usar bots, scripts automáticos ou qualquer tipo de automação</BulletItem>
        <BulletItem>Agir de forma anônima ou com identidade deliberadamente ocultada</BulletItem>
        <BulletItem>Assediar, ameaçar, discriminar ou praticar qualquer forma de violência contra outros usuários</BulletItem>
        <BulletItem>Aplicar golpes, fraudes ou enganar outros usuários</BulletItem>
        <BulletItem>Publicar conteúdo ofensivo, pornográfico, ilegal ou que viole direitos de terceiros</BulletItem>
        <BulletItem>Usar a plataforma para fins comerciais não autorizados ou spam</BulletItem>
        <BulletItem>Tentar contornar mecanismos de verificação, segurança ou privacidade</BulletItem>

        {/* 5 */}
        <SectionTitle>5. Regras de uso: afinidade e conexão</SectionTitle>
        <Paragraph>
          O ELUS detecta afinidades contextualmente com base em interesses, localização aproximada,
          modo de presença e outros campos do perfil. Afinidade automática NÃO é conexão real.
        </Paragraph>
        <BulletItem>Afinidade não libera dados de contato</BulletItem>
        <BulletItem>Afinidade não cria vínculo entre perfis</BulletItem>
        <BulletItem>Conexão real exige: dois perfis verificados + solicitação enviada + aprovação explícita do outro lado</BulletItem>
        <BulletItem>Dados de contato (WhatsApp, telefone, e-mail) só são compartilhados após solicitação e aprovação</BulletItem>

        {/* 6 */}
        <SectionTitle>6. Pagamento e planos</SectionTitle>
        <Paragraph>
          O ELUS oferece planos pagos com funcionalidades adicionais. O pagamento nunca:
        </Paragraph>
        <BulletItem>Substitui a verificação de identidade</BulletItem>
        <BulletItem>Libera dados de contato automaticamente</BulletItem>
        <BulletItem>Cria conexões ou vínculos sem aprovação</BulletItem>
        <BulletItem>Garante visibilidade privilegiada sobre outros usuários</BulletItem>
        <Paragraph>
          Planos pagos desbloqueiam modos de presença avançados e funcionalidades de visibilidade,
          mas respeitam integralmente as mesmas regras de confiança e verificação.
        </Paragraph>

        {/* 7 */}
        <SectionTitle>7. Privacidade e localização</SectionTitle>
        <Paragraph>
          O ELUS nunca exibe sua localização exata para outros usuários. Apenas a região aproximada
          (cidade e estado) pode ser visível conforme as configurações do seu perfil.
        </Paragraph>
        <Paragraph>
          Seus dados pessoais são tratados conforme a Política de Privacidade do ELUS e a Lei Geral
          de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </Paragraph>

        {/* 8 */}
        <SectionTitle>8. Direitos do usuário</SectionTitle>
        <Paragraph>Você tem direito a:</Paragraph>
        <BulletItem>Acessar, corrigir ou atualizar seus dados a qualquer momento</BulletItem>
        <BulletItem>Solicitar a exclusão da sua conta e dados pessoais</BulletItem>
        <BulletItem>Revogar consentimentos concedidos</BulletItem>
        <BulletItem>Saber como seus dados são usados</BulletItem>
        <BulletItem>Denunciar perfis e comportamentos inadequados</BulletItem>
        <BulletItem>Bloquear outros usuários</BulletItem>

        {/* 9 */}
        <SectionTitle>9. Deveres do usuário</SectionTitle>
        <Paragraph>Você se compromete a:</Paragraph>
        <BulletItem>Fornecer informações verdadeiras e mantê-las atualizadas</BulletItem>
        <BulletItem>Usar o ELUS de forma ética, respeitosa e em conformidade com a lei</BulletItem>
        <BulletItem>Não compartilhar sua conta com terceiros</BulletItem>
        <BulletItem>Manter a confidencialidade da sua senha</BulletItem>
        <BulletItem>Respeitar os outros usuários e suas configurações de privacidade</BulletItem>

        {/* 10 */}
        <SectionTitle>10. Consequências de violação</SectionTitle>
        <Paragraph>
          O descumprimento destes Termos pode resultar em:
        </Paragraph>
        <BulletItem>Aviso formal ao usuário</BulletItem>
        <BulletItem>Suspensão temporária da conta</BulletItem>
        <BulletItem>Banimento permanente da plataforma</BulletItem>
        <BulletItem>Notificação às autoridades competentes em casos de atividade ilegal</BulletItem>
        <Paragraph>
          O ELUS se reserva o direito de tomar as medidas necessárias para proteger a comunidade e
          a integridade da plataforma.
        </Paragraph>

        {/* 11 */}
        <SectionTitle>11. Modificações dos Termos</SectionTitle>
        <Paragraph>
          O ELUS pode atualizar estes Termos de Uso periodicamente. Você será notificado sobre
          mudanças relevantes. O uso contínuo da plataforma após a notificação implica aceitação
          dos novos termos.
        </Paragraph>

        {/* 12 */}
        <SectionTitle>12. Contato e suporte</SectionTitle>
        <Paragraph>
          Para dúvidas, solicitações ou denúncias relacionadas a estes Termos, entre em contato
          com nossa equipe pelo e-mail: suporte@elus.com.br
        </Paragraph>
        <Paragraph>
          Para questões relacionadas à proteção de dados, contate nosso Encarregado de Dados (DPO):
          privacidade@elus.com.br
        </Paragraph>

        <View style={styles.divider} />

        <Text style={styles.vigencia}>
          Estes Termos de Uso entram em vigor em junho de 2026.{'\n'}
          ELUS · Conexões que importam.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.acceptButtonText}>Li e aceito ✓</Text>
        </Pressable>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  header: {
    height: 64,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 40 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: { color: COLORS.text, fontSize: 30, lineHeight: 32, marginTop: -2 },
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 40 },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(45,100,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,100,255,0.30)',
    marginBottom: 18,
  },
  heroBadgeText: { color: COLORS.blueLight, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  introText: {
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 26,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
    paddingLeft: 12,
  },
  paragraph: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 23,
    fontWeight: '600',
    marginBottom: 10,
  },
  bulletRow: { flexDirection: 'row', marginBottom: 7, paddingLeft: 8 },
  bulletDot: { color: COLORS.cyan, fontSize: 16, marginRight: 8, marginTop: 1, lineHeight: 22 },
  bulletText: { flex: 1, color: COLORS.muted, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 28 },
  vigencia: {
    color: COLORS.soft,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  acceptButton: {
    minHeight: 58,
    borderRadius: 26,
    backgroundColor: COLORS.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.blue,
    shadowOpacity: 0.40,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  acceptButtonText: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  bottomSpace: { height: 40 },
  pressed: { opacity: 0.75 },
});
