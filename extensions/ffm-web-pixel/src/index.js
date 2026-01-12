import { register } from '@shopify/web-pixels-extension';

register(({ analytics, browser }) => {
  const FFM_STORAGE_KEY = 'ffm_hash';
  const FFM_CLEAR_COOKIE = 'ffm_clear';
  const CART_ATTRIBUTE_NAME = '_ffm';

  /**
   * Get FFM hash from pixel's sandboxed localStorage
   * Note: This is NOT the same as the page's localStorage
   */
  function getStoredFFM() {
    try {
      if (browser.localStorage) {
        return browser.localStorage.getItem(FFM_STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[FFM Web Pixel] Unable to access localStorage:', e);
    }
    return null;
  }

  /**
   * Update cart with FFM hash
   */
  async function updateCartWithFFM(ffmHash) {
    try {
      const cartResponse = await browser.fetch('/cart.js');
      if (!cartResponse.ok) {
        throw new Error('Failed to fetch cart');
      }
      
      const cart = await cartResponse.json();
      const currentAttributes = cart.attributes || {};
      
      if (currentAttributes[CART_ATTRIBUTE_NAME] === ffmHash) {
        console.log('[FFM Web Pixel] FFM already set in cart');
        return;
      }
      
      const attributes = { ...currentAttributes };
      attributes[CART_ATTRIBUTE_NAME] = ffmHash;
      
      let note = cart.note || '';
      note = note.replace(/ffm:[^\s]+/g, '').trim();
      note = note ? note + ' ffm:' + ffmHash : 'ffm:' + ffmHash;
      
      const updateResponse = await browser.fetch('/cart/update.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attributes: attributes,
          note: note
        })
      });
      
      if (updateResponse.ok) {
        console.log('[FFM Web Pixel] Updated cart with FFM hash:', ffmHash);
      } else {
        console.warn('[FFM Web Pixel] Failed to update cart with FFM');
      }
    } catch (e) {
      console.warn('[FFM Web Pixel] Error updating cart with FFM:', e);
    }
  }

  /**
   * Signal to the storefront that checkout is complete
   * Uses a cookie since Web Pixel localStorage is sandboxed
   */
  async function signalCheckoutComplete() {
    try {
      // Set a cookie to signal checkout completion
      // This cookie will be read by the theme app extension
      if (browser.cookie) {
        await browser.cookie.set(FFM_CLEAR_COOKIE, 'true', {
          maxAge: 300, // 5 minutes - enough time for redirect back to store
          sameSite: 'Lax',
          secure: true,
        });
        console.log('[FFM Web Pixel] Set checkout completion cookie');
      }
      
      // Also clear the pixel's own sandboxed storage
      if (browser.localStorage) {
        try {
          browser.localStorage.removeItem(FFM_STORAGE_KEY);
          console.log('[FFM Web Pixel] Cleared FFM from pixel localStorage');
        } catch (e) {
          console.warn('[FFM Web Pixel] Unable to clear pixel localStorage:', e);
        }
      }
    } catch (error) {
      console.warn('[FFM Web Pixel] Error signaling checkout complete:', error);
    }
  }

  // Subscribe to checkout_started event - ensure FFM is in cart when checkout begins
  analytics.subscribe('checkout_started', async (event) => {
    console.log('[FFM Web Pixel] Checkout started event received');
    
    const ffmHash = getStoredFFM();
    if (ffmHash) {
      console.log('[FFM Web Pixel] Found FFM hash, ensuring it\'s in cart');
      await updateCartWithFFM(ffmHash);
    } else {
      console.log('[FFM Web Pixel] No FFM hash found in pixel localStorage');
    }
  });

  // Subscribe to checkout_completed event - signal that FFM should be cleared
  analytics.subscribe('checkout_completed', async (event) => {
    console.log('[FFM Web Pixel] Checkout completed event received', event);
    await signalCheckoutComplete();
  });

  // Also listen for page_viewed on thank you page as backup
  analytics.subscribe('page_viewed', async (event) => {
    const context = event.context;
    if (context && context.document && context.document.location) {
      const pathname = context.document.location.pathname || '';
      if (pathname.includes('/thank_you') || pathname.includes('thank-you')) {
        console.log('[FFM Web Pixel] Thank you page detected via page_viewed');
        await signalCheckoutComplete();
      }
    }
  });

  console.log('[FFM Web Pixel] Registered and listening for checkout events');
});
