import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { User, Settings, LogOut, Edit, Bell, Shield, HelpCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/auth-store';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              console.log('Starting logout process...');
              await logout();
              console.log('Logout completed, navigating to welcome screen...');
              
              // Navigate immediately after logout
              router.replace('/');
            } catch (error) {
              console.error('Logout error:', error);
              // Force navigation even if logout fails
              router.replace('/');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleEditProfile = () => {
    // Navigate to edit profile screen
    console.log('Edit profile');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Here you can manage your notification preferences. (Feature coming soon)');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy', 'Here you can control your data and privacy settings. (Feature coming soon)');
  };

  const handlePreferences = () => {
    Alert.alert('Preferences', 'Here you can customize your app experience. (Feature coming soon)');
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Get help with using the app. (Feature coming soon)');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <Card style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User size={40} color={Colors.dark.text} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@example.com'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Edit size={20} color={Colors.dark.accent} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.height || '--'}</Text>
            <Text style={styles.statLabel}>Height (cm)</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.weight || '--'}</Text>
            <Text style={styles.statLabel}>Weight (kg)</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user?.bodyComposition?.bodyFat || '--'}%</Text>
            <Text style={styles.statLabel}>Body Fat</Text>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Account Settings</Text>
      
      <Card>
        <TouchableOpacity style={styles.settingsItem} onPress={handleNotifications}>
          <View style={styles.settingsItemIcon}>
            <Bell size={20} color={Colors.dark.accent} />
          </View>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Notifications</Text>
            <Text style={styles.settingsItemDescription}>Manage your notification preferences</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.settingsDivider} />
        
        <TouchableOpacity style={styles.settingsItem} onPress={handlePrivacy}>
          <View style={styles.settingsItemIcon}>
            <Shield size={20} color={Colors.dark.accent} />
          </View>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Privacy</Text>
            <Text style={styles.settingsItemDescription}>Control your data and privacy settings</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.settingsDivider} />
        
        <TouchableOpacity style={styles.settingsItem} onPress={handlePreferences}>
          <View style={styles.settingsItemIcon}>
            <Settings size={20} color={Colors.dark.accent} />
          </View>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Preferences</Text>
            <Text style={styles.settingsItemDescription}>Customize your app experience</Text>
          </View>
        </TouchableOpacity>
      </Card>

      <Text style={styles.sectionTitle}>Support</Text>
      
      <Card>
        <TouchableOpacity style={styles.settingsItem} onPress={handleHelp}>
          <View style={styles.settingsItemIcon}>
            <HelpCircle size={20} color={Colors.dark.accent} />
          </View>
          <View style={styles.settingsItemContent}>
            <Text style={styles.settingsItemTitle}>Help & Support</Text>
            <Text style={styles.settingsItemDescription}>Get help with using the app</Text>
          </View>
        </TouchableOpacity>
      </Card>

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="outline"
        size="large"
        style={styles.logoutButton}
        leftIcon={<LogOut size={20} color={Colors.dark.error} />}
        textStyle={{ color: Colors.dark.error }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
  },
  profileCard: {
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 95, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 95, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.subtext,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.ui.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
    marginTop: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingsItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 95, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  settingsItemDescription: {
    fontSize: 14,
    color: Colors.dark.subtext,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.ui.border,
    marginVertical: 8,
  },
  logoutButton: {
    marginTop: 24,
    borderColor: Colors.dark.error,
  },
});