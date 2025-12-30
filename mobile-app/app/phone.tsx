import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { requestOtp } from '../lib/api/auth';
import { APIError } from '../lib/api/errors';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidPhone = phone.length === 10;

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      await requestOtp(phone); // 🔥 REAL BACKEND CALL
      router.push({ pathname: '/otp', params: { phone } });
    } catch (error) {
      console.error('Failed to send OTP:', error);
      const errorMessage =
        error instanceof APIError ? error.userMessage : 'Failed to send OTP. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        justifyContent: 'center',
      }}
    >
      {/* Title */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        Enter your mobile number
      </Text>

      {/* Subtitle */}
      <Text
        style={{
          marginTop: 8,
          fontSize: 14,
          color: '#666',
          textAlign: 'center',
        }}
      >
        We will send you a one-time password (OTP)
      </Text>

      {/* Phone Input */}
      <TextInput
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        maxLength={10}
        value={phone}
        onChangeText={(text) => {
          const digitsOnly = text.replace(/[^0-9]/g, '');
          setPhone(digitsOnly);
        }}
        style={{
          marginTop: 32,
          borderWidth: 1,
          borderColor: isValidPhone ? '#000' : '#ccc',
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 16,
        }}
      />

      {/* Send OTP Button */}
      <TouchableOpacity
        disabled={!isValidPhone || loading}
        onPress={handleSendOtp}
        style={{
          marginTop: 24,
          backgroundColor: isValidPhone ? '#000000' : '#cccccc',
          paddingVertical: 14,
          borderRadius: 8,
        }}
        activeOpacity={0.8}
      >
        <Text
          style={{
            color: '#ffffff',
            fontSize: 16,
            fontWeight: '600',
            textAlign: 'center',
          }}
        >
          {loading ? 'Sending OTP...' : 'Send OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
