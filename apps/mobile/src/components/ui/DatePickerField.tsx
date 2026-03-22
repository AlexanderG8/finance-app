import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  optional?: boolean;
}

function parseLocalDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year!, month! - 1, day!);
}

function toLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return 'Seleccionar fecha';
  const [year, month, day] = dateStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const monthName = months[parseInt(month!, 10) - 1];
  return `${parseInt(day!, 10)} ${monthName} ${year}`;
}

export function DatePickerField({ label, value, onChange, optional }: DatePickerFieldProps) {
  const [show, setShow] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(parseLocalDate(value));

  const currentDate = value ? parseLocalDate(value) : new Date();

  // Android: picker is a dialog, appears and closes itself
  function handleAndroidChange(event: DateTimePickerEvent, selected?: Date) {
    setShow(false);
    if (event.type === 'set' && selected) {
      onChange(toLocalISO(selected));
    }
  }

  // iOS: picker is inline inside a modal
  function handleIOSChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setTempDate(selected);
  }

  function handleIOSConfirm() {
    onChange(toLocalISO(tempDate));
    setShow(false);
  }

  function handleOpen() {
    setTempDate(currentDate);
    setShow(true);
  }

  return (
    <View className="mb-4">
      <Text className="text-xs text-slate-500 mb-1 font-medium">
        {label}{optional ? ' (OPCIONAL)' : ''}
      </Text>

      <TouchableOpacity
        onPress={handleOpen}
        className="bg-white rounded-xl px-4 py-3 border border-slate-100 flex-row justify-between items-center"
      >
        <Text
          className="text-sm"
          style={{ color: value ? '#1e293b' : '#94a3b8' }}
        >
          {value ? formatDisplay(value) : 'Seleccionar fecha'}
        </Text>
        <Text className="text-slate-400 text-sm">📅</Text>
      </TouchableOpacity>

      {/* Android: render directamente cuando show=true */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display="default"
          onChange={handleAndroidChange}
        />
      )}

      {/* iOS: modal con picker inline + botones */}
      {Platform.OS === 'ios' && (
        <Modal
          visible={show}
          transparent
          animationType="slide"
          onRequestClose={() => setShow(false)}
        >
          <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            <View className="bg-white rounded-t-3xl">
              <View className="flex-row justify-between items-center px-5 pt-4 pb-2 border-b border-slate-100">
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text className="text-accent text-sm">Cancelar</Text>
                </TouchableOpacity>
                <Text className="text-sm font-semibold text-primary">{label}</Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text className="text-sm font-semibold" style={{ color: Colors.primary }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display="spinner"
                onChange={handleIOSChange}
                style={{ height: 200 }}
                locale="es-PE"
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
