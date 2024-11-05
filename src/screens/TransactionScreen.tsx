// src/screens/TransactionScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { TextInput, Button, Appbar, RadioButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import uuid from 'react-native-uuid';

export default function TransactionScreen() {
  const route = useRoute();
  const { transaction } = route.params || {};
  const [amount, setAmount] = useState(transaction ? Math.abs(transaction.amount).toString() : '');
  const [category, setCategory] = useState(transaction ? transaction.category : '');
  const [date, setDate] = useState(transaction ? new Date(transaction.date) : new Date());
  const [type, setType] = useState(transaction ? (transaction.amount >= 0 ? 'income' : 'expense') : 'income');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const navigation = useNavigation();

  const saveTransaction = async () => {
    if (!amount || !category) {
      Alert.alert('Erro', 'Todos os campos são obrigatórios!');
      return;
    }

    const numericAmount = parseFloat(amount);
    const finalAmount = type === 'income' ? numericAmount : -numericAmount;

    const newTransaction = {
      id: transaction ? transaction.id : uuid.v4().toString(),
      amount: finalAmount,
      category,
      date: date.toISOString().split('T')[0], // Salvando apenas a data no formato "YYYY-MM-DD"
    };

    try {
      const storedData = await AsyncStorage.getItem('@transactions');
      const transactions = storedData ? JSON.parse(storedData) : [];

      let updatedTransactions;
      if (transaction) {
        // Editar transação existente
        updatedTransactions = transactions.map((t) =>
          t.id === transaction.id ? newTransaction : t
        );
      } else {
        // Nova transação
        updatedTransactions = [...transactions, newTransaction];
      }

      await AsyncStorage.setItem('@transactions', JSON.stringify(updatedTransactions));
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar a transação:', error);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      // Garantir que o horário seja 00:00:00 para evitar mudança de dia
      selectedDate.setHours(0, 0, 0, 0);
      setDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={transaction ? 'Editar Lançamento' : 'Novo Lançamento'} />
      </Appbar.Header>

      <RadioButton.Group onValueChange={setType} value={type}>
        <View style={styles.radioContainer}>
          <RadioButton.Item label="Receita" value="income" />
          <RadioButton.Item label="Despesa" value="expense" />
        </View>
      </RadioButton.Group>

      <TextInput
        label="Valor"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={styles.input}
      />
      <TextInput
        label="Categoria"
        value={category}
        onChangeText={setCategory}
        style={styles.input}
      />

      <Button onPress={() => setShowDatePicker(true)} mode="outlined" style={styles.input}>
        Selecionar Data: {date.toISOString().split('T')[0]}
      </Button>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
          onChange={onChangeDate}
        />
      )}

      <Button mode="contained" onPress={saveTransaction} style={styles.button}>
        {transaction ? 'Salvar Alterações' : 'Salvar'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { marginBottom: 16 },
  button: { marginTop: 16 },
  radioContainer: { flexDirection: 'row', justifyContent: 'space-around' },
});
