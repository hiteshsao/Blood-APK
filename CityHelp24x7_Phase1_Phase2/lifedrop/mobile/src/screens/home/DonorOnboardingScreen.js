import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import userApi from '../../api/userApi';
import ScreenHeader from '../../components/ScreenHeader';
import InputField from '../../components/InputField';
import CustomButton from '../../components/CustomButton';
import BloodGroupPicker from '../../components/BloodGroupPicker';
import { colors } from '../../theme/colors';
import { fontFamilies } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

/** Lets any signed-in user switch on their donor profile (blood group + age). */
export const DonorOnboardingScreen = ({ navigation }) => {
  const { user, refreshUser } = useAuth();
  const [bloodGroup, setBloodGroup] = useState(
    user?.bloodGroup ? String(user.bloodGroup).replace('_POSITIVE', '+').replace('_NEGATIVE', '-') : 'O+'
  );
  const [age, setAge] = useState(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState(user?.gender || 'MALE');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const n = parseInt(age, 10);
    if (!n || n < 18 || n > 65) {
      setError('Donor must be between 18 and 65 years old');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await userApi.enableDonorProfile({ bloodGroup, age: n, gender, available: true });
      await refreshUser();
      Alert.alert('You are a donor now', 'Nearby patients can now reach you.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not enable donor profile. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Become a Donor" subtitle="Save lives near you" showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Blood group</Text>
          <BloodGroupPicker value={bloodGroup} onChange={setBloodGroup} />

          <InputField label="Age" value={age} onChangeText={setAge} keyboardType="number-pad" placeholder="18 - 65" />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.row}>
            {GENDERS.map((g) => (
              <TouchableOpacity key={g} onPress={() => setGender(g)} style={[styles.chip, gender === g && styles.chipOn]}>
                <Text style={[styles.chipText, gender === g && styles.chipTextOn]}>{g.charAt(0) + g.slice(1).toLowerCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <CustomButton tone="blood" title="Enable Donor Profile" onPress={submit} loading={saving} style={{ marginTop: spacing.lg }} />
          <Text style={styles.note}>You can switch donor availability on or off anytime from Home.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBg },
  content: { padding: spacing.screenPadding, paddingBottom: spacing.xxxl },
  label: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.navyDark, marginBottom: 8, marginTop: spacing.md },
  row: { flexDirection: 'row' },
  chip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8, backgroundColor: '#FFF' },
  chipOn: { backgroundColor: colors.primaryRed, borderColor: colors.primaryRed },
  chipText: { fontFamily: fontFamilies.bold, fontSize: 13, color: colors.muted },
  chipTextOn: { color: '#FFF' },
  error: { fontFamily: fontFamilies.medium, color: colors.danger, marginTop: spacing.md },
  note: { fontFamily: fontFamilies.regular, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: spacing.md },
});

export default DonorOnboardingScreen;
