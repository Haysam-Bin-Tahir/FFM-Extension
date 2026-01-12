(function() {
  'use strict';

  var FFM_STORAGE_KEY = 'ffm_hash';
  var FFM_PARAM_NAME = 'ffm';
  var CART_ATTRIBUTE_NAME = '_ffm';

  /**
   * Get FFM hash from URL query parameters
   */
  function getFFMFromURL() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(FFM_PARAM_NAME);
  }

  /**
   * Get FFM hash from localStorage
   */
  function getStoredFFM() {
    try {
      return localStorage.getItem(FFM_STORAGE_KEY);
    } catch (e) {
      console.warn('[FFM Tracker] Unable to access localStorage:', e);
      return null;
    }
  }

  /**
   * Store FFM hash in localStorage
   */
  function storeFFM(hash) {
    try {
      localStorage.setItem(FFM_STORAGE_KEY, hash);
      console.log('[FFM Tracker] Stored FFM hash:', hash);
    } catch (e) {
      console.warn('[FFM Tracker] Unable to store in localStorage:', e);
    }
  }

  /**
   * Clear FFM hash from localStorage
   */
  function clearStoredFFM() {
    try {
      localStorage.removeItem(FFM_STORAGE_KEY);
      console.log('[FFM Tracker] Cleared FFM hash from localStorage');
    } catch (e) {
      console.warn('[FFM Tracker] Unable to clear localStorage:', e);
    }
  }

  /**
   * Clear FFM hash from cart attributes
   */
  function clearCartAttribute() {
    return fetch('/cart.js')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to fetch cart');
        return response.json();
      })
      .then(function(cart) {
        var attributes = Object.assign({}, cart.attributes || {});
        delete attributes[CART_ATTRIBUTE_NAME];
        
        // Remove FFM from note if present
        var note = cart.note || '';
        note = note.replace(/ffm:[^\s]+/g, '').trim();
        
        return fetch('/cart/update.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attributes: attributes,
            note: note
          })
        });
      })
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to clear cart attributes');
        console.log('[FFM Tracker] Cleared FFM hash from cart');
      })
      .catch(function(e) {
        console.warn('[FFM Tracker] Unable to clear cart attributes:', e);
      });
  }

  /**
   * Clear FFM hash from both localStorage and cart
   */
  function clearFFM() {
    clearStoredFFM();
    clearCartAttribute();
  }

  /**
   * Get current cart attributes
   */
  function getCartAttributes() {
    return fetch('/cart.js')
      .then(function(response) {
        if (!response.ok) throw new Error('Failed to fetch cart');
        return response.json();
      })
      .then(function(cart) {
        return cart.attributes || {};
      })
      .catch(function(e) {
        console.warn('[FFM Tracker] Unable to fetch cart:', e);
        return {};
      });
  }

  /**
   * Update cart with FFM hash - using both attributes and note for reliability
   */
  function updateCartAttribute(ffmHash) {
    return getCartAttributes()
      .then(function(currentAttributes) {
        // Check if already set
        if (currentAttributes[CART_ATTRIBUTE_NAME] === ffmHash) {
          console.log('[FFM Tracker] FFM already set in cart');
          return null;
        }

        var attributes = {};
        attributes[CART_ATTRIBUTE_NAME] = ffmHash;

        // Set both attributes AND note for maximum reliability
        return fetch('/cart/update.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            attributes: attributes,
            note: 'ffm:' + ffmHash
          })
        });
      })
      .then(function(response) {
        if (response && !response.ok) throw new Error('Failed to update cart');
        if (response) {
          console.log('[FFM Tracker] Updated cart with FFM hash:', ffmHash);
        }
      })
      .catch(function(e) {
        console.warn('[FFM Tracker] Unable to update cart:', e);
      });
  }

  /**
   * Intercept cart operations to ensure FFM is always attached
   */
  function interceptAddToCart() {
    // Use Shopify's native cart:update event
    document.addEventListener('cart:update', function() {
      var ffmHash = getStoredFFM();
      if (ffmHash) {
        setTimeout(function() { updateCartAttribute(ffmHash); }, 100);
      }
    });

    var originalXHROpen = XMLHttpRequest.prototype.open;
    var originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method, url) {
      this._ffmUrl = url;
      return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
      var self = this;
      this.addEventListener('load', function() {
        if (self._ffmUrl && (self._ffmUrl.indexOf('/cart/add') !== -1 || self._ffmUrl.indexOf('/cart/change') !== -1)) {
          var ffmHash = getStoredFFM();
          if (ffmHash) {
            setTimeout(function() { updateCartAttribute(ffmHash); }, 100);
          }
        }
      });
      return originalXHRSend.apply(this, arguments);
    };
  }

  /**
   * Intercept Buy Now / Direct Checkout to ensure FFM is captured
   * Uses API interception instead of button detection for reliability
   */
  function interceptBuyNow() {
    // Pre-inject hidden fields into ALL product forms on page load
    function injectIntoForms() {
      var hash = getStoredFFM();
      if (!hash) return;

      document.querySelectorAll('form[action*="/cart/add"], form[action*="/cart"], form.product-form, form[data-type="add-to-cart-form"]').forEach(function(form) {
        if (!form.querySelector('input[name="properties[_ffm]"]')) {
          var propInput = document.createElement('input');
          propInput.type = 'hidden';
          propInput.name = 'properties[_ffm]';
          propInput.value = hash;
          form.appendChild(propInput);
          console.log('[FFM Tracker] Pre-injected FFM property into form');
        }
      });
    }

    // Run immediately and on DOM changes (for dynamically loaded forms)
    injectIntoForms();
    var observer = new MutationObserver(function() {
      injectIntoForms();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Intercept ALL form submissions
    document.addEventListener('submit', function(e) {
      var hash = getStoredFFM();
      if (!hash) return;

      var form = e.target;
      var action = form.action || '';
      
      if (action.indexOf('/cart') !== -1 || action.indexOf('/checkout') !== -1) {
        console.log('[FFM Tracker] Intercepted form submission to:', action);
        
        if (!form.querySelector('input[name="properties[_ffm]"]')) {
          var propInput = document.createElement('input');
          propInput.type = 'hidden';
          propInput.name = 'properties[_ffm]';
          propInput.value = hash;
          form.appendChild(propInput);
          console.log('[FFM Tracker] Injected FFM property into form');
        }
      }
    }, true);

    // Intercept Shopify's dynamic checkout API - this is how Buy Now works
    // Buy Now buttons use fetch to create checkouts directly, bypassing the cart
    var originalFetch = window.fetch;
    window.fetch = function(url, options) {
      var hash = getStoredFFM();
      var urlString = typeof url === 'string' ? url : (url && url.url) || '';
      
      // Intercept checkout creation endpoints used by Buy Now
      var isCheckoutCreation = hash && urlString && (
        urlString.indexOf('/wallets/checkouts') !== -1 ||
        urlString.indexOf('/checkouts') !== -1 ||
        urlString.indexOf('/cart/create') !== -1 ||
        urlString.indexOf('/checkout') !== -1
      );
      
      if (isCheckoutCreation) {
        console.log('[FFM Tracker] Intercepted checkout creation API call:', urlString);
        
        // First, ensure cart has the FFM attribute (in case cart exists)
        // Then modify the checkout creation payload
        return updateCartAttribute(hash).then(function() {
          // Modify the request body to include FFM
          if (options && options.body) {
            try {
              var body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
              
              // Handle different checkout creation payload formats
              if (body.checkout) {
                // Standard checkout creation format
                body.checkout.note = (body.checkout.note || '') + ' ffm:' + hash;
                if (!body.checkout.customAttributes) {
                  body.checkout.customAttributes = [];
                }
                var existingAttr = body.checkout.customAttributes.find(function(attr) {
                  return attr.key === '_ffm';
                });
                if (!existingAttr) {
                  body.checkout.customAttributes.push({ key: '_ffm', value: hash });
                }
                options.body = JSON.stringify(body);
                console.log('[FFM Tracker] Injected FFM into checkout creation payload');
              } else if (body.items && Array.isArray(body.items)) {
                // Direct checkout creation with items
                body.attributes = body.attributes || {};
                body.attributes._ffm = hash;
                body.note = (body.note || '') + ' ffm:' + hash;
                options.body = JSON.stringify(body);
                console.log('[FFM Tracker] Injected FFM into direct checkout payload');
              } else if (body.cart) {
                // Cart-based checkout
                body.cart.attributes = body.cart.attributes || {};
                body.cart.attributes._ffm = hash;
                body.cart.note = (body.cart.note || '') + ' ffm:' + hash;
                options.body = JSON.stringify(body);
                console.log('[FFM Tracker] Injected FFM into cart checkout payload');
              }
            } catch (e) {
              console.warn('[FFM Tracker] Could not modify checkout body:', e);
            }
          } else {
            // If no body, try to add as query parameter or header
            console.log('[FFM Tracker] No body to modify, FFM should be in cart attributes');
          }
          
          return originalFetch.apply(this, arguments);
        }).catch(function(err) {
          console.warn('[FFM Tracker] Failed to update cart before checkout, proceeding anyway:', err);
          return originalFetch.apply(this, arguments);
        });
      }
      
      return originalFetch.apply(this, arguments);
    };

    // Intercept direct navigation to /checkout
    document.addEventListener('click', function(e) {
      var hash = getStoredFFM();
      if (!hash) return;

      var link = e.target.closest('a');
      if (link && link.href && link.href.indexOf('/checkout') !== -1) {
        e.preventDefault();
        console.log('[FFM Tracker] Intercepted checkout link, updating cart first');
        
        updateCartAttribute(hash).then(function() {
          console.log('[FFM Tracker] Cart updated, redirecting to checkout');
          window.location.href = link.href;
        });
      }
    }, true);

    // Also intercept beforeunload to catch any navigation to checkout
    window.addEventListener('beforeunload', function() {
      var hash = getStoredFFM();
      if (hash && window.location.pathname.indexOf('/checkout') === -1) {
        // Sync update (fire and forget) - cart should already be updated
        // but this is a last resort
        navigator.sendBeacon && navigator.sendBeacon('/cart/update.js', JSON.stringify({
          attributes: { _ffm: hash },
          note: 'ffm:' + hash
        }));
      }
    });
  }

  /**
   * Check if we're on a checkout completion page and clear FFM if so
   */
  function handleCheckoutCompletion() {
    var pathname = window.location.pathname.toLowerCase();
    var isThankYouPage = pathname.indexOf('/thank_you') !== -1 ||
                         pathname.indexOf('/thank-you') !== -1 ||
                         pathname.indexOf('/order') !== -1 ||
                         pathname.indexOf('/checkout/thank_you') !== -1 ||
                         document.querySelector('[data-order-status-page]') !== null ||
                         document.querySelector('.order-status') !== null ||
                         document.querySelector('.thank-you') !== null;

    if (isThankYouPage) {
      console.log('[FFM Tracker] Detected checkout completion page, clearing FFM');
      clearFFM();
    }
  }

  /**
   * Main initialization
   */
  function init() {
    console.log('[FFM Tracker] Initializing...');

    // Check if checkout is completed and clear FFM if so
    handleCheckoutCompletion();

    // Check for FFM in URL
    var urlFFM = getFFMFromURL();
    if (urlFFM) {
      console.log('[FFM Tracker] Found FFM in URL:', urlFFM);
      storeFFM(urlFFM);
      updateCartAttribute(urlFFM);
    } else {
      // Check localStorage for existing FFM (only if not on thank you page)
      var pathname = window.location.pathname.toLowerCase();
      var isThankYouPage = pathname.indexOf('/thank_you') !== -1 ||
                           pathname.indexOf('/thank-you') !== -1 ||
                           pathname.indexOf('/order') !== -1;
      
      if (!isThankYouPage) {
        var storedFFM = getStoredFFM();
        if (storedFFM) {
          console.log('[FFM Tracker] Found stored FFM:', storedFFM);
          updateCartAttribute(storedFFM);
        }
      }
    }

    interceptAddToCart();
    interceptBuyNow();
    console.log('[FFM Tracker] Initialized successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.FFMTracker = {
    getHash: getStoredFFM,
    setHash: function(hash) {
      storeFFM(hash);
      updateCartAttribute(hash);
    },
    clear: clearFFM,
    refresh: init
  };
})();

