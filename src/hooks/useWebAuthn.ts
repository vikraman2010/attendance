import { useState, useCallback } from 'react';

export interface WebAuthnState {
  isSupported: boolean;
  isRegistering: boolean;
  isAuthenticating: boolean;
  isRegistered: boolean;
  error: string | null;
  credentialId: string | null;
}

// Convert ArrayBuffer to base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

// Convert base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const useWebAuthn = () => {
  const [state, setState] = useState<WebAuthnState>({
    isSupported: typeof window !== 'undefined' && 'credentials' in navigator && 'create' in navigator.credentials,
    isRegistering: false,
    isAuthenticating: false,
    isRegistered: false,
    error: null,
    credentialId: null,
  });

  const register = useCallback(async (userId: string, userName: string) => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'WebAuthn is not supported in this browser' }));
      return false;
    }

    setState(prev => ({ ...prev, isRegistering: true, error: null }));

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const userIdBuffer = new TextEncoder().encode(userId);

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: "Student Attendance System",
          id: window.location.hostname,
        },
        user: {
          id: userIdBuffer,
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          {
            alg: -7, // ES256
            type: "public-key",
          },
          {
            alg: -257, // RS256
            type: "public-key",
          },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "direct",
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (credential) {
        const credentialId = arrayBufferToBase64(credential.rawId);
        
        // Store credential ID in localStorage (in production, store in backend)
        localStorage.setItem('webauthn_credential_id', credentialId);
        localStorage.setItem('webauthn_user_id', userId);

        setState(prev => ({
          ...prev,
          isRegistering: false,
          isRegistered: true,
          credentialId,
        }));

        return true;
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isRegistering: false,
        error: error.message || 'Registration failed',
      }));
      console.error('WebAuthn registration error:', error);
    }

    return false;
  }, [state.isSupported]);

  const authenticate = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'WebAuthn is not supported in this browser' }));
      return false;
    }

    const storedCredentialId = localStorage.getItem('webauthn_credential_id');
    if (!storedCredentialId) {
      setState(prev => ({ ...prev, error: 'No registered credential found' }));
      return false;
    }

    setState(prev => ({ ...prev, isAuthenticating: true, error: null }));

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        allowCredentials: [
          {
            id: base64ToArrayBuffer(storedCredentialId),
            type: "public-key",
          },
        ],
        userVerification: "required",
        timeout: 60000,
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (assertion) {
        setState(prev => ({
          ...prev,
          isAuthenticating: false,
        }));

        return true;
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: error.message || 'Authentication failed',
      }));
      console.error('WebAuthn authentication error:', error);
    }

    return false;
  }, [state.isSupported]);

  const checkRegistration = useCallback(() => {
    const credentialId = localStorage.getItem('webauthn_credential_id');
    setState(prev => ({
      ...prev,
      isRegistered: !!credentialId,
      credentialId,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    register,
    authenticate,
    checkRegistration,
    clearError,
  };
};