import { useState, useEffect, useCallback } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const browserSupportsSpeechRecognition = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Check microphone permissions
  const checkMicrophonePermission = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.permissions) {
      return null;
    }

    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setHasPermission(result.state === 'granted');
      return result.state === 'granted';
    } catch (error) {
      // Permission API not supported or failed
      return null;
    }
  }, []);

  // Request microphone access
  const requestMicrophoneAccess = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Close the stream immediately, we just needed permission
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
      return true;
    } catch (error) {
      setHasPermission(false);
      return false;
    }
  }, []);

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(finalTranscript + interimTranscript);
      setError(null); // Clear any previous errors
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      
      // Handle different types of errors with user-friendly messages
      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone permissions and try again.');
          setHasPermission(false);
          break;
        case 'no-speech':
          setError('No speech detected. Please speak clearly and try again.');
          break;
        case 'audio-capture':
          setError('No microphone found. Please check your microphone connection.');
          break;
        case 'network':
          setError('Network error occurred. Please check your internet connection.');
          break;
        case 'service-not-allowed':
          setError('Speech recognition not available. Please ensure you\'re using HTTPS.');
          break;
        case 'aborted':
          // Don't show error for intentional aborts
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
      
      // Only log errors in development and for debugging
      if (process.env.NODE_ENV === 'development' && event.error !== 'aborted') {
        console.warn('Speech recognition error:', event.error, event.message);
      }
    };

    recognitionInstance.onstart = () => {
      setError(null); // Clear errors when starting
      setIsListening(true);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);

    // Check initial permission state
    checkMicrophonePermission();

    return () => {
      if (recognitionInstance) {
        try {
          recognitionInstance.abort();
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    };
  }, [browserSupportsSpeechRecognition, checkMicrophonePermission]);

  const startListening = useCallback(async () => {
    if (!recognition || isListening) return;

    setTranscript('');
    setError(null);

    // Check if we have permission or can get it
    if (hasPermission === false) {
      const granted = await requestMicrophoneAccess();
      if (!granted) {
        setError('Microphone access is required for speech recognition. Please allow microphone permissions in your browser settings.');
        return;
      }
    } else if (hasPermission === null) {
      // Try to get permission first
      const granted = await requestMicrophoneAccess();
      if (!granted) {
        setError('Microphone access is required for speech recognition. Please allow microphone permissions and try again.');
        return;
      }
    }

    try {
      recognition.start();
    } catch (err) {
      setError('Failed to start speech recognition. Please try again.');
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  }, [recognition, isListening, hasPermission, requestMicrophoneAccess]);

  const stopListening = useCallback(() => {
    if (recognition && isListening) {
      try {
        recognition.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
      setIsListening(false);
    }
  }, [recognition, isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error,
    clearError,
    hasPermission,
    requestMicrophoneAccess,
  };
} 