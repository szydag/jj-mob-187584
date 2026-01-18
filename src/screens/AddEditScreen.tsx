import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, NativeStackScreenProps } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import DateTimePicker from '@react-native-community/datetimepicker';
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

type Props = NativeStackScreenProps<RootStackParamList, 'AddEdit'>;

// --- Custom Components based on Design ---

const CustomHeader: React.FC<{ title: string; color: string; hasBackButton: boolean }> = ({ title, color, hasBackButton }) => {
    const navigation = useNavigation();
    return (
        <View style={[styles.headerContainer, { backgroundColor: color }]}>
            <SafeAreaView edges={['top']} style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 10 }}>
                {hasBackButton && (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-left" size={24} color={Theme.background} />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>{title}</Text>
            </SafeAreaView>
        </View>
    );
};

const CustomInput: React.FC<{ label: string; placeholder: string; value: string; onChangeText: (text: string) => void }> = (props) => (
    <View style={styles.formGroup}>
        <Text style={styles.label}>{props.label}</Text>
        <TextInput
            style={styles.input}
            placeholder={props.placeholder}
            placeholderTextColor="#9CA3AF"
            value={props.value}
            onChangeText={props.onChangeText}
        />
    </View>
);

const CustomTextarea: React.FC<{ label: string; placeholder: string; value: string; onChangeText: (text: string) => void }> = (props) => (
    <View style={styles.formGroup}>
        <Text style={styles.label}>{props.label}</Text>
        <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={props.placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={props.value}
            onChangeText={props.onChangeText}
        />
    </View>
);

const DatePickerComponent: React.FC<{ label: string; date: Date | null; setDate: (date: Date | null) => void }> = ({ label, date, setDate }) => {
    const [showPicker, setShowPicker] = useState(false);

    const onChange = (event: any, selectedDate: Date | undefined) => {
        setShowPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
        } else if (event.type === 'dismissed' && Platform.OS === 'android') {
            // Keep current date if dismissed on Android
        } else if (event.type === 'set' && selectedDate) {
            setDate(selectedDate);
        }
    };

    const displayDate = date ? date.toLocaleDateString('tr-TR') : 'Tarih seçilmedi';

    return (
        <View style={styles.formGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePickerButton}>
                <Text style={date ? styles.dateText : styles.datePlaceholder}>{displayDate}</Text>
                <Icon name="calendar" size={20} color={Theme.primary} />
            </TouchableOpacity>
            
            {showPicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={date || new Date()}
                    mode="date"
                    display="default"
                    onChange={onChange}
                />
            )}
        </View>
    );
};

const ToggleComponent: React.FC<{ label: string; value: boolean; onValueChange: (value: boolean) => void }> = ({ label, value, onValueChange }) => (
    <View style={styles.toggleContainer}>
        <Text style={styles.label}>{label}</Text>
        <Switch
            trackColor={{ false: Theme.secondary, true: Theme.primary }}
            thumbColor={Theme.background}
            ios_backgroundColor={Theme.secondary}
            onValueChange={onValueChange}
            value={value}
        />
    </View>
);

const ActionButton: React.FC<{ color: string; label: string; onPress: () => void; disabled: boolean }> = ({ color, label, onPress, disabled }) => (
    <TouchableOpacity 
        style={[styles.button, { backgroundColor: disabled ? '#9CA3AF' : color }]} 
        onPress={onPress}
        disabled={disabled}
    >
        <Text style={styles.buttonText}>{label}</Text>
    </TouchableOpacity>
);

// --- Screen ---

const AddEditScreen: React.FC<Props> = ({ route, navigation }) => {
    const todoId = route.params?.id;
    const isEditing = !!todoId;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState<Date | null>(null);
    const [isImportant, setIsImportant] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const fetchTodoDetails = async (id: string) => {
        try {
            const response = await fetch(`${API_URL}/${id}`);
            if (!response.ok) throw new Error('Failed to fetch todo');
            const data: TodoItem = await response.json();
            
            setTitle(data.title);
            setDescription(data.description || '');
            setIsImportant(data.isImportant);
            setDueDate(data.dueDate ? new Date(data.dueDate) : null);
        } catch (error) {
            Alert.alert("Hata", "Görev detayları yüklenirken hata oluştu.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isEditing) {
            navigation.setOptions({ title: 'Görevi Düzenle' });
            fetchTodoDetails(todoId);
        } else {
            navigation.setOptions({ title: 'Yeni Görev Ekle' });
            setLoading(false);
        }
    }, [isEditing, todoId]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Uyarı", "Görev başlığı boş bırakılamaz.");
            return;
        }

        setIsSaving(true);
        const method = isEditing ? 'PUT' : 'POST';
        const url = isEditing ? `${API_URL}/${todoId}` : API_URL;

        const payload = {
            title: title.trim(),
            description: description.trim() || null,
            dueDate: dueDate ? dueDate.toISOString() : null,
            isImportant,
        };

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                Alert.alert("Başarılı", isEditing ? "Görev başarıyla güncellendi." : "Yeni görev eklendi.");
                navigation.goBack();
            } else {
                throw new Error("API call failed");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Hata", "Kaydetme işlemi sırasında bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const screenTitle = isEditing ? 'Görevi Düzenle' : 'Yeni Görev Ekle';

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <CustomHeader title={screenTitle} color={Theme.primary} hasBackButton={true} />
            
            <ScrollView contentContainerStyle={styles.content}>
                <CustomInput
                    label="Görev Başlığı"
                    placeholder="Örn: Haftalık toplantı hazırlığı"
                    value={title}
                    onChangeText={setTitle}
                />
                
                <CustomTextarea
                    label="Detaylı Açıklama"
                    placeholder="Gerekli adımları buraya yazın"
                    value={description}
                    onChangeText={setDescription}
                />
                
                <DatePickerComponent
                    label="Son Teslim Tarihi"
                    date={dueDate}
                    setDate={setDueDate}
                />

                <ToggleComponent
                    label="Önemli Görev"
                    value={isImportant}
                    onValueChange={setIsImportant}
                />
            </ScrollView>

            <View style={styles.footer}>
                <ActionButton
                    color={Theme.primary}
                    label={isSaving ? "Kaydediliyor..." : "Görevi Kaydet"}
                    onPress={handleSave}
                    disabled={isSaving}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Theme.background,
    },
    // Header Styles
    headerContainer: {
        backgroundColor: Theme.primary,
        paddingBottom: 15,
    },
    backButton: {
        paddingHorizontal: Theme.padding,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.background,
        paddingLeft: 10,
    },
    // Form Styles
    content: {
        padding: Theme.padding,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: Theme.text_dark,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Theme.secondary,
        borderRadius: Theme.borderRadius,
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
        color: Theme.text_dark,
        borderWidth: 1,
        borderColor: Theme.secondary,
    },
    textarea: {
        height: 100,
        paddingTop: 10,
    },
    // Date Picker Styles
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Theme.secondary,
        borderRadius: Theme.borderRadius,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Theme.secondary,
    },
    dateText: {
        fontSize: 16,
        color: Theme.text_dark,
    },
    datePlaceholder: {
        fontSize: 16,
        color: '#9CA3AF',
    },
    // Toggle Styles
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 20,
    },
    // Button Styles
    footer: {
        padding: Theme.padding,
        borderTopWidth: 1,
        borderTopColor: Theme.secondary,
    },
    button: {
        borderRadius: Theme.borderRadius,
        paddingVertical: 14,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Theme.background,
    },
});

export default AddEditScreen;