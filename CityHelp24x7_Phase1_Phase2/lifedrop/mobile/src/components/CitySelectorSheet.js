import React from 'react';
import { StyleSheet, View, Text, Modal, TouchableOpacity, FlatList, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { fontFamilies } from '../theme/typography';
import { spacing, radii } from '../theme/spacing';

/**
 * Bottom sheet listing the supported cities. Tapping a row selects it and closes the sheet.
 */
export const CitySelectorSheet = ({ visible, onClose, cities = [], selectedId, onSelect }) => {
  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          onSelect?.(item);
          onClose?.();
        }}
        style={[styles.row, isSelected && styles.rowSelected]}
      >
        <View style={styles.rowIcon}>
          <Ionicons name="location-outline" size={20} color={colors.brand.main} />
        </View>
        <View style={styles.rowTextWrap}>
          <Text style={styles.rowTitle}>{item.name}</Text>
          <Text style={styles.rowSub}>{item.state}</Text>
        </View>
        {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.success} /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Choose your city</Text>
        <Text style={styles.subtitle}>We show donors, services and places near you.</Text>
        <FlatList
          data={cities}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>No cities available right now. Check your internet and try again.</Text>
          }
          contentContainerStyle={styles.listContent}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    maxHeight: '70%',
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  title: {
    fontFamily: fontFamilies.extraBold,
    fontSize: 20,
    color: colors.navyDark,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.button,
    marginBottom: spacing.xs,
  },
  rowSelected: {
    backgroundColor: colors.pageBg,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.brand.soft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: 15,
    color: colors.navyDark,
  },
  rowSub: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    color: colors.muted,
  },
  empty: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});

export default CitySelectorSheet;
