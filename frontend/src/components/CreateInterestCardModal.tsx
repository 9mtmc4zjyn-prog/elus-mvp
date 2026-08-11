import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useThemeColors } from '../theme/ThemeContext';
import {
  INTEREST_CARD_CATEGORIES,
  INTEREST_CARD_DESCRIPTION_MAX_LENGTH,
  INTEREST_CARD_TYPES,
  type InterestCardCategory,
  type InterestCardType,
} from '../utils/interestCardRules';
import {
  INTEREST_CARD_CATEGORY_LABELS,
  INTEREST_CARD_TYPE_META,
  getInterestCardAccent,
} from '../utils/interestCardLabels';
import { createInterestCard } from '../utils/interestCardsApi';

type Props = {
  visible: boolean;
  userId: string;
  onClose: () => void;
  onCreated: () => void;
};

export function CreateInterestCardModal({
  visible,
  userId,
  onClose,
  onCreated,
}: Props) {
  const colors = useThemeColors();
  const [type, setType] = useState<InterestCardType>('procuro');
  const [category, setCategory] = useState<InterestCardCategory | null>(null);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const accent = useMemo(
    () => getInterestCardAccent(type, colors),
    [type, colors],
  );
  const typeMeta = INTEREST_CARD_TYPE_META[type];

  function resetForm() {
    setType('procuro');
    setCategory(null);
    setDescription('');
  }

  function handleClose() {
    if (saving) return;
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!category) {
      Alert.alert('Categoria', 'Escolha uma categoria para o card.');
      return;
    }

    const trimmed = description.trim();
    if (trimmed.length > INTEREST_CARD_DESCRIPTION_MAX_LENGTH) {
      Alert.alert(
        'Descrição',
        `A descrição pode ter no máximo ${INTEREST_CARD_DESCRIPTION_MAX_LENGTH} caracteres.`,
      );
      return;
    }

    setSaving(true);
    const { error } = await createInterestCard({
      userId,
      type,
      category,
      description: trimmed,
    });
    setSaving(false);

    if (error) {
      Alert.alert('Não foi possível criar', error);
      return;
    }

    resetForm();
    onCreated();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.borderStrong },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.kicker, { color: accent }]}>Novo card</Text>
            <Text style={[styles.title, { color: colors.text }]}>
              Status de interesse
            </Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              Ativo por 24 horas
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              Tipo
            </Text>
            <View style={styles.typeRow}>
              {INTEREST_CARD_TYPES.map((option) => {
                const meta = INTEREST_CARD_TYPE_META[option];
                const optionAccent = getInterestCardAccent(option, colors);
                const selected = type === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setType(option)}
                    style={[
                      styles.typeChip,
                      {
                        borderColor: selected
                          ? optionAccent
                          : colors.border,
                        backgroundColor: selected
                          ? `${optionAccent}22`
                          : colors.surfaceElevated,
                      },
                    ]}
                  >
                    <Text style={styles.typeEmoji}>{meta.emoji}</Text>
                    <Text
                      style={[
                        styles.typeLabel,
                        { color: selected ? optionAccent : colors.text },
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View
              style={[
                styles.preview,
                {
                  borderColor: `${accent}55`,
                  backgroundColor: `${accent}14`,
                },
              ]}
            >
              <Text style={styles.previewEmoji}>{typeMeta.emoji}</Text>
              <Text style={[styles.previewText, { color: colors.text }]}>
                Preview · {typeMeta.label}
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              Categoria
            </Text>
            <View style={styles.categoryWrap}>
              {INTEREST_CARD_CATEGORIES.map((option) => {
                const selected = category === option;
                return (
                  <Pressable
                    key={option}
                    onPress={() => setCategory(option)}
                    style={[
                      styles.categoryChip,
                      {
                        borderColor: selected ? accent : colors.border,
                        backgroundColor: selected
                          ? `${accent}22`
                          : colors.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryLabel,
                        { color: selected ? accent : colors.textMuted },
                      ]}
                    >
                      {INTEREST_CARD_CATEGORY_LABELS[option]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              Descrição (opcional)
            </Text>
            <TextInput
              value={description}
              onChangeText={(text) =>
                setDescription(
                  text.slice(0, INTEREST_CARD_DESCRIPTION_MAX_LENGTH),
                )
              }
              placeholder="Ex.: busco indicação de vaga remota"
              placeholderTextColor={colors.textSoft}
              multiline
              maxLength={INTEREST_CARD_DESCRIPTION_MAX_LENGTH}
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
            />
            <Text style={[styles.counter, { color: colors.textSoft }]}>
              {description.length}/{INTEREST_CARD_DESCRIPTION_MAX_LENGTH}
            </Text>

            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                disabled={saving}
                style={[
                  styles.secondaryBtn,
                  { borderColor: colors.borderStrong },
                ]}
              >
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={saving}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: accent, opacity: saving ? 0.7 : 1 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: colors.text }]}>
                    Publicar card
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingBottom: 24,
  },
  sheetContent: {
    padding: 20,
    gap: 10,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  typeEmoji: {
    fontSize: 22,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  previewEmoji: {
    fontSize: 20,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryBtn: {
    flex: 1.2,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
