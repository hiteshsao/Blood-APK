import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCity } from '../../../context/CityContext';
import ScreenHeader from '../../../components/ScreenHeader';
import InputField from '../../../components/InputField';
import CustomButton from '../../../components/CustomButton';
import { servicesApi, providerApi, errorMessage } from '../api/servicesApi';
import { Chip, ui } from '../components/ui';
import { colors } from '../../../theme/colors';
import { fontFamilies } from '../../../theme/typography';
import { spacing } from '../../../theme/spacing';

const UNITS = [
  { k: 'VISIT', l: 'Per visit' },
  { k: 'HOUR', l: 'Per hour' },
  { k: 'DAY', l: 'Per day' },
  { k: 'FIXED', l: 'Per job' },
];

/** Register as a provider, or edit the existing profile (route.params.profile). */
export const ProviderRegisterScreen = ({ navigation, route }) => {
  const profile = route.params?.profile || null;
  const { selectedCity } = useCity();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState(profile?.categoryId || null);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [experience, setExperience] = useState(profile?.experienceYears != null ? String(profile.experienceYears) : '');
  const [price, setPrice] = useState(profile?.priceFrom != null ? String(profile.priceFrom) : '');
  const [unit, setUnit] = useState(profile?.priceUnit || 'VISIT');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    servicesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const submit = async () => {
    const cityId = profile?.cityId || selectedCity?.id;
    if (!categoryId) return setError('Choose your service category');
    if (!displayName.trim()) return setError('Enter your name or business name');
    if (!/^[0-9+\- ]{7,15}$/.test(phone.trim())) return setError('Enter a valid phone number');
    if (!address.trim()) return setError('Enter your address');
    if (!cityId) return setError('Select your city on the Home screen first');
    const exp = experience.trim() === '' ? null : parseInt(experience, 10);
    if (exp != null && (isNaN(exp) || exp < 0 || exp > 60)) return setError('Experience must be 0 to 60 years');
    const pr = price.trim() === '' ? null : parseFloat(price);
    if (pr != null && (isNaN(pr) || pr < 0)) return setError('Enter a valid price');
    setError('');
    setSaving(true);
    const payload = {
      categoryId,
      cityId,
      displayName: displayName.trim(),
      description: description.trim() || null,
      address: address.trim(),
      phone: phone.trim(),
      experienceYears: exp,
      priceFrom: pr,
      priceUnit: pr != null ? unit : null,
    };
    try {
      if (profile) await providerApi.updateMe(payload);
      else await providerApi.register(payload);
      Alert.alert(
        profile ? 'Profile updated' : 'Submitted for verification',
        profile ? 'Your changes were saved.' : 'We will review your profile soon. You will be notified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={ui.safe}>
      <ScreenHeader title={profile ? 'Edit Profile' : 'Become a Provider'} showBack onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
          <Text style={ui.label}>Your service</Text>
          <View style={styles.wrap}>
            {categories.map((c) => (
              <View key={c.id} style={{ marginBottom: 8 }}>
                <Chip label={c.name} active={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
              </View>
            ))}
          </View>

          <InputField label="Name / Business name" value={displayName} onChangeText={setDisplayName} placeholder="e.g. Sharma Electricals" autoCapitalize="words" />
          <InputField label="Phone (shown only after you accept a booking)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="10 digit mobile number" />
          <InputField label="Address (private)" value={address} onChangeText={setAddress} placeholder="Shop or home address" autoCapitalize="sentences" />
          <InputField label="About your work" value={description} onChangeText={setDescription} placeholder="Skills, areas you cover..." autoCapitalize="sentences" />
          <InputField label="Experience (years)" value={experience} onChangeText={setExperience} keyboardType="number-pad" placeholder="e.g. 5" />

          <Text style={ui.label}>Starting price (optional)</Text>
          <InputField value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="₹ amount" />
          <View style={styles.wrap}>
            {UNITS.map((u) => <Chip key={u.k} label={u.l} active={unit === u.k} onPress={() => setUnit(u.k)} />)}
          </View>

          {error ? <Text style={ui.error}>{error}</Text> : null}
          <CustomButton title={profile ? 'Save Changes' : 'Submit for Verification'} onPress={submit} loading={saving} style={{ marginTop: spacing.lg }} />
          {!profile ? <Text style={styles.note}>Customers see your profile only after an admin verifies it.</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { textAlign: 'center', fontFamily: fontFamilies.regular, fontSize: 12, color: colors.muted, marginTop: spacing.md },
});

export default ProviderRegisterScreen;
