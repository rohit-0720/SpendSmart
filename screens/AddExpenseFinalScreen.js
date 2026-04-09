import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../components/AppStateClean';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BOTTOM_INSET = 126;

const getDaysInMonth = (month, year) => new Date(parseInt(year, 10), parseInt(month, 10) + 1, 0).getDate();

const formatDate = (day, month, year) => {
  const today = new Date();
  const selected = new Date(year, month, day);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (selected.toDateString() === today.toDateString()) return 'Today';
  if (selected.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return `${day} ${months[month]} ${year}`;
};

const getPalette = (theme) => ({
  background: theme?.background || '#F4F7FB',
  surface: theme?.surface || '#FFFFFF',
  surfaceElevated: theme?.surfaceElevated || '#F8FAFF',
  text: theme?.text || '#111827',
  textMuted: theme?.textMuted || '#667085',
  border: theme?.border || '#D7DEEA',
  accent: theme?.accent || '#5B6CFF',
  accentSoft: theme?.accentSoft || '#7C8CFF',
  danger: theme?.danger || '#EF4444',
  success: theme?.success || '#16A34A',
  input: theme?.input || '#F8FAFC',
  chip: theme?.chip || '#F2F5FB',
  isDark: theme?.key === 'dark',
});

export default function AddExpenseFinalScreen({ theme }) {
  const colors = getPalette(theme);
  const today = new Date();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [success, setSuccess] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [descError, setDescError] = useState(false);
  const [day, setDay] = useState(today.getDate());
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [tempDay, setTempDay] = useState(today.getDate());
  const [tempMonth, setTempMonth] = useState(today.getMonth());
  const [tempYear, setTempYear] = useState(today.getFullYear());
  const { addExpense, budgets, hasSavedBudget } = useApp();

  const categories = useMemo(() => (hasSavedBudget && Array.isArray(budgets) ? budgets : []), [budgets, hasSavedBudget]);
  const [selectedCat, setSelectedCat] = useState('');

  useEffect(() => {
    if (!hasSavedBudget) {
      setSelectedCat('');
      return;
    }
    if (!selectedCat && categories.length > 0) {
      setSelectedCat(categories[0].name);
    }
  }, [categories, hasSavedBudget, selectedCat]);

  const years = [today.getFullYear(), today.getFullYear() - 1];
  const totalDays = getDaysInMonth(tempMonth, tempYear);
  const daysList = Array.from({ length: totalDays }, (_, index) => index + 1);
  const selectedCatObj = categories.find((item) => item.name === selectedCat);

  const handleAdd = () => {
    const hasAmountValidationError = !amount;
    const hasDescValidationError = !description;
    setAmountError(hasAmountValidationError);
    setDescError(hasDescValidationError);

    if (hasAmountValidationError || hasDescValidationError || !hasSavedBudget || !selectedCat) {
      return;
    }

    addExpense({
      name: description,
      category: selectedCat,
      amount: parseFloat(amount),
      emoji: selectedCatObj?.emoji || '\u2753',
      icon: selectedCatObj?.icon || 'pricetag-outline',
      date: formatDate(day, month, year),
      fullDate: new Date(year, month, day, 12, 0, 0).toISOString(),
    });

    setSuccess(true);
    setAmount('');
    setDescription('');
    setAmountError(false);
    setDescError(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingBottom: BOTTOM_INSET }}>
      {success && (
        <View style={[styles.successBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          <View>
            <Text style={[styles.successTitle, { color: colors.text }]}>Expense added!</Text>
            <Text style={[styles.successSub, { color: colors.textMuted }]}>Your spending has been recorded.</Text>
          </View>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <Text style={[styles.label, { color: colors.textMuted }]}>{`Amount (\u20B9) `}<Text style={{ color: colors.danger }}>*</Text></Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }, amountError && { borderColor: colors.danger, backgroundColor: colors.surfaceElevated }]}
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          keyboardType="numeric"
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setAmountError(false);
          }}
        />
        {amountError && <Text style={[styles.errorText, { color: colors.danger }]}>Amount is required</Text>}

        <Text style={[styles.label, { color: colors.textMuted }]}>Description <Text style={{ color: colors.danger }}>*</Text></Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.text }, descError && { borderColor: colors.danger, backgroundColor: colors.surfaceElevated }]}
          placeholder="What did you spend on?"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            setDescError(false);
          }}
        />
        {descError && <Text style={[styles.errorText, { color: colors.danger }]}>Description is required</Text>}

        <Text style={[styles.label, { color: colors.textMuted }]}>Category</Text>
        {hasSavedBudget ? (
          <View style={styles.chipGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCat === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.chip,
                    { backgroundColor: colors.chip, borderColor: colors.border },
                    isSelected && { backgroundColor: cat.color, borderColor: cat.color },
                  ]}
                  onPress={() => setSelectedCat(cat.name)}
                >
                  <Ionicons
                    name={cat.icon || 'pricetag-outline'}
                    size={15}
                    color={isSelected ? '#fff' : cat.color || colors.text}
                  />
                  <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.text }]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={[styles.infoBox, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}> 
            <Text style={[styles.infoText, { color: colors.textMuted }]}>Save your budget first to unlock expense categories.</Text>
          </View>
        )}

        <Text style={[styles.label, { color: colors.textMuted }]}>Date</Text>
        <TouchableOpacity
          style={[styles.datePicker, { backgroundColor: colors.input, borderColor: colors.border }]}
          onPress={() => {
            setTempDay(day);
            setTempMonth(month);
            setTempYear(year);
            setShowDateModal(true);
          }}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.text} />
          <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(day, month, year)}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <Text style={[styles.mandatoryNote, { color: colors.textMuted }]}><Text style={{ color: colors.danger }}>*</Text> Required fields</Text>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: hasSavedBudget ? colors.accent : colors.accentSoft,
              borderWidth: colors.isDark ? 1 : 0,
              borderColor: colors.isDark ? colors.border : 'transparent',
            },
          ]}
          onPress={handleAdd}
          disabled={!hasSavedBudget}
        >
          <Text style={[styles.buttonText, { color: colors.isDark ? '#111111' : '#fff' }]}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={styles.summaryRow}>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Category</Text>
            <View style={styles.summaryCategoryRow}>
              {hasSavedBudget ? (
                <Ionicons
                  name={selectedCatObj?.icon || 'pricetag-outline'}
                  size={16}
                  color={selectedCatObj?.color || colors.accent}
                />
              ) : null}
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                {hasSavedBudget ? selectedCat : 'Set up budget first'}
              </Text>
            </View>
          </View>
          <View>
            <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Date</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{formatDate(day, month, year)}</Text>
          </View>
        </View>
      </View>

      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface }]}> 
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Date</Text>

            <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {daysList.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerItem, { backgroundColor: colors.chip, borderColor: colors.border }, tempDay === item && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => setTempDay(item)}
                >
                  <Text style={[styles.pickerText, { color: tempDay === item ? '#fff' : colors.text }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {months.map((item, index) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerItem, { backgroundColor: colors.chip, borderColor: colors.border }, tempMonth === index && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => setTempMonth(index)}
                >
                  <Text style={[styles.pickerText, { color: tempMonth === index ? '#fff' : colors.text }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.pickerLabel, { color: colors.textMuted }]}>Year</Text>
            <View style={styles.pickerRow}>
              {years.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerItem, { backgroundColor: colors.chip, borderColor: colors.border }, tempYear === item && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => setTempYear(item)}
                >
                  <Text style={[styles.pickerText, { color: tempYear === item ? '#fff' : colors.text }]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border, backgroundColor: colors.chip }]} onPress={() => setShowDateModal(false)}>
                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmBtn,
                  {
                    backgroundColor: colors.accent,
                    borderWidth: colors.isDark ? 1 : 0,
                    borderColor: colors.isDark ? colors.border : 'transparent',
                  },
                ]}
                onPress={() => {
                  const maxDay = getDaysInMonth(tempMonth, tempYear);
                  setDay(Math.min(tempDay, maxDay));
                  setMonth(tempMonth);
                  setYear(tempYear);
                  setShowDateModal(false);
                }}
              >
                <Text style={[styles.confirmText, { color: colors.isDark ? '#111111' : '#fff' }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, borderRadius: 18, padding: 16, borderWidth: 1 },
  successTitle: { fontSize: 15, fontWeight: '700' },
  successSub: { fontSize: 12, marginTop: 2 },
  card: { margin: 16, borderRadius: 22, padding: 16, borderWidth: 1 },
  label: { fontSize: 13, marginBottom: 6, marginTop: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15 },
  errorText: { fontSize: 12, marginTop: 4 },
  mandatoryNote: { fontSize: 12, marginTop: 16, marginBottom: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },
  infoBox: { borderWidth: 1, borderRadius: 14, padding: 14 },
  infoText: { fontSize: 13 },
  datePicker: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  dateText: { flex: 1, fontSize: 15, fontWeight: '600' },
  button: { borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  summaryCard: { marginHorizontal: 16, borderRadius: 20, padding: 16, borderWidth: 1 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCategoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryLabel: { fontSize: 13, marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  pickerLabel: { fontSize: 12, marginBottom: 8, marginTop: 12, fontWeight: '600' },
  pickerRow: { flexDirection: 'row', marginBottom: 4 },
  pickerItem: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  pickerText: { fontSize: 14, fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 14, alignItems: 'center' },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});
