import { ABDMResponse, PatientProfile } from '../types/kiosk';

// Configurable Demo Mode (defaults to true for frontend kiosk standalone evaluation)
export const DEMO_MODE: boolean = import.meta.env.VITE_DEMO_MODE !== 'false';

// Backend Proxy URL (configured when MediKiosk backend server is deployed)
const BACKEND_BASE_URL: string = import.meta.env.VITE_BACKEND_URL || '/api/abdm';

/**
 * Mock patient profiles for realistic hospital kiosk demo
 */
const MOCK_PATIENTS: Record<string, PatientProfile> = {
  default: {
    status: 1,
    firstName: "Aarav",
    lastName: "Sharma",
    phone: "******1234",
    abhaId: "91-8492-3847-1923",
    department: "General Medicine (OPD)",
    tokenNumber: "OPD-A42",
    queuePosition: 3,
    slotTime: "11:30 AM",
    gender: "Male",
    age: 38
  },
  registered: {
    status: 1,
    firstName: "Sunita",
    lastName: "Patel",
    phone: "******5678",
    abhaId: "91-5829-4710-8472",
    department: "Pediatrics & Family Care",
    tokenNumber: "OPD-P19",
    queuePosition: 2,
    slotTime: "11:45 AM",
    gender: "Female",
    age: 29
  }
};

class ABDMService {
  /**
   * Login using ABHA QR Code scanner payload
   */
  async loginWithABHA(abhaIdOrQRData: string): Promise<ABDMResponse> {
    if (DEMO_MODE) {
      await this.simulateNetworkDelay(600);
      return {
        status: 1,
        message: "ABHA profile authenticated successfully",
        patient: {
          ...MOCK_PATIENTS.default,
          abhaId: abhaIdOrQRData.includes('@') ? abhaIdOrQRData : "91-8492-3847-1923"
        }
      };
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/login/abha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: abhaIdOrQRData }),
      });
      return await response.json();
    } catch (error) {
      console.error('ABDM Service Error: loginWithABHA', error);
      return { status: 0, message: "Network connection to hospital server failed" };
    }
  }

  /**
   * Initiate login with Mobile Number (triggers OTP generation)
   */
  async loginWithPhone(phoneNumber: string): Promise<ABDMResponse> {
    if (DEMO_MODE) {
      await this.simulateNetworkDelay(500);
      return {
        status: 1,
        message: `OTP sent successfully to +91 ${phoneNumber}`,
        patient: {
          ...MOCK_PATIENTS.default,
          phone: `******${phoneNumber.slice(-4) || '1234'}`
        }
      };
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/login/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      return await response.json();
    } catch (error) {
      console.error('ABDM Service Error: loginWithPhone', error);
      return { status: 0, message: "Failed to dispatch OTP" };
    }
  }

  /**
   * Register with existing ABHA ID
   */
  async registerWithABHA(abhaId: string): Promise<ABDMResponse> {
    if (DEMO_MODE) {
      await this.simulateNetworkDelay(600);
      return {
        status: 1,
        message: "ABHA ID validated. OTP dispatched to registered mobile.",
        patient: {
          ...MOCK_PATIENTS.registered,
          abhaId
        }
      };
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/register/abha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abhaId }),
      });
      return await response.json();
    } catch (error) {
      console.error('ABDM Service Error: registerWithABHA', error);
      return { status: 0, message: "Registration service error" };
    }
  }

  /**
   * Register with Mobile Number
   */
  async registerWithPhone(phoneNumber: string): Promise<ABDMResponse> {
    if (DEMO_MODE) {
      await this.simulateNetworkDelay(500);
      return {
        status: 1,
        message: `OTP generated for new registration to +91 ${phoneNumber}`,
        patient: {
          ...MOCK_PATIENTS.registered,
          phone: `******${phoneNumber.slice(-4) || '5678'}`
        }
      };
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/register/phone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      return await response.json();
    } catch (error) {
      console.error('ABDM Service Error: registerWithPhone', error);
      return { status: 0, message: "Registration service error" };
    }
  }

  /**
   * Verify 6-digit OTP
   */
  async verifyOTP(phoneOrAbha: string, otp: string): Promise<ABDMResponse> {
    if (DEMO_MODE) {
      await this.simulateNetworkDelay(800);
      
      // In demo mode: accept any 6 digits (or '123456' as standard)
      if (otp.length === 6) {
        return {
          status: 1,
          message: "Verification successful",
          patient: {
            status: 1,
            firstName: "Aarav",
            lastName: "Sharma",
            phone: phoneOrAbha.startsWith('+91') ? phoneOrAbha : `******${phoneOrAbha.slice(-4) || '1234'}`,
            abhaId: "91-8492-3847-1923",
            department: "General Medicine (OPD)",
            tokenNumber: "OPD-A42",
            queuePosition: 3,
            slotTime: "11:30 AM",
            gender: "Male",
            age: 38
          }
        };
      } else {
        return {
          status: 0,
          message: "Invalid OTP code entered"
        };
      }
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phoneOrAbha, otp }),
      });
      return await response.json();
    } catch (error) {
      console.error('ABDM Service Error: verifyOTP', error);
      return { status: 0, message: "Verification failed. Check your network." };
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(phoneOrAbha: string): Promise<ABDMResponse> {
    if (DEMO_MODE) {
      await this.simulateNetworkDelay(400);
      return {
        status: 1,
        message: "New OTP code sent to your mobile"
      };
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: phoneOrAbha }),
      });
      return await response.json();
    } catch (error) {
      console.error('ABDM Service Error: resendOTP', error);
      return { status: 0, message: "Could not resend OTP at this time" };
    }
  }

  private simulateNetworkDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const abdmService = new ABDMService();
