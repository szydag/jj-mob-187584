import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useIsFocused, NativeStackScreenProps } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import Checkbox from 'expo-checkbox';
import { RootStackParamList } from '../navigation/AppNavigator';

// --- Local Constants and Types ---
export const Theme = {
    primary: '#2563EB',
    secondary: '#F3F4F6',
    text_dark: '#1F2937',
    background: '#FFFFFF',
    danger: '#EF4444',
    border: '#D1D5DB',
    padding: 16,
    borderRadius: 8,
};

export interface TodoItem {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null; // ISO Date String
    isImportant: boolean;
    isCompleted: boolean;
    createdAt: string;
}

export const API_URL = 'http://localhost:3000/api/todos'; // Update with your actual IP if needed

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

// --- Components ---

const Header: React.FC<{ title: string; color: string }> = ({ title, color }) => (
    <View style={[styles.headerContainer, { backgroundColor: color }]}>
        <Text style={styles.headerTitle}>{title}</Text>
    </View>
);

const SearchBar: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
    const [query, setQuery] = useState('');
    
    // Simple debounce simulation
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query);
        }, 300);

        return () => clearTimeout(timer);
    }, [query, onSearch]);

    return (
        <View style={styles.searchContainer}>
            <Icon name="search" size={20} color={Theme.text_dark} style={{ marginRight: 8 }} />
            <TextInput
                style={styles.searchInput}
                placeholder="Görev ara..."
                placeholderTextColor="#6B7280"
                value={query}
                onChangeText={setQuery}
            />
        </View>
    );
};

const ListItem: React.FC<{ item: TodoItem; onPress: (id: string) => void; onToggle: (item: TodoItem) => void }> = ({ item, onPress, onToggle }) => {
    const statusText = item.isCompleted ? 'Durum: Tamamlandı' : 'Durum: Beklemede';
    const isImportantStyle = item.isImportant ? { borderLeftColor: Theme.danger, borderLeftWidth: 4 } : {};
    
    return (
        <TouchableOpacity style={[styles.listItemContainer, isImportantStyle]} onPress={() => onPress(item.id)} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, item.isCompleted && styles.completedText]}>{item.title}</Text>
                <Text style={styles.itemSubtitle}>{statusText}</Text>
            </View>
            <Checkbox
                style={styles.checkbox}
                value={item.isCompleted}
                onValueChange={() => onToggle(item)}
                color={item.isCompleted ? Theme.primary : '#4B5563'}
            />
        </TouchableOpacity>
    );
};

const FAB: React.FC<{ onPress: () => void }> = ({ onPress }) => (
    <TouchableOpacity 
        style={[styles.fab, { backgroundColor: Theme.primary }]}
        onPress={onPress}
        activeOpacity={0.9}
    >
        <Icon name="plus" size={30} color={Theme.background} />
    </TouchableOpacity>
);

// --- Screen ---

const HomeScreen: React.FC<Props> = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchTodos = useCallback(async (query: string = '') => {
        setLoading(true);
        try {
            const url = `${API_URL}${query ? `?search=${encodeURIComponent(query)}` : ''}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data: TodoItem[] = await response.json();
            setTodos(data);
        } catch (error) {
            console.error("Error fetching todos:", error);
            Alert.alert("Hata", "Görevler yüklenirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchTodos(searchQuery);
        }
    }, [isFocused, searchQuery, fetchTodos]);
    
    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleToggleCompletion = async (item: TodoItem) => {
        try {
            const newStatus = !item.isCompleted;
            const response = await fetch(`${API_URL}/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isCompleted: newStatus }),
            });

            if (response.ok) {
                // Optimistically update the list
                setTodos(prev => 
                    prev.map(t => 
                        t.id === item.id ? { ...t, isCompleted: newStatus } : t
                    )
                );
            } else {
                throw new Error('Update failed');
            }
        } catch (error) {
            console.error("Error updating todo:", error);
            Alert.alert("Hata", "Görevin durumu güncellenemedi.");
        }
    };
    
    const handleNavigateToEdit = (id: string) => {
        navigation.navigate('AddEdit', { id });
    };

    const handleNavigateToAdd = () => {
        navigation.navigate('AddEdit', undefined);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <Header title="Yapılacaklar" color={Theme.primary} />
            <View style={styles.content}>
                <SearchBar onSearch={handleSearch} />
                
                {loading && todos.length === 0 ? (
                    <ActivityIndicator size="large" color={Theme.primary} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={todos}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <ListItem 
                                item={item} 
                                onPress={handleNavigateToEdit} 
                                onToggle={handleToggleCompletion}
                            />
                        )}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        ListEmptyComponent={!loading ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>Henüz görev bulunamadı.</Text>
                            </View>
                        ) : null}
                    />
                )}
            </View>
            <FAB onPress={handleNavigateToAdd} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    content: {
        flex: 1,
        paddingHorizontal: Theme.padding,
    },
    // Header Styles
    headerContainer: {
        paddingTop: 10,
        paddingHorizontal: Theme.padding,
        paddingBottom: 20,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.background,
        marginTop: 10,
    },
    // Search Bar Styles
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.secondary,
        borderRadius: Theme.borderRadius,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Theme.text_dark,
    },
    // List Item Styles
    listItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: Theme.background,
        borderRadius: Theme.borderRadius,
        marginBottom: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 2,
        borderLeftColor: 'transparent',
        borderLeftWidth: 4,
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: Theme.text_dark,
    },
    completedText: {
        textDecorationLine: 'line-through',
        color: '#6B7280',
    },
    itemSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        marginLeft: 10,
    },
    // FAB Styles
    fab: {
        position: 'absolute',
        width: 60,
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        right: 20,
        bottom: 20,
        borderRadius: 30,
        elevation: 5,
        zIndex: 10,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6B7280',
    }
});

export default HomeScreen;