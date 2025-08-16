import * as Crypto from 'expo-crypto';

export function createHash(data: string): string {
  // Use Expo's crypto for React Native
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    data
  ).then(hash => hash);
}

export async function createHashAsync(data: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    data
  );
}