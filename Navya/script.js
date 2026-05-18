// Tab switching
  function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach((t, i) => {
      t.classList.toggle('active', (i === 0 ? 'login' : 'register') === tab);
    });
    document.querySelectorAll('.form-panel').forEach(p => {
      p.classList.toggle('active', p.id === tab + '-panel');
    });
    if (tab === 'register') goStep(1);
  }

  // Initialize CAPTCHA on page load
  document.addEventListener('DOMContentLoaded', function() {
    generateCaptcha();
  });

  // Country-based Passport toggle
  let selectedCountry = 'India';
  
  function toggleCountryPassport() {
    const countrySelect = document.getElementById('r-country');
    const passportContainer = document.getElementById('passport-container');
    const passportBadge = document.getElementById('passport-badge');
    const isIndia = countrySelect.value === 'India';
    
    selectedCountry = countrySelect.value;
    
    if (isIndia) {
      passportContainer.style.display = 'none';
      passportContainer.classList.remove('passport-visible');
      if (passportBadge) passportBadge.textContent = 'Optional';
    } else {
      passportContainer.style.display = 'block';
      passportContainer.classList.add('passport-visible');
      if (passportBadge) passportBadge.textContent = 'Required';
    }
    
    // Reset upload status when hiding
    if (isIndia) {
      document.getElementById('status-passport').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload';
      document.getElementById('card-passport').classList.remove('uploaded');
      delete uploadedDocs['card-passport'];
    }
  }
  
  function checkPassportRequired() {
    if (selectedCountry !== 'India' && document.getElementById('card-passport').classList.contains('uploaded')) {
      // Mark as satisfied
      document.getElementById('status-passport').style.color = 'var(--sage)';
    }
  }

  // Step 2 validation - passport required for non-India
  function validateStep2() {
    if (selectedCountry !== 'India') {
      const passportUploaded = document.getElementById('card-passport').classList.contains('uploaded');
      if (!passportUploaded) {
        alert('Passport or NRI ID upload is required for non-Indian citizens & NRIs. Please upload.');
        document.getElementById('passport-container').scrollIntoView({ behavior: 'smooth' });
        return false;
      }
    }
    return true;
  }

  // Smooth transition for passport container
  const style = document.createElement('style');
  style.textContent = `
    #passport-container {
      transition: all 0.3s ease;
      overflow: hidden;
    }
    #passport-container.passport-visible {
      opacity: 1;
      max-height: 200px;
    }
  `;
  document.head.appendChild(style);

  // Multi-step registration
  function goStep(n) {
    if (n !== 1) stopLiveGPS();
    document.getElementById('reg-step-1').style.display = n === 1 ? '' : 'none';
    document.getElementById('reg-step-2').style.display = n === 2 ? '' : 'none';
    document.getElementById('reg-step-3').style.display = n === 3 ? '' : 'none';
    if (n === 1) initLiveGPS();
    if (n === 2) toggleCountryPassport();  // Auto-toggle passport on step 2
    if (n === 3) populateReview();
  }

  // Live GPS Location
  let gpsWatchId = null;

  function initLiveGPS() {
    const gpsSection = document.getElementById('live-gps-section');
    if (!gpsSection) return;
    
    // Show loading
    document.getElementById('gps-loading').style.display = 'flex';
    document.getElementById('gps-display').style.display = 'none';
    document.getElementById('gps-error').style.display = 'none';
    
    if (!navigator.geolocation) {
      handleGPSError({code: 2, message: 'Geolocation not supported'});
      return;
    }
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
      handleGPSPosition,
      handleGPSError,
      { enableHighAccuracy: true, maximumAge: 5 * 60 * 1000 } // 5min cache
    );
    
    // Watch for live updates (no timeout)
    gpsWatchId = navigator.geolocation.watchPosition(
      handleGPSPosition,
      (error) => { /* Silent fail for watch - keep last location */ },
      { enableHighAccuracy: true, maximumAge: 30 * 1000 } // 30s cache
    );
  }

  function handleGPSPosition(position) {
    const { latitude, longitude } = position.coords;
    
    // Update coords display
    document.getElementById('gps-coords').textContent = 
      `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
    
    // Reverse geocode
    reverseGeocode(latitude, longitude);
    
    // Update timestamp
    const now = new Date();
    document.getElementById('gps-updated').textContent = 
      `Updated ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    
    // Show display, hide loading
    document.getElementById('gps-loading').style.display = 'none';
    document.getElementById('gps-display').style.display = 'block';
    document.getElementById('gps-error').style.display = 'none';
  }

  function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    
    fetch(url)
      .then(response => response.json())
      .then(data => {
        if (data && data.display_name) {
          document.getElementById('gps-address').textContent = data.display_name;
        } else {
          document.getElementById('gps-address').textContent = 'Address unavailable';
        }
      })
      .catch(() => {
        document.getElementById('gps-address').textContent = 'Reverse geocoding failed';
      });
  }

  function handleGPSError(error) {
    document.getElementById('gps-loading').style.display = 'none';
    const errorEl = document.getElementById('gps-error');
    errorEl.style.display = 'block';
    
    if (error.code === error.PERMISSION_DENIED) {
      errorEl.textContent = 'Location access denied';
    } else {
      // Hide non-critical errors, keep last known location visible
      errorEl.style.display = 'none';
    }
  }

  // Cleanup on step change
  function stopLiveGPS() {
    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
    }
  }

  // Document upload state
  const uploadedDocs = {};

  function markUploaded(cardId, statusId, input) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const card = document.getElementById(cardId);
    const status = document.getElementById(statusId);
    card.classList.add('uploaded');
    status.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> ${file.name.length > 14 ? file.name.substring(0,12)+'…' : file.name}`;
    uploadedDocs[cardId] = file.name;
  }

  function previewProfilePhoto(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Profile photo must be less than 2MB');
      input.value = '';
      return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const preview = document.getElementById('profile-preview');
      preview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  // Review step
  const docLabels = {
    'card-aadhaar':   '🪪 Aadhaar Card',
    'card-pan':       '💳 PAN Card',
    'card-passport':  '📘 Passport',
    'card-utility':   '🧾 Utility Bill',
    'card-voterid':   '🗳️ Voter ID',
    'card-salary':    '💼 Salary Slips',
    'card-bank':      '🏦 Bank Statement',
    'card-itr':       '📄 ITR / Form 16',
    'card-empid':     '🏢 Employee ID / Offer Letter',
    'card-police':    '🚔 Police Verification Form',
    'card-noc':       '📃 Previous Landlord NOC',
    'card-agreement': '📝 Signed Rent Agreement',
    
  };

  function populateReview() {
    const fname = document.getElementById('r-fname')?.value || '—';
    const lname = document.getElementById('r-lname')?.value || '—';
    const email = document.getElementById('r-email')?.value || '—';
    const phone = document.getElementById('r-phone')?.value || '—';
    document.getElementById('review-name').textContent = `${fname} ${lname}`.trim() || '—';
    document.getElementById('review-email').textContent = email;
    document.getElementById('review-phone').textContent = phone;

    const docsEl = document.getElementById('review-docs');
    const keys = Object.keys(uploadedDocs);
    if (keys.length === 0) {
      docsEl.innerHTML = `<span style="color:var(--warm-gray);font-size:13px;">No documents uploaded yet.</span>`;
    } else {
      docsEl.innerHTML = keys.map(k =>
        `<div style="display:flex;justify-content:space-between;align-items:center;">
          <span>${docLabels[k] || k}</span>
          <span style="color:var(--sage);font-size:12px;font-weight:600;">✓ Uploaded</span>
        </div>`
      ).join('');
    }
  }

  // Password toggle
  function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
  }

  // Validation functions
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function isValidPhone(phone) {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }

  function validateLoginInput() {
    const input = document.getElementById('login-email');
    const error = document.getElementById('login-error');
    const value = input.value.trim();
    
    if (value === '') {
      error.style.display = 'none';
      input.style.borderColor = '';
      return false;
    }
    
    const isValid = isValidEmail(value) || isValidPhone(value);
    
    if (isValid) {
      error.style.display = 'none';
      input.style.borderColor = 'var(--sage)';
      return true;
    } else {
      error.style.display = 'block';
      input.style.borderColor = 'var(--rust)';
      return false;
    }
  }

  // Register email validation
  function validateRegisterEmail() {
    const input = document.getElementById('r-email');
    const error = document.getElementById('r-email-error');
    const value = input.value.trim();
    
    if (value === '') {
      error.style.display = 'none';
      input.style.borderColor = '';
      return false;
    }
    
    if (isValidEmail(value)) {
      error.style.display = 'none';
      input.style.borderColor = 'var(--sage)';
      return true;
    } else {
      error.style.display = 'block';
      input.style.borderColor = 'var(--rust)';
      return false;
    }
  }

  // Register phone validation
  function validateRegisterPhone() {
    const input = document.getElementById('r-phone');
    const error = document.getElementById('r-phone-error');
    const value = input.value.trim();
    
    if (value === '') {
      error.style.display = 'none';
      input.style.borderColor = '';
      return false;
    }
    
    if (isValidPhone(value)) {
      error.style.display = 'none';
      input.style.borderColor = 'var(--sage)';
      return true;
    } else {
      error.style.display = 'block';
      input.style.borderColor = 'var(--rust)';
      return false;
    }
  }

  // Validate all fields in step 1
  function validateStep1() {
    const emailValid = validateRegisterEmail();
    const phoneValid = validateRegisterPhone();
    
    // Check if fields are empty
    const email = document.getElementById('r-email').value.trim();
    const phone = document.getElementById('r-phone').value.trim();
    
    if (!email) {
      const error = document.getElementById('r-email-error');
      error.textContent = 'Email address is required';
      error.style.display = 'block';
      document.getElementById('r-email').style.borderColor = 'var(--rust)';
    }
    
    if (!phone) {
      const error = document.getElementById('r-phone-error');
      error.textContent = 'Phone number is required';
      error.style.display = 'block';
      document.getElementById('r-phone').style.borderColor = 'var(--rust)';
    }
    
    return emailValid && phoneValid && email && phone;
  }

  // OTP variables for registration
  let emailOTP = '';
  let phoneOTP = '';
  let emailOTPTimerInterval;
  let phoneOTPTimerInterval;
  let emailOTPTimeLeft = 60;
  let phoneOTPTimeLeft = 60;
  let emailVerified = false;
  let phoneVerified = false;

  // Send OTP for email verification
  function sendEmailOTP() {
    const email = document.getElementById('r-email').value.trim();
    const error = document.getElementById('r-email-error');
    
    if (!email) {
      error.textContent = 'Email address is required';
      error.style.display = 'block';
      document.getElementById('r-email').style.borderColor = 'var(--rust)';
      return;
    }
    
    if (!isValidEmail(email)) {
      error.textContent = 'Please enter a valid email address';
      error.style.display = 'block';
      document.getElementById('r-email').style.borderColor = 'var(--rust)';
      return;
    }
    
    error.style.display = 'none';
    
    // Generate 6-digit OTP
    emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, send via Email API
    console.log('Email OTP:', emailOTP);
    alert(`Your Email OTP is: ${emailOTP}\n\n(In production, this would be sent via Email)`);
    
    // Show OTP section
    document.getElementById('email-otp-section').style.display = 'block';
    
    // Start timer
    startEmailOTPTimer();
    
    // Focus first OTP input with a slight delay to ensure rendering
    setTimeout(() => {
      const firstInput = document.getElementById('email-otp1');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  // Send OTP for phone verification
  function sendPhoneOTP() {
    const phone = document.getElementById('r-phone').value.trim();
    const error = document.getElementById('r-phone-error');
    
    if (!phone) {
      error.textContent = 'Phone number is required';
      error.style.display = 'block';
      document.getElementById('r-phone').style.borderColor = 'var(--rust)';
      return;
    }
    
    if (!isValidPhone(phone)) {
      error.textContent = 'Please enter a valid 10-digit phone number';
      error.style.display = 'block';
      document.getElementById('r-phone').style.borderColor = 'var(--rust)';
      return;
    }
    
    error.style.display = 'none';
    
    // Generate 6-digit OTP
    phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, send via SMS API
    console.log('Phone OTP:', phoneOTP);
    alert(`Your Phone OTP is: ${phoneOTP}\n\n(In production, this would be sent via SMS)`);
    
    // Show OTP section
    document.getElementById('phone-otp-section').style.display = 'block';
    
    // Start timer
    startPhoneOTPTimer();
    
    // Focus first OTP input with a slight delay to ensure rendering
    setTimeout(() => {
      const firstInput = document.getElementById('phone-otp1');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  // Handle email OTP input
  function handleEmailOTPInput(input, position) {
    input.value = input.value.replace(/[^0-9]/g, '');
    
    if (input.value.length === 1 && position < 6) {
      setTimeout(() => {
        document.getElementById('email-otp' + (position + 1)).focus();
      }, 0);
    }
    
    checkEmailOTPComplete();
  }

  // Handle email OTP keydown
  function handleEmailOTPKeydown(event, position) {
    // Allow only numbers and control keys
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const isNumber = /^[0-9]$/.test(event.key);
    if (!isNumber && !allowedKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace') {
      if (position > 1) {
        const currentInput = document.getElementById('email-otp' + position);
        if (currentInput.value === '') {
          event.preventDefault();
          const prevInput = document.getElementById('email-otp' + (position - 1));
          if (prevInput) {
            prevInput.focus();
          }
        }
      }
    }
  }

  // Handle phone OTP input
  function handlePhoneOTPInput(input, position) {
    input.value = input.value.replace(/[^0-9]/g, '');
    
    if (input.value.length === 1 && position < 6) {
      setTimeout(() => {
        document.getElementById('phone-otp' + (position + 1)).focus();
      }, 0);
    }
    
    checkPhoneOTPComplete();
  }

  // Handle phone OTP keydown
  function handlePhoneOTPKeydown(event, position) {
    // Allow only numbers and control keys
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const isNumber = /^[0-9]$/.test(event.key);
    if (!isNumber && !allowedKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace') {
      if (position > 1) {
        const currentInput = document.getElementById('phone-otp' + position);
        if (currentInput.value === '') {
          event.preventDefault();
          const prevInput = document.getElementById('phone-otp' + (position - 1));
          if (prevInput) {
            prevInput.focus();
          }
        }
      }
    }
  }

  // Check if email OTP is complete
  function checkEmailOTPComplete() {
    let otp = '';
    for (let i = 1; i <= 6; i++) {
      otp += document.getElementById('email-otp' + i).value;
    }
    
    if (otp.length === 6) {
      verifyEmailOTP();
    }
  }

  // Check if phone OTP is complete
  function checkPhoneOTPComplete() {
    let otp = '';
    for (let i = 1; i <= 6; i++) {
      otp += document.getElementById('phone-otp' + i).value;
    }
    
    if (otp.length === 6) {
      verifyPhoneOTP();
    }
  }

  // Verify email OTP
  function verifyEmailOTP() {
    let enteredOTP = '';
    for (let i = 1; i <= 6; i++) {
      enteredOTP += document.getElementById('email-otp' + i).value;
    }
    
    const otpError = document.getElementById('email-otp-error');
    
    if (enteredOTP.length !== 6) {
      otpError.textContent = 'Please enter all 6 digits';
      otpError.style.display = 'block';
      return;
    }
    
    if (enteredOTP === emailOTP) {
      // Stop timer BEFORE replacing innerHTML to avoid null reference errors
      clearInterval(emailOTPTimerInterval);
      emailOTPTimerInterval = null;
      emailVerified = true;
      
      // Success - show message
      document.getElementById('email-otp-section').innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; padding:12px; background:rgba(107,143,113,0.1); border-radius:10px; border:1.5px solid var(--sage);">
          <span style="font-size:20px;">✓</span>
          <span style="font-size:14px; color:var(--sage); font-weight:600;">Email verified successfully!</span>
        </div>`;
    } else {
      otpError.textContent = 'Invalid OTP. Please try again.';
      otpError.style.display = 'block';
      
      // Clear OTP inputs
      for (let i = 1; i <= 6; i++) {
        document.getElementById('email-otp' + i).value = '';
      }
      document.getElementById('email-otp1').focus();
    }
  }

  // Verify phone OTP
  function verifyPhoneOTP() {
    let enteredOTP = '';
    for (let i = 1; i <= 6; i++) {
      enteredOTP += document.getElementById('phone-otp' + i).value;
    }
    
    const otpError = document.getElementById('phone-otp-error');
    
    if (enteredOTP.length !== 6) {
      otpError.textContent = 'Please enter all 6 digits';
      otpError.style.display = 'block';
      return;
    }
    
    if (enteredOTP === phoneOTP) {
      // Stop timer BEFORE replacing innerHTML to avoid null reference errors
      clearInterval(phoneOTPTimerInterval);
      phoneOTPTimerInterval = null;
      phoneVerified = true;
      
      // Success - show message
      document.getElementById('phone-otp-section').innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; padding:12px; background:rgba(107,143,113,0.1); border-radius:10px; border:1.5px solid var(--sage);">
          <span style="font-size:20px;">✓</span>
          <span style="font-size:14px; color:var(--sage); font-weight:600;">Phone verified successfully!</span>
        </div>`;
    } else {
      otpError.textContent = 'Invalid OTP. Please try again.';
      otpError.style.display = 'block';
      
      // Clear OTP inputs
      for (let i = 1; i <= 6; i++) {
        document.getElementById('phone-otp' + i).value = '';
      }
      document.getElementById('phone-otp1').focus();
    }
  }

  // Start email OTP timer
  function startEmailOTPTimer() {
    emailOTPTimeLeft = 60;
    updateEmailOTPTimerDisplay();
    
    emailOTPTimerInterval = setInterval(() => {
      emailOTPTimeLeft--;
      updateEmailOTPTimerDisplay();
      
      if (emailOTPTimeLeft <= 0) {
        clearInterval(emailOTPTimerInterval);
        document.getElementById('email-otp-timer').innerHTML =
          'OTP expired. <a href="#" onclick="resendEmailOTP(); return false;" style="color:var(--rust);">Resend</a>';
      }
    }, 1000);
  }

  // Start phone OTP timer
  function startPhoneOTPTimer() {
    phoneOTPTimeLeft = 60;
    updatePhoneOTPTimerDisplay();
    
    phoneOTPTimerInterval = setInterval(() => {
      phoneOTPTimeLeft--;
      updatePhoneOTPTimerDisplay();
      
      if (phoneOTPTimeLeft <= 0) {
        clearInterval(phoneOTPTimerInterval);
        document.getElementById('phone-otp-timer').innerHTML =
          'OTP expired. <a href="#" onclick="resendPhoneOTP(); return false;" style="color:var(--rust);">Resend</a>';
      }
    }, 1000);
  }

  // Update email OTP timer display
  function updateEmailOTPTimerDisplay() {
    const timerEl = document.getElementById('email-otp-timer');
    if (!timerEl) { clearInterval(emailOTPTimerInterval); return; }
    const minutes = Math.floor(emailOTPTimeLeft / 60);
    const seconds = emailOTPTimeLeft % 60;
    timerEl.textContent =
      `OTP expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Update phone OTP timer display
  function updatePhoneOTPTimerDisplay() {
    const timerEl = document.getElementById('phone-otp-timer');
    if (!timerEl) { clearInterval(phoneOTPTimerInterval); return; }
    const minutes = Math.floor(phoneOTPTimeLeft / 60);
    const seconds = phoneOTPTimeLeft % 60;
    timerEl.textContent =
      `OTP expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Resend email OTP
  function resendEmailOTP() {
    clearInterval(emailOTPTimerInterval);
    
    emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('New Email OTP:', emailOTP);
    alert(`Your new Email OTP is: ${emailOTP}\n\n(In production, this would be sent via Email)`);
    
    // Clear OTP inputs
    for (let i = 1; i <= 6; i++) {
      document.getElementById('email-otp' + i).value = '';
    }
    document.getElementById('email-otp1').focus();
    
    // Restart timer
    startEmailOTPTimer();
    
    // Hide error
    document.getElementById('email-otp-error').style.display = 'none';
  }

  // Resend phone OTP
  function resendPhoneOTP() {
    clearInterval(phoneOTPTimerInterval);
    
    phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('New Phone OTP:', phoneOTP);
    alert(`Your new Phone OTP is: ${phoneOTP}\n\n(In production, this would be sent via SMS)`);
    
    // Clear OTP inputs
    for (let i = 1; i <= 6; i++) {
      document.getElementById('phone-otp' + i).value = '';
    }
    document.getElementById('phone-otp1').focus();
    
    // Restart timer
    startPhoneOTPTimer();
    
    // Hide error
    document.getElementById('phone-otp-error').style.display = 'none';
  }

  // CAPTCHA variables
  let captchaFishCount = 0;
  let captchaVerified = false;

  // Generate CAPTCHA with fish images
  function generateCaptcha() {
    const captchaImage = document.getElementById('captcha-image');
    const captchaAnswer = document.getElementById('captcha-answer');
    const captchaError = document.getElementById('captcha-error');
    const captchaSuccess = document.getElementById('captcha-success');
    
    // Reset state
    captchaAnswer.value = '';
    captchaError.style.display = 'none';
    captchaSuccess.style.display = 'none';
    captchaVerified = false;
    
    // Generate random number of fish (3-12)
    captchaFishCount = Math.floor(Math.random() * 10) + 3;
    
    // Clear previous content
    captchaImage.innerHTML = '';
    
    // Fish SVG template
    const fishSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px; height:32px;">
      <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.46-3.44 6-7 6-3.56 0-7.56-2.54-8.5-6Z"/>
      <path d="M18 12v.5"/>
      <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86"/>
      <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.23 5 .23 6.5C6.11 17.03 7 15 7 12.33"/>
      <path d="M10.46 7.26C10.6 5.88 12.13 4 14.43 4c.96 0 1.84.32 2.57.87"/>
      <path d="M10.46 16.74c.14 1.38 1.67 3.26 3.97 3.26.96 0 1.84-.32 2.57-.87"/>
    </svg>`;
    
    // Add fish images with random positions and rotations
    for (let i = 0; i < captchaFishCount; i++) {
      const fish = document.createElement('div');
      fish.innerHTML = fishSVG;
      fish.style.position = 'absolute';
      fish.style.left = `${Math.random() * 80 + 5}%`;
      fish.style.top = `${Math.random() * 70 + 10}%`;
      fish.style.transform = `rotate(${Math.random() * 60 - 30}deg)`;
      fish.style.color = `hsl(${Math.random() * 60 + 180}, 70%, 50%)`;
      fish.style.opacity = '0.9';
      captchaImage.appendChild(fish);
    }
    
    // Add some random bubbles for visual complexity
    for (let i = 0; i < 8; i++) {
      const bubble = document.createElement('div');
      bubble.style.position = 'absolute';
      bubble.style.left = `${Math.random() * 90 + 5}%`;
      bubble.style.top = `${Math.random() * 80 + 10}%`;
      bubble.style.width = `${Math.random() * 8 + 4}px`;
      bubble.style.height = bubble.style.width;
      bubble.style.borderRadius = '50%';
      bubble.style.background = 'rgba(255,255,255,0.6)';
      captchaImage.appendChild(bubble);
    }
  }

  // Validate CAPTCHA
  function validateCaptcha() {
    const captchaAnswer = document.getElementById('captcha-answer');
    const captchaError = document.getElementById('captcha-error');
    const captchaSuccess = document.getElementById('captcha-success');
    
    if (captchaVerified) {
      return true;
    }
    
    const userAnswer = parseInt(captchaAnswer.value);
    
    if (isNaN(userAnswer)) {
      captchaError.textContent = 'Please enter a number';
      captchaError.style.display = 'block';
      captchaSuccess.style.display = 'none';
      return false;
    }
    
    if (userAnswer === captchaFishCount) {
      captchaError.style.display = 'none';
      captchaSuccess.style.display = 'block';
      captchaVerified = true;
      return true;
    } else {
      captchaError.textContent = 'Incorrect count. Please try again.';
      captchaError.style.display = 'block';
      captchaSuccess.style.display = 'none';
      generateCaptcha();
      return false;
    }
  }

  // Login submit
  function handleLogin() {
    const email = document.getElementById('login-email').value;
    const error = document.getElementById('login-error');
    
    if (!email) {
      error.textContent = 'Please enter your email or phone number';
      error.style.display = 'block';
      document.getElementById('login-email').style.borderColor = 'var(--rust)';
      return;
    }
    
    if (!isValidEmail(email) && !isValidPhone(email)) {
      error.textContent = 'Please enter a valid email or 10-digit phone number';
      error.style.display = 'block';
      document.getElementById('login-email').style.borderColor = 'var(--rust)';
      return;
    }
    
    error.style.display = 'none';
    const btn = event.target.closest('.btn-primary');
    btn.innerHTML = '✓ Signing in…';
    btn.style.background = 'var(--sage)';
    setTimeout(() => {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign In to RentLocally`;
      btn.style.background = '';
    }, 2000);
  }

  // OTP variables
  let loginOTP = '';
  let otpTimerInterval;
  let otpTimeLeft = 60;

  // Unified OTP beforeinput handler - blocks non-digit input at source
  function handleOTPBeforeInput(event) {
    const input = event.target;
    const inputType = input.getAttribute('type');
    
    // Only handle text/tel inputs
    if (inputType !== 'text' && inputType !== 'tel') return;
    
    // Check what's being inserted
    const data = event.data;
    
    // If data is null (e.g., paste), allow and let oninput sanitize
    if (data === null) return;
    
    // Block if any non-digit character is being inserted
    if (!/^[0-9]$/.test(data)) {
      event.preventDefault();
      return;
    }
    
    // Also block if the resulting value would exceed maxlength
    const maxLength = parseInt(input.maxLength) || 1;
    if (input.value.length >= maxLength) {
      event.preventDefault();
      return;
    }
  }

  // Send OTP for login
  function sendLoginOTP() {
    const email = document.getElementById('login-email').value;
    const error = document.getElementById('login-error');
    
    if (!email) {
      error.textContent = 'Please enter your email or phone number';
      error.style.display = 'block';
      document.getElementById('login-email').style.borderColor = 'var(--rust)';
      return;
    }
    
    if (!isValidEmail(email) && !isValidPhone(email)) {
      error.textContent = 'Please enter a valid email or 10-digit phone number';
      error.style.display = 'block';
      document.getElementById('login-email').style.borderColor = 'var(--rust)';
      return;
    }
    
    error.style.display = 'none';
    
    // Generate 6-digit OTP
    loginOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, send via SMS/Email API
    console.log('Login OTP:', loginOTP);
    alert(`Your OTP is: ${loginOTP}\n\n(In production, this would be sent via SMS/Email)`);
    
    // Show OTP section
    document.getElementById('otp-section').style.display = 'block';
    document.getElementById('otp-sent-to').textContent = email;
    document.getElementById('send-otp-btn').style.display = 'none';
    
    // Start timer
    startOTPTimer();
    
    // Focus first OTP input with a slight delay to ensure rendering
    setTimeout(() => {
      const firstInput = document.getElementById('otp1');
      if (firstInput) firstInput.focus();
    }, 50);
  }

  // Handle OTP input
  function handleOTPInput(input, position) {
    // Only allow numbers
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Move to next input if a digit was entered
    if (input.value.length === 1 && position < 6) {
      setTimeout(() => {
        const nextInput = document.getElementById('otp' + (position + 1));
        if (nextInput) {
          nextInput.focus();
        }
      }, 0);
    }
    
    checkLoginOTPComplete();
  }

  // Handle OTP keydown
  function handleOTPKeydown(event, position) {
    // Allow only numbers and control keys
    const allowedKeys = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    const isNumber = /^[0-9]$/.test(event.key);
    if (!isNumber && !allowedKeys.includes(event.key)) {
      event.preventDefault();
      return;
    }

    if (event.key === 'Backspace') {
      if (position > 1) {
        const currentInput = document.getElementById('otp' + position);
        if (currentInput.value === '') {
          event.preventDefault();
          const prevInput = document.getElementById('otp' + (position - 1));
          if (prevInput) {
            prevInput.focus();
          }
        }
      }
    }
  }

  // Check if OTP is complete
  function checkLoginOTPComplete() {
    let otp = '';
    for (let i = 1; i <= 6; i++) {
      otp += document.getElementById('otp' + i).value;
    }
    
    if (otp.length === 6) {
      verifyLoginOTP();
    }
  }

  // Verify OTP
  function verifyLoginOTP() {
    let enteredOTP = '';
    for (let i = 1; i <= 6; i++) {
      enteredOTP += document.getElementById('otp' + i).value;
    }
    
    const otpError = document.getElementById('otp-error');
    
    if (enteredOTP.length !== 6) {
      otpError.textContent = 'Please enter all 6 digits';
      otpError.style.display = 'block';
      return;
    }
    
    if (enteredOTP === loginOTP) {
      otpError.style.display = 'none';
      clearInterval(otpTimerInterval);
      
      // Success - show message and redirect
      const btn = event.target.closest('.btn-primary');
      btn.innerHTML = '✓ Verified! Signing in…';
      btn.style.background = 'var(--sage)';
      
      setTimeout(() => {
        alert('Login successful! Redirecting to dashboard...');
        // In production, redirect to dashboard
      }, 1500);
    } else {
      otpError.textContent = 'Invalid OTP. Please try again.';
      otpError.style.display = 'block';
      
      // Clear OTP inputs
      for (let i = 1; i <= 6; i++) {
        document.getElementById('otp' + i).value = '';
      }
      document.getElementById('otp1').focus();
    }
  }

  // Start OTP timer
  function startOTPTimer() {
    otpTimeLeft = 60;
    updateOTPTimerDisplay();
    
    otpTimerInterval = setInterval(() => {
      otpTimeLeft--;
      updateOTPTimerDisplay();
      
      if (otpTimeLeft <= 0) {
        clearInterval(otpTimerInterval);
        document.getElementById('otp-timer').innerHTML =
          'OTP expired. <a href="#" onclick="resendLoginOTP(); return false;" style="color:var(--rust);">Resend</a>';
      }
    }, 1000);
  }

  // Update OTP timer display
  function updateOTPTimerDisplay() {
    const minutes = Math.floor(otpTimeLeft / 60);
    const seconds = otpTimeLeft % 60;
    document.getElementById('otp-timer').textContent =
      `OTP expires in ${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Resend OTP
  function resendLoginOTP() {
    clearInterval(otpTimerInterval);
    
    loginOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    console.log('New Login OTP:', loginOTP);
    alert(`Your new OTP is: ${loginOTP}\n\n(In production, this would be sent via SMS/Email)`);
    
    // Clear OTP inputs
    for (let i = 1; i <= 6; i++) {
      document.getElementById('otp' + i).value = '';
    }
    document.getElementById('otp1').focus();
    
    // Restart timer
    startOTPTimer();
    
    // Hide error
    document.getElementById('otp-error').style.display = 'none';
  }

  // Photo preview function
  function previewPhoto(input) {
    const preview = document.getElementById('photo-preview');
    const file = input.files[0];
    
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        input.value = '';
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        input.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onload = function(e) {
        preview.innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
      };
      reader.readAsDataURL(file);
    }
  }

  // Register submit
  function handleRegister() {
    const agreed = document.getElementById('agree-terms').checked;
    if (!agreed) { alert('Please agree to the Terms & Privacy Policy.'); return; }
    const btn = event.target.closest('.btn-primary');
    btn.innerHTML = '✓ Creating account…';
    btn.style.background = 'var(--sage)';
    setTimeout(() => {
      document.getElementById('reg-step-3').innerHTML = `
        <div style="text-align:center;padding:32px 0;">
          <div style="width:72px;height:72px;background:rgba(107,143,113,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:32px;">✓</div>
          <h2 style="font-family:'Playfair Display',serif;font-size:24px;color:var(--ink);margin-bottom:10px;">You're all set!</h2>
          <p style="font-size:14px;color:var(--warm-gray);line-height:1.7;max-width:300px;margin:0 auto 24px;">Your account is under review. We'll verify your documents within 24 hours and email you once approved.</p>
          <button class="btn-primary" style="max-width:220px;margin:0 auto;" onclick="switchTab('login')">Go to Sign In</button>
        </div>`;
    }, 2000);
  }