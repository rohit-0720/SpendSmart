import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Modal } from 'react-native';
import { useApp } from '../components/AppContext';

const categories = [
  { name: 'Food & Dining',  emoji: '🍔', color: '#F59E0B' },
  { name: 'Transport',      emoji: '🚌', color: '#6C63FF' },
  { name: 'Shopping',       emoji: '🛍', color: '#10B981' },
  { name: 'Rent & Bills',   emoji: '💡', color: '#3ECFCF' },
  { name: 'Entertainment',  emoji: '🎬', color: '#EC4899' },
  { name: 'Health',         emoji: '💊', color: '#EF4444' },
];

const emojiMap = {
  'Food & Dining': '🍔', 'Transport': '🚌', 'Shopping': '🛍',
  'Rent & Bills': '💡', 'Entertainment': '🎬', 'Health': '💊',
};

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getDaysInMonth = (month, year) => {
  const m = parseInt(month);
  const y = parseInt(year);
  return new Date(y, m + 1, 0).getDate();
};

const formatDate = (day, month, year) => {
  const today = new Date();
  const selected = new Date(year, month, day);
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (selected.toDateString() === today.toDateString()) return 'Today';
  if (selected.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return `${day} ${months[month]} ${year}`;
};

export default function AddExpenseScreen() {
  const today = new Date();
  const [amount, setAmount]               = useState('');
  const [description, setDescription]     = useState('');
  const [selectedCat, setSelectedCat]     = useState('Food & Dining');
  const [notes, setNotes]                 = useState('');
  const [success, setSuccess]             = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [day, setDay]       = useState(today.getDate());
  const [month, setMonth]   = useState(today.getMonth());
  const [year, setYear]     = useState(today.getFullYear());
  const [tempDay, setTempDay]     = useState(today.getDate());
  const [tempMonth, setTempMonth] = useState(today.getMonth());
  const [tempYear, setTempYear]   = useState(today.getFullYear());

  const { addExpense } = useApp();

  const years = [today.getFullYear(), today.getFullYear() - 1];
  const totalDays = getDaysInMonth(tempMonth, tempYear);
  const daysList = Array.from({ length: totalDays }, (_, i) => i + 1);

  const handleAdd = () => {
    if (!amount || !description) {
      Alert.alert('Missing info', 'Please enter an amount and description.');
      return;
    }
    const fullDate = new Date(year, month, day).toISOString();
    addExpense({
      name: description,
      category: selectedCat,
      amount: parseFloat(amount),
      emoji: emojiMap[selectedCat],
      date: formatDate(day, month, year),
      fullDate,
    });
    setSuccess(true);
    setAmount('');
    setDescription('');
    setNotes('');
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

  return (
    <ScrollView style={styles.container}>

      {success && (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>✓ Expense added successfully!</Text>
        </View>
      )}

      <View style={styles.card}>

        {/* Amount */}
        <Text style={styles.label}>Amount (₹)</Text>
        <TextInput
          style={styles.input}
          placeholder="0.00"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          placeholder="What did you spend on?"
          value={description}
          onChangeText={setDescription}
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.chipGrid}>
          {categories.map((cat) => {
            const isSelected = selectedCat === cat.name;
            return (
              <TouchableOpacity
                key={cat.name}
                style={[styles.chip, isSelected && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setSelectedCat(cat.name)}
              >
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                <Text style={[styles.chipText, isSelected && { color: '#fff' }]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Date Picker */}
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.datePicker} onPress={openDateModal}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={styles.dateText}>{formatDate(day, month, year)}</Text>
          <Text style={styles.dateChevron}>›</Text>
        </TouchableOpacity>

        {/* Notes */}
        <Text style={styles.label}>Notes (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Any extra details..."
          value={notes}
          onChangeText={setNotes}
        />

        {/* Submit */}
        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>+ Add Expense</Text>
        </TouchableOpacity>

      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Category</Text>
            <Text style={styles.summaryValue}>
              {categories.find(c => c.name === selectedCat)?.emoji} {selectedCat}
            </Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{formatDate(day, month, year)}</Text>
          </View>
        </View>
      </View>

      {/* Date Modal */}
      <Modal visible={showDateModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Select Date</Text>

            {/* Day picker */}
            <Text style={styles.pickerLabel}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {daysList.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pickerItem, tempDay === d && styles.pickerItemActive]}
                  onPress={() => setTempDay(d)}
                >
                  <Text style={[styles.pickerText, tempDay === d && styles.pickerTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Month picker */}
            <Text style={styles.pickerLabel}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {months.map((m, i) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pickerItem, tempMonth === i && styles.pickerItemActive]}
                  onPress={() => setTempMonth(i)}
                >
                  <Text style={[styles.pickerText, tempMonth === i && styles.pickerTextActive]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Year picker */}
            <Text style={styles.pickerLabel}>Year</Text>
            <View style={styles.pickerRow}>
              {years.map(y => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pickerItem, tempYear === y && styles.pickerItemActive]}
                  onPress={() => setTempYear(y)}
                >
                  <Text style={[styles.pickerText, tempYear === y && styles.pickerTextActive]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Buttons */}
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
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  successBanner:    { backgroundColor: '#D1FAE5', margin: 16, borderRadius: 10, padding: 12 },
  successText:      { color: '#065F46', fontSize: 14, fontWeight: '600' },
  card:             { backgroundColor: '#fff', margin: 16, borderRadius: 16, padding: 16 },
  label:            { fontSize: 13, color: '#888', marginBottom: 6, marginTop: 14 },
  input:            { borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#FAFAFA' },
  chipGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:             { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, borderWidth: 0.5, borderColor: '#ddd', backgroundColor: '#F9F9F9' },
  chipEmoji:        { fontSize: 14 },
  chipText:         { fontSize: 13, color: '#555' },
  datePicker:       { flexDirection: 'row', alignItems: 'center', borderWidth: 0.5, borderColor: '#ddd', borderRadius: 10, padding: 12, backgroundColor: '#FAFAFA', gap: 10 },
  dateIcon:         { fontSize: 18 },
  dateText:         { flex: 1, fontSize: 15, color: '#333' },
  dateChevron:      { fontSize: 20, color: '#aaa' },
  button:           { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  buttonText:       { color: '#fff', fontSize: 16, fontWeight: '600' },
  summaryCard:      { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 14, padding: 16 },
  summaryRow:       { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel:     { fontSize: 13, color: '#888', marginBottom: 4 },
  summaryValue:     { fontSize: 15, fontWeight: '600', color: '#1a1a2e' },
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:         { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle:       { fontSize: 18, fontWeight: '700', color: '#1a1a2e', marginBottom: 16, textAlign: 'center' },
  pickerLabel:      { fontSize: 12, color: '#888', marginBottom: 8, marginTop: 12 },
  pickerRow:        { flexDirection: 'row', marginBottom: 4 },
  pickerItem:       { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, borderWidth: 0.5, borderColor: '#ddd', marginRight: 8, backgroundColor: '#F9F9F9' },
  pickerItemActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  pickerText:       { fontSize: 14, color: '#555' },
  pickerTextActive: { color: '#fff', fontWeight: '600' },
  modalBtns:        { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn:        { flex: 1, padding: 14, borderRadius: 12, borderWidth: 0.5, borderColor: '#ddd', alignItems: 'center' },
  cancelText:       { fontSize: 15, color: '#555' },
  confirmBtn:       { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6C63FF', alignItems: 'center' },
  confirmText:      { fontSize: 15, color: '#fff', fontWeight: '600' },
});