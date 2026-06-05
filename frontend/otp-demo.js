window.demoOtpState = {};

window.initDemoOtp = function(formId, mobileFieldId) {
  const form = document.getElementById(formId);
  const mobileInput = document.getElementById(mobileFieldId);
  const sendOtpButton = document.getElementById('sendOtpButton');
  const otpRow = document.getElementById('otpRow');
  const otpInput = document.getElementById('otpInput');
  const otpStatus = document.getElementById('otpStatus');

  if (!form || !mobileInput || !sendOtpButton || !otpRow || !otpInput || !otpStatus) {
    return;
  }

  window.demoOtpState[formId] = { sentOtp: '', verified: false, mobile: '' };

  sendOtpButton.addEventListener('click', function() {
    const mobile = mobileInput.value.trim();
    if (!mobile.match(/^\d{10}$/)) {
      alert('ದಯವಿಟ್ಟು ಮಾನ್ಯ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ | Please enter a valid 10-digit mobile number');
      mobileInput.focus();
      return;
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    window.demoOtpState[formId].sentOtp = otp;
    window.demoOtpState[formId].verified = false;
    window.demoOtpState[formId].mobile = mobile;
    otpRow.style.display = 'block';
    otpInput.value = '';
    otpStatus.textContent = 'ಒಟಿಪಿ (ಡೆಮೋ) ಕಳುಹಿಸಲಾಗಿದೆ: ' + otp + ' | Demo OTP sent: ' + otp;
    alert('Demo OTP for ' + mobile + ': ' + otp);
    sendOtpButton.textContent = 'Resend Demo OTP';
  });

  otpInput.addEventListener('input', function() {
    window.demoOtpState[formId].verified = false;
  });
};

window.validateDemoOtp = function(formId) {
  const state = window.demoOtpState[formId];
  if (!state) return true;
  const otpInput = document.getElementById('otpInput');
  const otpStatus = document.getElementById('otpStatus');

  if (!state.sentOtp) {
    alert('ದಯವಿಟ್ಟು ಮೊದಲು ಒಟಿಪಿ ಕಳುಹಿಸಿ | Please send the OTP first');
    return false;
  }

  const enteredOtp = otpInput.value.trim();
  if (enteredOtp.length !== 4) {
    alert('4 ಅಂಕಿಯ ಒಟಿಪಿ ನಮೂದಿಸಿ | Please enter the 4-digit OTP');
    otpInput.focus();
    return false;
  }

  if (enteredOtp !== state.sentOtp) {
    alert('ತಪ್ಪಾದ ಒಟಿಪಿ | Invalid OTP');
    otpStatus.textContent = 'ತಪ್ಪಾದ ಒಟಿಪಿ. ದಯವಿಟ್ಟು ಪುನಃ ಪರೀಕ್ಷಿಸಿ | Invalid OTP. Please try again.';
    otpStatus.style.color = 'red';
    return false;
  }

  state.verified = true;
  otpStatus.textContent = 'ಒಟಿಪಿ ಯಶಸ್ವಿಯಾಗಿ സ്ഥിരീകരಿಸಲಾಗಿದೆ | OTP successfully verified';
  otpStatus.style.color = 'green';
  return true;
};
