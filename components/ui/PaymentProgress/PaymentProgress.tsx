'use client';

import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { label: 'Uploading images' },
  { label: 'Creating listing' },
  { label: 'Processing payment' },
  { label: 'Confirming' }
] as const;

interface PaymentProgressProps {
  currentStep: number;
  isVisible: boolean;
}

function StepIcon({ status, index }: { status: 'done' | 'active' | 'pending'; index: number }) {
  if (status === 'done') {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="w-10 h-10 rounded-full bg-articblue flex items-center justify-center shadow-md shadow-articblue/20"
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>
    );
  }

  if (status === 'active') {
    return (
      <div className="relative w-10 h-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-articblue border-r-articblue"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-articblue">{index + 1}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center">
      <span className="text-sm font-medium text-gray-300">{index + 1}</span>
    </div>
  );
}

function ConnectorLine({ status }: { status: 'done' | 'pending' }) {
  return (
    <div className="w-0.5 h-6 ml-5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gray-200" />
      {status === 'done' && (
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 0.3 }}
          className="absolute inset-x-0 top-0 bg-articblue"
        />
      )}
    </div>
  );
}

export default function PaymentProgress({ currentStep, isVisible }: PaymentProgressProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="bg-white rounded-3xl px-10 py-10 shadow-2xl w-full max-w-md"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-articblue/10 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-articblue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-oceanblue">
                Processing your listing
              </h3>
              <p className="text-sm text-darkgrey/50 mt-1">
                This will only take a moment
              </p>
            </div>

            <div className="flex flex-col">
              {STEPS.map((step, index) => {
                const status = index < currentStep ? 'done' : index === currentStep ? 'active' : 'pending';
                const isLast = index === STEPS.length - 1;

                return (
                  <div key={step.label}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4"
                    >
                      <StepIcon status={status} index={index} />
                      <div className="flex-1">
                        <span
                          className={`text-[15px] transition-colors duration-300 ${
                            status === 'done'
                              ? 'text-articblue font-medium'
                              : status === 'active'
                                ? 'text-oceanblue font-medium'
                                : 'text-gray-400'
                          }`}
                        >
                          {step.label}
                          {status === 'active' && '...'}
                        </span>
                      </div>
                      {status === 'done' && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-articblue/60 font-medium"
                        >
                          Done
                        </motion.span>
                      )}
                    </motion.div>
                    {!isLast && (
                      <ConnectorLine status={index < currentStep ? 'done' : 'pending'} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-articblue/40 animate-pulse" />
              <p className="text-xs text-darkgrey/40">
                Please don&apos;t close this window
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
