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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>Política de Privacidade</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>ELUS · LGPD · Vigência: junho de 2026</Text>
        </View>

        <Text style={styles.introText}>
          A sua privacidade é fundamental para o ELUS. Esta Política descreve quais dados coletamos,
          como os usamos, como os protegemos e quais são os seus direitos como titular dos dados,
          em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
        </Text>

        {/* 1 */}
        <SectionTitle>1. Quais dados coletamos</SectionTitle>
        <Paragraph>Coletamos apenas os dados necessários para o funcionamento do ELUS:</Paragraph>
        <BulletItem>Nome completo (identidade real, obrigatório)</BulletItem>
        <BulletItem>Endereço de e-mail (para criação de conta e comunicação)</BulletItem>
        <BulletItem>Foto de perfil (opcional, mas necessária para verificação)</BulletItem>
        <BulletItem>Documento oficial com foto (apenas para o processo de verificação de identidade)</BulletItem>
        <BulletItem>Selfie segurando o documento (apenas para verificação)</BulletItem>
        <BulletItem>Cidade e estado de residência (apenas região aproximada)</BulletItem>
        <BulletItem>Interesses, preferências e modo de presença declarados</BulletItem>
        <BulletItem>Dados de uso da plataforma (conexões, solicitações, interações)</BulletItem>
        <BulletItem>Data e hora de aceite dos Termos de Uso</BulletItem>

        {/* 2 */}
        <SectionTitle>2. Como usamos seus dados</SectionTitle>
        <Paragraph>Seus dados são usados exclusivamente para:</Paragraph>
        <BulletItem>Criar e manter sua conta no ELUS</BulletItem>
        <BulletItem>Verificar sua identidade e garantir a segurança da plataforma</BulletItem>
        <BulletItem>Detectar afinidades contextuais de forma local e privada</BulletItem>
        <BulletItem>Gerenciar conexões, solicitações e aprovações</BulletItem>
        <BulletItem>Enviar notificações relacionadas à sua conta (novas solicitações, aprovações)</BulletItem>
        <BulletItem>Cumprir obrigações legais e proteger direitos de usuários</BulletItem>
        <Paragraph>
          Não usamos seus dados para publicidade direcionada, venda de perfis de comportamento
          ou qualquer finalidade além das listadas acima.
        </Paragraph>

        {/* 3 */}
        <SectionTitle>3. Localização: apenas aproximada, nunca exata</SectionTitle>
        <Paragraph>
          O ELUS nunca coleta nem exibe sua localização exata (GPS) para outros usuários.
          A plataforma utiliza apenas:
        </Paragraph>
        <BulletItem>Cidade e estado declarados por você no perfil</BulletItem>
        <BulletItem>Região aproximada para fins de correspondência de afinidade</BulletItem>
        <Paragraph>
          Nenhum outro usuário, empresa parceira ou serviço terá acesso à sua localização precisa.
          Sua posição exata nunca é armazenada nem transmitida.
        </Paragraph>

        {/* 4 */}
        <SectionTitle>4. Verificação de identidade: como tratamos seus documentos</SectionTitle>
        <Paragraph>
          O processo de verificação de identidade exige o envio de uma selfie com documento.
          Esses dados são tratados com máxima segurança:
        </Paragraph>
        <BulletItem>Armazenados em servidores seguros com criptografia</BulletItem>
        <BulletItem>Acessados apenas pela equipe responsável pela verificação</BulletItem>
        <BulletItem>Usados exclusivamente para confirmar identidade real</BulletItem>
        <BulletItem>Não compartilhados com outros usuários nem com terceiros</BulletItem>
        <BulletItem>Mantidos pelo tempo necessário para fins legais e de segurança</BulletItem>
        <Paragraph>
          Após a verificação, você pode solicitar a exclusão dos documentos enviados,
          desde que isso não comprometa obrigações legais.
        </Paragraph>

        {/* 5 */}
        <SectionTitle>5. Compartilhamento de dados com terceiros</SectionTitle>
        <Paragraph>
          O ELUS não vende, aluga, troca nem monetiza seus dados pessoais com terceiros.
          Seus dados podem ser compartilhados apenas nas seguintes situações:
        </Paragraph>
        <BulletItem>Com prestadores de serviço técnico (hospedagem, banco de dados) sob contrato de confidencialidade</BulletItem>
        <BulletItem>Para cumprimento de ordem judicial ou obrigação legal</BulletItem>
        <BulletItem>Para proteção de direitos do ELUS em caso de fraude ou violação</BulletItem>
        <Paragraph>
          Em nenhum caso seus dados são utilizados para finalidades publicitárias ou comerciais
          por parte do ELUS ou de terceiros.
        </Paragraph>

        {/* 6 */}
        <SectionTitle>6. Seus direitos como titular dos dados (LGPD)</SectionTitle>
        <Paragraph>
          Conforme a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
        </Paragraph>
        <BulletItem>Acesso: saber quais dados temos sobre você</BulletItem>
        <BulletItem>Correção: atualizar dados incompletos, inexatos ou desatualizados</BulletItem>
        <BulletItem>Exclusão: solicitar a remoção dos seus dados pessoais</BulletItem>
        <BulletItem>Portabilidade: receber seus dados em formato estruturado</BulletItem>
        <BulletItem>Revogação de consentimento: retirar consentimentos dados anteriormente</BulletItem>
        <BulletItem>Oposição: se opor a determinados tratamentos de dados</BulletItem>
        <BulletItem>Informação: saber com quem compartilhamos seus dados</BulletItem>
        <Paragraph>
          Para exercer qualquer desses direitos, entre em contato com nosso encarregado de
          dados pelo e-mail: privacidade@elus.com.br
        </Paragraph>

        {/* 7 */}
        <SectionTitle>7. Segurança dos dados</SectionTitle>
        <Paragraph>
          Adotamos medidas técnicas e organizacionais para proteger seus dados:
        </Paragraph>
        <BulletItem>Criptografia de dados em trânsito (TLS/SSL) e em repouso</BulletItem>
        <BulletItem>Acesso restrito aos dados por funcionários autorizados</BulletItem>
        <BulletItem>Monitoramento de acessos e tentativas de violação</BulletItem>
        <BulletItem>Autenticação segura via Supabase Auth</BulletItem>
        <BulletItem>Políticas de controle de acesso por perfil (Row Level Security)</BulletItem>
        <Paragraph>
          Em caso de incidente de segurança que afete seus dados, você será notificado
          conforme previsto na LGPD.
        </Paragraph>

        {/* 8 */}
        <SectionTitle>8. Cookies e armazenamento local</SectionTitle>
        <Paragraph>
          O ELUS utiliza armazenamento local no seu dispositivo (AsyncStorage) para:
        </Paragraph>
        <BulletItem>Manter sua sessão ativa sem necessidade de login repetido</BulletItem>
        <BulletItem>Salvar preferências de uso e configurações do perfil</BulletItem>
        <Paragraph>
          Não utilizamos cookies de rastreamento publicitário. O armazenamento local é usado
          exclusivamente para melhorar sua experiência na plataforma.
        </Paragraph>

        {/* 9 */}
        <SectionTitle>9. Retenção de dados</SectionTitle>
        <Paragraph>
          Mantemos seus dados pelo tempo necessário para:
        </Paragraph>
        <BulletItem>Prestar os serviços do ELUS enquanto sua conta estiver ativa</BulletItem>
        <BulletItem>Cumprir obrigações legais e regulatórias</BulletItem>
        <BulletItem>Resolver disputas e fazer cumprir acordos</BulletItem>
        <Paragraph>
          Ao solicitar a exclusão da conta, seus dados pessoais serão removidos no prazo de
          30 dias, salvo obrigações legais que exijam retenção por período maior.
        </Paragraph>

        {/* 10 */}
        <SectionTitle>10. Contato do Encarregado de Dados (DPO)</SectionTitle>
        <Paragraph>
          Para exercer seus direitos ou tirar dúvidas sobre esta Política de Privacidade,
          entre em contato com nosso Encarregado de Dados:
        </Paragraph>
        <BulletItem>E-mail: privacidade@elus.com.br</BulletItem>
        <BulletItem>Suporte geral: suporte@elus.com.br</BulletItem>
        <Paragraph>
          Respondemos solicitações relacionadas à privacidade em até 15 dias úteis.
        </Paragraph>

        {/* 11 */}
        <SectionTitle>11. Alterações nesta Política</SectionTitle>
        <Paragraph>
          Esta Política de Privacidade pode ser atualizada periodicamente. Mudanças relevantes
          serão comunicadas por notificação no aplicativo ou por e-mail. O uso contínuo do ELUS
          após a notificação implica aceitação da política atualizada.
        </Paragraph>

        <View style={styles.divider} />

        <Text style={styles.vigencia}>
          Esta Política de Privacidade entra em vigor em junho de 2026.{'\n'}
          ELUS · Em conformidade com a LGPD (Lei nº 13.709/2018).
        </Text>

        <Pressable
          style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.acceptButtonText}>Li e entendi ✓</Text>
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
    backgroundColor: 'rgba(34,197,94,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.28)',
    marginBottom: 18,
  },
  heroBadgeText: { color: COLORS.green, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
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
    borderLeftColor: COLORS.green,
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
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.green,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  acceptButtonText: { color: '#06070B', fontSize: 18, fontWeight: '900' },
  bottomSpace: { height: 40 },
  pressed: { opacity: 0.75 },
});
