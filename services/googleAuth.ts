/**
 * Google OAuth Service
 * Real Google Sign-In implementation
 */

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  photoURL: string;
}

// Google OAuth Client ID
// Get from: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '47706620391-f73bk69cs5jgkbq55idbeh5lroudnjlu.apps.googleusercontent.com';

/**
 * Initialize Google Sign-In
 */
export function initGoogleSignIn(onSuccess: (user: GoogleUser) => void) {
  if (typeof window === 'undefined' || !(window as any).google) {
    console.error('Google Sign-In library not loaded');
    return;
  }

  (window as any).google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: any) => {
      handleCredentialResponse(response, onSuccess);
    },
    auto_select: false,
  });
}

/**
 * Wait for Google library to load
 */
function waitForGoogle(callback: () => void, maxAttempts = 20) {
  let attempts = 0;
  const checkGoogle = () => {
    if ((window as any).google?.accounts?.id) {
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(checkGoogle, 100);
    } else {
      console.error('Google Sign-In library failed to load');
    }
  };
  checkGoogle();
}

/**
 * Show Google Sign-In popup
 * Opens the OAuth popup for user to sign in
 */
export function showGoogleSignIn(onSuccess: (user: GoogleUser) => void) {
  if (typeof window === 'undefined') {
    console.error('Window not available');
    return;
  }

  // Wait for Google library to load
  waitForGoogle(() => {
    try {
      console.log('🔐 Initializing Google Sign-In with Client ID:', GOOGLE_CLIENT_ID);
      
      // Use the simpler Identity Services method
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          handleCredentialResponse(response, onSuccess);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup', // Force popup mode
      });

      // Render a hidden button and click it programmatically
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'none';
      document.body.appendChild(buttonContainer);
      
      (window as any).google.accounts.id.renderButton(buttonContainer, {
        type: 'standard',
        theme: 'filled_blue',
        size: 'large',
        text: 'continue_with',
      });
      
      // Click the button to trigger popup
      const googleButton = buttonContainer.querySelector('div[role="button"]') as HTMLElement;
      if (googleButton) {
        console.log('✅ Triggering Google Sign-In popup');
        googleButton.click();
        
        // Clean up after a delay
        setTimeout(() => {
          document.body.removeChild(buttonContainer);
        }, 1000);
      } else {
        console.log('⚠️ Could not find Google button, trying prompt...');
        // Fallback to prompt
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.error('❌ Google popup not displayed:', 
              notification.getNotDisplayedReason() || notification.getSkippedReason());
            alert('Google Sign-In popup was blocked. Please:\n1. Allow popups for this site\n2. Make sure localhost:3003 is added to Google Cloud Console');
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Google Sign-In error:', error);
      alert('Google Sign-In failed. Please check:\n1. Popups are allowed\n2. localhost:3003 is in Google Cloud Console\n3. Wait 5 minutes after adding it');
    }
  });
}

/**
 * Handle Google credential response
 */
function handleCredentialResponse(response: any, onSuccess: (user: GoogleUser) => void) {
  try {
    // Decode JWT token to get user info
    const userInfo = parseJwt(response.credential);
    
    const googleUser: GoogleUser = {
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      photoURL: userInfo.picture,
    };

    onSuccess(googleUser);
  } catch (error) {
    console.error('Error handling Google response:', error);
  }
}

/**
 * Parse JWT token
 */
function parseJwt(token: string) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

/**
 * Sign out from Google
 */
export function signOutGoogle() {
  if (typeof window !== 'undefined' && (window as any).google) {
    (window as any).google.accounts.id.disableAutoSelect();
  }
}

