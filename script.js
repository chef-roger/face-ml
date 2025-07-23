class FaceLivenessDetector {
    constructor() {
        this.video = document.getElementById('cameraFeed');
        this.viewport = document.getElementById('cameraViewport');
        this.placeholder = document.getElementById('cameraPlaceholder');
        this.statusMessage = document.getElementById('statusMessage');
        this.progressFill = document.getElementById('progressFill');
        this.modal = document.getElementById('resultModal');
        this.startBtn = document.getElementById('startVerification');
        this.retryBtn = document.getElementById('retryVerification');
        
        this.currentStep = 0;
        this.steps = ['camera', 'center', 'left', 'right', 'final'];
        this.stream = null;
        this.isVerifying = false;
        this.verificationTimer = null;
        
        this.init();
    }
    
    init() {
        this.placeholder.addEventListener('click', () => this.requestCameraAccess());
        this.updateUI();
    }
    
    async requestCameraAccess() {
        try {
            this.updateStatus('Requesting camera access...', 10);
            
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: 1280, 
                    height: 720,
                    facingMode: 'user'
                } 
            });
            
            this.video.srcObject = this.stream;
            this.placeholder.classList.add('hidden');
            this.viewport.classList.add('active');
            
            // Show face guide after a moment
            setTimeout(() => {
                const faceGuide = document.querySelector('.face-guide');
                if (faceGuide) faceGuide.classList.add('visible');
            }, 500);
            
            this.updateStatus('Camera ready! Click "Start Verification" to begin', 20);
            this.startBtn.disabled = false;
            this.setActiveStep(1); // Move to center step
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.updateStatus('Camera access denied. Please enable camera permissions.', 0);
            this.showError('Camera access is required for face verification. Please enable camera permissions and try again.');
        }
    }
    
    async startVerification() {
        if (this.isVerifying) return;
        
        if (!this.stream) {
            await this.requestCameraAccess();
            return;
        }
        
        this.isVerifying = true;
        this.startBtn.style.display = 'none';
        this.retryBtn.style.display = 'none';
        
        // Start verification sequence
        await this.runVerificationSequence();
    }
    
    async runVerificationSequence() {
        const steps = [
            { step: 'center', message: 'Look straight at the camera', duration: 3000 },
            { step: 'left', message: 'Slowly turn your head to the left', duration: 3000 },
            { step: 'right', message: 'Now turn your head to the right', duration: 3000 },
            { step: 'final', message: 'Look straight ahead for final verification', duration: 3000 }
        ];
        
        for (let i = 0; i < steps.length; i++) {
            const stepData = steps[i];
            this.setActiveStep(i + 1);
            this.updateStatus(stepData.message, 20 + (i * 20));
            
            // Simulate detection time
            await this.sleep(stepData.duration);
            
            // Mark step as completed
            this.markStepCompleted(i + 1);
        }
        
        // Processing phase
        this.updateStatus('Processing verification...', 90);
        await this.sleep(2000);
        
        // Simulate verification result (80% success rate)
        const isSuccess = Math.random() > 0.2;
        this.completeVerification(isSuccess);
    }
    
    completeVerification(success) {
        this.isVerifying = false;
        this.updateStatus(success ? 'Verification completed successfully!' : 'Verification failed', 100);
        
        if (success) {
            this.viewport.classList.add('success');
            setTimeout(() => this.showSuccess(), 1000);
        } else {
            this.viewport.classList.add('error');
            setTimeout(() => this.showError(), 1000);
        }
    }
    
    setActiveStep(stepIndex) {
        document.querySelectorAll('.instruction-step').forEach((step, index) => {
            step.classList.remove('active');
            if (index === stepIndex) {
                step.classList.add('active');
            }
        });
    }
    
    markStepCompleted(stepIndex) {
        const step = document.querySelectorAll('.instruction-step')[stepIndex];
        if (step) {
            step.classList.remove('active');
            step.classList.add('completed');
        }
    }
    
    updateStatus(message, progress) {
        this.statusMessage.textContent = message;
        this.progressFill.style.width = `${progress}%`;
    }
    
    showSuccess() {
        document.getElementById('successResult').classList.add('active');
        document.getElementById('errorResult').classList.remove('active');
        this.modal.classList.add('visible');
    }
    
    showError(customMessage = null) {
        const errorResult = document.getElementById('errorResult');
        if (customMessage) {
            errorResult.querySelector('p').textContent = customMessage;
        }
        errorResult.classList.add('active');
        document.getElementById('successResult').classList.remove('active');
        this.modal.classList.add('visible');
    }
    
    closeModal() {
        this.modal.classList.remove('visible');
        this.retryBtn.style.display = 'inline-flex';
    }
    
    retryVerification() {
        // Reset UI state
        this.currentStep = 0;
        this.viewport.classList.remove('success', 'error', 'active');
        this.progressFill.style.width = '0%';
        
        // Reset steps
        document.querySelectorAll('.instruction-step').forEach((step, index) => {
            step.classList.remove('active', 'completed');
            if (index === 0) {
                step.classList.add('active');
            }
        });
        
        // Reset buttons
        this.startBtn.style.display = 'inline-flex';
        this.retryBtn.style.display = 'none';
        
        if (this.stream) {
            this.viewport.classList.add('active');
            this.setActiveStep(1);
            this.updateStatus('Ready to start verification', 20);
        } else {
            this.updateStatus('Ready to start verification', 0);
            this.setActiveStep(0);
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateUI() {
        this.updateStatus('Click the camera to enable access', 0);
    }
}

// Global functions for HTML onclick handlers
function startVerification() {
    detector.startVerification();
}

function retryVerification() {
    detector.retryVerification();
}

function closeModal() {
    detector.closeModal();
}

// Initialize the detector when page loads
let detector;
document.addEventListener('DOMContentLoaded', () => {
    detector = new FaceLivenessDetector();
});

// Handle page cleanup
window.addEventListener('beforeunload', () => {
    if (detector && detector.stream) {
        detector.stream.getTracks().forEach(track => track.stop());
    }
});