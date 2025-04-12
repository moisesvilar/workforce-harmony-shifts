
import React from 'react';
import { AppStep } from '../types';
import { cn } from '../lib/utils';

interface StepIndicatorProps {
  currentStep: AppStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { label: 'Upload Data', step: AppStep.UPLOAD_EMPLOYEE_DATA },
    { label: 'Define Constraints', step: AppStep.DEFINE_CONSTRAINTS },
    { label: 'Generate Schedule', step: AppStep.GENERATE_SCHEDULE },
    { label: 'View Results', step: AppStep.DISPLAY_RESULTS }
  ];

  return (
    <div className="w-full py-6">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.step}>
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                  currentStep >= step.step 
                    ? "bg-harmony-600 text-white" 
                    : "bg-gray-200 text-gray-500"
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium", 
                  currentStep >= step.step ? "text-harmony-700" : "text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connector line (except after last item) */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2",
                  currentStep > step.step ? "bg-harmony-500" : "bg-gray-200"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
