/**
 * HIGHFIELD - Interaction Prompt (Immersive UI Theme)
 * Displays the Immersive UI interaction prompt and glow badge when visitor approaches.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HighfieldStatus } from '../types';

interface InteractionPromptProps {
  status: HighfieldStatus;
  isDialogueOpen: boolean;
  onInteract: () => void;
}

export const InteractionPrompt: React.FC<InteractionPromptProps> = ({
  status,
  isDialogueOpen,
  onInteract,
}) => {
  if (isDialogueOpen || !status.nearVisitor) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="interaction-prompt-container"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 pointer-events-auto flex flex-col items-center gap-2 font-mono"
      >
        {/* Glow Tag */}
        <div className="bg-black/85 border border-[#ff4e00]/60 px-3.5 py-0.5 text-[9px] tracking-[0.25em] text-[#ff4e00] uppercase font-black glow-text rounded-xs shadow-[0_0_12px_rgba(255,78,0,0.5)]">
          HIGHFIELD // TARGET_LOCK
        </div>

        {/* Interact Action Button */}
        <button
          id="interact-action-btn"
          onClick={onInteract}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#ff4e00]/15 hover:bg-[#ff4e00]/30 border border-[#ff4e00]/40 hover:border-[#ff4e00] rounded-xs shadow-[0_0_18px_rgba(255,78,0,0.35)] backdrop-blur-xs transition-all duration-150 cursor-pointer group"
        >
          <span className="text-[10px] font-black tracking-widest text-white group-hover:text-[#ff4e00] transition-colors">
            [E] INTERACT
          </span>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
