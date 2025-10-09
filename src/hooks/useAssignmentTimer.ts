import { useState, useEffect, useCallback, useRef } from 'react';

interface UseAssignmentTimerOptions {
  assignmentId: string;
  timerMinutes: number | null;
  onTimeUp: () => void;
  autoStart?: boolean;
}

export const useAssignmentTimer = ({
  assignmentId,
  timerMinutes,
  onTimeUp,
  autoStart = false,
}: UseAssignmentTimerOptions) => {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const STORAGE_KEY = `assignment_timer_${assignmentId}`;

  // Load saved timer state from localStorage
  useEffect(() => {
    if (!timerMinutes) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { startTime, remaining } = JSON.parse(saved);
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const newRemaining = Math.max(0, remaining - elapsed);
        
        if (newRemaining > 0) {
          setTimeRemaining(newRemaining);
          startTimeRef.current = startTime;
          if (autoStart) {
            setIsRunning(true);
          }
        } else {
          // Timer expired while away
          setTimeRemaining(0);
          localStorage.removeItem(STORAGE_KEY);
          onTimeUp();
        }
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    } else if (autoStart) {
      // Fresh start
      const initialTime = timerMinutes * 60;
      setTimeRemaining(initialTime);
      startTimeRef.current = Date.now();
      setIsRunning(true);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        startTime: Date.now(),
        remaining: initialTime,
      }));
    }
  }, [assignmentId, timerMinutes, autoStart, STORAGE_KEY, onTimeUp]);

  // Timer countdown logic
  useEffect(() => {
    if (!isRunning || timeRemaining === null || timeRemaining <= 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) return 0;
        
        const newRemaining = prev - 1;
        
        // Update localStorage every 5 seconds
        if (newRemaining % 5 === 0 && startTimeRef.current) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({
            startTime: startTimeRef.current,
            remaining: newRemaining,
          }));
        }
        
        // Calculate time taken
        if (startTimeRef.current) {
          const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setTimeTaken(elapsed);
        }
        
        if (newRemaining === 0) {
          localStorage.removeItem(STORAGE_KEY);
          setIsRunning(false);
          onTimeUp();
        }
        
        return newRemaining;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, STORAGE_KEY, onTimeUp]);

  const startTimer = useCallback(() => {
    if (!timerMinutes) return;
    
    const initialTime = timerMinutes * 60;
    setTimeRemaining(initialTime);
    startTimeRef.current = Date.now();
    setIsRunning(true);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      startTime: Date.now(),
      remaining: initialTime,
    }));
  }, [timerMinutes, STORAGE_KEY]);

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    localStorage.removeItem(STORAGE_KEY);
    
    // Calculate final time taken
    if (startTimeRef.current) {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setTimeTaken(elapsed);
    }
  }, [STORAGE_KEY]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeRemaining,
    timeTaken,
    isRunning,
    startTimer,
    stopTimer,
    formatTime: timeRemaining !== null ? formatTime(timeRemaining) : null,
    timeTakenFormatted: formatTime(timeTaken),
  };
};
