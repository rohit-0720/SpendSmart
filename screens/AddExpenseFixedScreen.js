import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
} from 'react-native';
import { useApp } from '../components/AppState';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

export default function AddExpenseFixedScreen() {
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

  const categories = useMemo(() => {
    if (!hasSavedBudget) return [];
    return Array.isArray(budgets) ? budgets : [];
  }, [budgets, hasSavedBudget]);

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

  const handleAdd = () => {
    const hasAmountValidationError = !amount;
    const hasDescValidationError = !description;

    setAmountError(hasAmountValidationError);
    setDescError(hasDescValidationError);

    if (hasAmountValidationError || hasDescValidationError || !hasSavedBudget || !selectedCat) {
      return;
    }

    const category = categories.find((item) => item.name === selectedCat);
    const fullDate = new Date(year, month, day, 12, 0, 0).toISOString();

    addExpense({
      name: description,
      category: selectedCat,
      amount: parseFloat(amount),
      emoji: category?.emoji || '❓',
      date: formatDate(day, month, year),
      fullDate,
    });

    setSuccess(true);
    setAmount('');
    setDescription('');
    setAmountError(false);
    setDescError(false);
    setTimeout(() => setSuccess(false), 3000);
  };

  const openDateModal = () => {
    setTempDay(day);
    setTempMonth(month);
    setTempYear(year);
    setShowDateModal(true);
  };

  const confirmDate = () => {
    const maxDay = getDaysInMonth(tempMonth, tempYear);
    setDay(Math.min(tempDay, maxDay));
    setMonth(tempMonth);
    setYear(tempYear);
    setShowDateModal(false);
  };

  const selectedCatObj = categories.find((item) => item.name === selectedCat);

  return (
    <ScrollView style={styles.container}>
      {success && (
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✓</Text>
          <View>
            <Text style={styles.successTitle}>Expense added!</Text>
            <Text style={styles.successSub}>Your spending has been recorded.</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>
          Amount (₹) <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, amountError && styles.inputError]}
          placeholder="0.00"
          keyboardType="numeric"
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setAmountError(false);
          }}
        />
        {amountError && <Text style={styles.errorText}>Amount is required</Text>}

        <Text style={styles.label}>
          Description <Text style={styles.required}>*</Text>
        </Text>
        <TextInput
          style={[styles.input, descError && styles.inputError]}
          placeholder="What did you spend on?"
          value={description}
          onChangeText={(value) => {
            setDescription(value);
            setDescError(false);
          }}
        />
        {descError && <Text style={styles.errorText}>Description is required</Text>}

        <Text style={styles.label}>Category</Text>
        {hasSavedBudget ? (
          <View style={styles.chipGrid}>
            {categories.map((cat) => {
              const isSelected = selectedCat === cat.name;
              return (
                <TouchableOpacity
                  key={cat.name}
                  style={[
                    styles.chip,
                    isSelected && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setSelectedCat(cat.name)}
                >
                  <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.chipText, isSelected && { color: '#fff' }]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Save your budget first to unlock expense categories.</Text>
          </View>
        )}

        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.datePicker} onPress={openDateModal}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formatDate(day, month, year)}</Text>
          <Text style={styles.dateChevron}>›</Text>
        </TouchableOpacity>

        <Text style={styles.mandatoryNote}>
          <Text style={styles.required}>*</Text> Required fields
        </Text>

        <TouchableOpacity
          style={[styles.button, !hasSavedBudget && styles.buttonDisabled]}
          onPress={handleAdd}
          disabled={!hasSavedBudget}
        >
          <Text style={styles.buttonText}>+ Add Expense</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Category</Text>
            <Text style={styles.summaryValue}>
              {hasSavedBudget ? `${selectedCatObj?.emoji || '❓'} ${selectedCat}` : 'Set up budget first'}
            </Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{formatDate(day, month, year)}</Text>
          </View>
        </View>
      </View>

      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Date</Text>

            <Text style={styles.pickerLabel}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {daysList.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerItem, tempDay === item && styles.pickerItemActive]}
                  onPress={() => setTempDay(item)}
                >
                  <Text style={[styles.pickerText, tempDay === item && styles.pickerTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerLabel}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {months.map((item, index) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerItem, tempMonth === index && styles.pickerItemActive]}
                  onPress={() => setTempMonth(index)}
                >
                  <Text style={[styles.pickerText, tempMonth === index && styles.pickerTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.pickerLabel}>Year</Text>
            <View style={styles.pickerRow}>
              {years.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerItem, tempYear === item && styles.pickerItemActive]}
                  onPress={() => setTempYear(item)}
                >
                  <Text style={[styles.pickerText, tempYear === item && styles.pickerTextActive]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowDateModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmDate}>
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a1a2e', margin: 16, borderRadius: 14, padding: 16 },
  successIcon: { fontSize: 24, color: '#10B981' },
  successTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  successSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  card: { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16 },
  label: { fontSize: 13, color: '#888', marginBottom: 6, marginTop: 14 },
  required: { color: '#EF4444', fontWeight: '700' },
  input: { borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FAFAFA' },
  inputError: { borderColor: '#EF4444', borderWidth: 1, backgroundColor: '#FFF5F5' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4 },
  mandatoryNote: { fontSize: 12, color: '#aaa', marginTop: 16, marginBottom: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 0.5, borderColor: '#ddd', backgroundColor: '#F9F9F9' },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, color: '#555' },
  infoBox: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, backgroundColor: '#F9FAFB' },
  infoText: { color: '#6B7280', fontSize: 13 },
  datePicker: { flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 12, backgroundColor: '#FAFAFA', gap: 10 },
  dateIcon: { fontSize: 18 },
  dateText: { flex: 1, fontSize: 15, color: '#333' },
  dateChevron: { fontSize: 20, color: '#aaa' },
  button: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonDisabled: { backgroundColor: '#A5B4FC' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  summaryCard: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, color: '#888', marginBottom: 4 },
  summaryValue: { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16, textAlign: 'center' },
  pickerLabel: { fontSize: 12, color: '#888', marginBottom: 8, marginTop: 12 },
  pickerRow: { flexDirection: 'row', marginBottom: 4 },
  pickerItem: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 0.5, borderColor: '#ddd', marginRight: 8, backgroundColor: '#F9F9F9' },
  pickerItemActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  pickerText: { fontSize: 14, color: '#555' },
  pickerTextActive: { color: '#fff', fontWeight: '600' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: '#ddd', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#555' },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6C63FF', alignItems: 'center' },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
