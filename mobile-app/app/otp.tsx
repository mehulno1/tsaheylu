import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { verifyOtp } from '../lib/api/auth';
import { setAuthToken } from '../lib/api/client';

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidOtp = otp.length === 6;

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      const res = await verifyOtp(phone!, otp); // 🔥 REAL BACKEND CALL
      setAuthToken(res.token);                  // 🔐 STORE TOKEN
      router.replace('/');                      // 🏠 GO TO HOME
    } catch (error) {
      console.error(error);
      alert('Invalid or expired OTP');
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
        Enter OTP
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
        OTP sent to {phone}
      </Text>

      {/* OTP Input */}
      <TextInput
        placeholder="6-digit OTP"
        keyboardType="number-pad"
        maxLength={6}
        value={otp}
        onChangeText={(text) => {
          const digitsOnly = text.replace(/[^0-9]/g, '');
          setOtp(digitsOnly);
        }}
        style={{
          marginTop: 32,
          borderWidth: 1,
          borderColor: isValidOtp ? '#000' : '#ccc',
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          fontSize: 16,
          textAlign: 'center',
          letterSpacing: 8,
        }}
      />

      {/* Verify Button */}
      <TouchableOpacity
        disabled={!isValidOtp || loading}
        onPress={handleVerifyOtp}
        style={{
          marginTop: 24,
          backgroundColor: isValidOtp ? '#000000' : '#cccccc',
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
          {loading ? 'Verifying...' : 'Verify OTP'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
