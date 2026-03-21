import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotForm = z.infer<typeof forgotSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotForm) {
    try {
      await apiClient.post('/auth/forgot-password', { email: values.email });
    } catch {
      // Always show success to avoid email enumeration
    } finally {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <View className="flex-1 bg-white justify-center px-6">
        <View className="items-center">
          <View className="w-16 h-16 bg-green-100 rounded-full items-center justify-center mb-4">
            <Text className="text-3xl">✓</Text>
          </View>
          <Text className="text-xl font-bold text-primary mb-2">Revisa tu email</Text>
          <Text className="text-slate-500 text-sm text-center leading-5">
            Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="mt-8 bg-primary rounded-xl px-8 py-3.5"
            activeOpacity={0.8}
          >
            <Text className="text-white font-semibold">Volver al login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 left-6"
          activeOpacity={0.7}
        >
          <Text className="text-accent text-sm font-medium">← Volver</Text>
        </TouchableOpacity>

        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-primary mb-2">¿Olvidaste tu contraseña?</Text>
          <Text className="text-slate-500 text-sm leading-5">
            Ingresa tu email y te enviaremos un enlace para restablecerla.
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-medium text-slate-700 mb-1.5">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className={`border rounded-xl px-4 py-3.5 text-sm text-slate-800 bg-slate-50 ${
                    errors.email ? 'border-red-400' : 'border-slate-200'
                  }`}
                  placeholder="tucorreo@ejemplo.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-xs mt-1">{errors.email.message}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-primary rounded-xl py-4 items-center mt-2"
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">Enviar enlace</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
