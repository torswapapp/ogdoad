import type { getFromKeychain, getWithBiometrics } from './keychain';
import type { isSecureDevice as isSecureDeviceAndroid, setInKeychain as setInKeychainAndroid } from './keychain.android';
import type { isSecureDevice as isSecureDeviceIOS, setInKeychain as setInKeychainIOS } from './keychain.ios';

export const getFromKeychain: typeof getFromKeychain;
export const getWithBiometrics: typeof getWithBiometrics;
export const setInKeychain: typeof setInKeychainAndroid | typeof setInKeychainIOS;
export const isSecureDevice: typeof isSecureDeviceAndroid | typeof isSecureDeviceIOS;
