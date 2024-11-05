// src/screens/HomeScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { Appbar, FAB, List, Text, IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
}

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const navigation = useNavigation();

  const loadTransactions = async () => {
    try {
      const data = await AsyncStorage.getItem('@transactions');
      const parsedData: Transaction[] = data ? JSON.parse(data) : [];

      // Ordenar transações por data em ordem decrescente
      const sortedTransactions = parsedData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setTransactions(sortedTransactions);
      calculateBalance(sortedTransactions);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  const calculateBalance = (transactions: Transaction[]) => {
    const total = transactions.reduce((acc, item) => acc + item.amount, 0);
    setBalance(total);
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [])
  );

  const confirmDelete = (id: string) => {
    Alert.alert(
      'Excluir Lançamento',
      'Tem certeza que deseja excluir este lançamento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: () => deleteTransaction(id) },
      ]
    );
  };

  const deleteTransaction = async (id: string) => {
    try {
      const updatedTransactions = transactions.filter(item => item.id !== id);
      await AsyncStorage.setItem('@transactions', JSON.stringify(updatedTransactions));
      setTransactions(updatedTransactions);
      calculateBalance(updatedTransactions);
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
    }
  };

  const editTransaction = (transaction: Transaction) => {
    navigation.navigate('Transaction', { transaction });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Controle Financeiro" />
      </Appbar.Header>
      <View style={styles.balanceContainer}>
        <Text variant="headlineLarge">Saldo: R$ {balance.toFixed(2)}</Text>
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.category}
            description={`${item.date} - R$ ${item.amount.toFixed(2)}`}
            left={(props) => <List.Icon {...props} icon={item.amount >= 0 ? 'plus-circle' : 'minus-circle'} />}
            right={(props) => (
              <View style={styles.actions}>
                <IconButton
                  icon="pencil"
                  onPress={() => editTransaction(item)}
                />
                <IconButton
                  icon="delete"
                  onPress={() => confirmDelete(item.id)}
                />
              </View>
            )}
          />
        )}
      />
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('Transaction')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  balanceContainer: { padding: 16, alignItems: 'center' },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  actions: { flexDirection: 'row', alignItems: 'center' },
});
