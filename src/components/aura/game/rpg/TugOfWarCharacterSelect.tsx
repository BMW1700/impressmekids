import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { SirValor } from '../characters/SirValor';
import { Elara } from '../characters/Elara';
import { Shield, Sparkles, Mic, Loader2 } from 'lucide-react';
import { requestMicrophonePermission } from '@/lib/speechRecognitionManager';
import { useToast } from '@/hooks/use-toast';

interface TugOfWarCharacterSelectProps {
  onSelect: (character: 'valor' | 'elara') => void;
}

export const TugOfWarCharacterSelect = ({ onSelect }: TugOfWarCharacterSelectProps) => {
  const [isRequestingMic, setIsRequestingMic] = useState(false);
  const { toast } = useToast();

  const handleSelect = async (character: 'valor' | 'elara') => {
    setIsRequestingMic(true);
    
    try {
      const granted = await requestMicrophonePermission();
      
      if (granted) {
        onSelect(character);
      } else {
        toast({
          title: 'Microphone Required',
          description: 'Please allow microphone access to play this reading game.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting mic permission:', error);
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check your browser settings.',
        variant: 'destructive',
      });
    } finally {
      setIsRequestingMic(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-black text-white drop-shadow-lg mb-2">
          TUG OF WAR
        </h1>
        <p className="text-white/90 text-lg drop-shadow">Choose your team leader!</p>
      </motion.div>

      {isRequestingMic && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-60 flex flex-col items-center justify-center"
        >
          <Loader2 className="h-12 w-12 text-white animate-spin mb-4" />
          <div className="flex items-center gap-2 text-white text-lg">
            <Mic className="h-6 w-6" />
            <span>Requesting microphone access...</span>
          </div>
        </motion.div>
      )}

      <div className="flex gap-8 items-center">
        {/* Sir Valor Option */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-4 border-transparent hover:border-blue-400 transition-all cursor-pointer"
               onClick={() => handleSelect('valor')}>
            <SirValor state="idle" healthPercent={100} size="medium" />
            
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-white drop-shadow">Sir Valor</h3>
              <div className="flex items-center justify-center gap-1 text-blue-200">
                <Shield className="h-4 w-4" />
                <span className="text-sm">The Knight</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => handleSelect('valor')}
            disabled={isRequestingMic}
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-bold px-8"
          >
            Choose Valor
          </Button>
        </motion.div>

        {/* VS Divider */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="text-4xl font-black text-white drop-shadow-lg"
        >
          VS
        </motion.div>

        {/* Elara Option */}
        <motion.div
          className="flex flex-col items-center"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border-4 border-transparent hover:border-purple-400 transition-all cursor-pointer"
               onClick={() => handleSelect('elara')}>
            <Elara state="idle" healthPercent={100} size="medium" />
            
            <div className="mt-4 text-center">
              <h3 className="text-xl font-bold text-white drop-shadow">Princess Elara</h3>
              <div className="flex items-center justify-center gap-1 text-purple-200">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">The Wizard</span>
              </div>
            </div>
          </div>
          
          <Button
            onClick={() => handleSelect('elara')}
            disabled={isRequestingMic}
            className="mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold px-8"
          >
            Choose Elara
          </Button>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 text-white/70 text-sm"
      >
        Your leader will anchor your team in the tug of war!
      </motion.p>
    </motion.div>
  );
};
