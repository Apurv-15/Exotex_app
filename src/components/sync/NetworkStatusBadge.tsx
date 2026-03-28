import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const NetworkStatusBadge = () => {
  const { isOnline, isSyncing } = useNetworkStatus();

  let color = '#10B981'; // Green
  let label = 'Online';
  let icon = 'wifi';

  if (!isOnline) {
    color = '#EF4444'; // Red
    label = 'Offline';
    icon = 'wifi-off';
  } else if (isSyncing) {
    color = '#F59E0B'; // Yellow
    label = 'Syncing...';
    icon = 'cloud-sync';
  }

  return (
    <View style={[styles.badgeContainer, { backgroundColor: `${color}20`, borderColor: color }]}>
        <MaterialCommunityIcons name={icon as any} size={14} color={color} />
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  }
});
