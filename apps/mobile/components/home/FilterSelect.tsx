import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

type FilterSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  const { text } = useLanguage();
  const [open, setOpen] = useState(false);

  const selectOption = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        accessibilityHint={text(`打开${label}选项`, `Open ${label} options`)}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <Text numberOfLines={1} style={styles.value}>{value}</Text>
          <Text style={styles.chevron}>⌄</Text>
        </View>
      </Pressable>

      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.modalRoot}>
          <Pressable accessibilityLabel={text(`关闭${label}选项`, `Close ${label} options`)} onPress={() => setOpen(false)} style={styles.backdrop} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{text(`选择${label}`, `Choose ${label}`)}</Text>
              <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.closeButton}>
                <Text style={styles.closeText}>{text('关闭', 'Close')}</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.optionList}>
              {options.map((option) => {
                const selected = option === value;

                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option}
                    onPress={() => selectOption(option)}
                    style={({ pressed }) => [
                      styles.option,
                      selected && styles.optionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                    {selected && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DFE5DE',
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 67,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  label: { color: '#7A8981', fontSize: 11, fontWeight: '600' },
  valueRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  value: { color: '#263D34', flex: 1, fontSize: 14, fontWeight: '700' },
  chevron: { color: '#61736A', fontSize: 18, marginLeft: 6 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    backgroundColor: 'rgba(16, 28, 23, 0.36)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '68%',
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: '#D3DAD5',
    borderRadius: 2,
    height: 4,
    marginTop: 10,
    width: 42,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 62,
  },
  sheetTitle: { color: '#1F382F', fontSize: 19, fontWeight: '700' },
  closeButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, paddingHorizontal: 6 },
  closeText: { color: '#356854', fontSize: 14, fontWeight: '700' },
  optionList: { gap: 8, paddingBottom: 8 },
  option: {
    alignItems: 'center',
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 50,
    paddingHorizontal: 14,
  },
  optionSelected: { backgroundColor: '#EDF4EA' },
  optionText: { color: '#41564D', fontSize: 15 },
  optionTextSelected: { color: '#28523F', fontWeight: '700' },
  check: { color: '#28523F', fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
