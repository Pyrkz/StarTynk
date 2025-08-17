import * as Crypto from 'expo-crypto';

export async function createHash(data: string): Promise<string> {
  // Use Expo's crypto for React Native
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    data
  );
}

export async function createHashAsync(data: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.MD5,
    data
  );
}