
import React, { useState, useEffect } from 'react';
import { AppStep, Employee, Constraint, EmployeeShift } from '@/types';
import StepIndicator from '@/components/StepIndicator';
import UploadEmployeeData from '@/components/UploadEmployeeData';
import DefineConstraints from '@/components/DefineConstraints';
import GenerateSchedule from '@/components/GenerateSchedule';
import DisplayResults from '@/components/DisplayResults';
import { initDB, getEmployees, getConstraints, getShifts } from '@/lib/indexedDB';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const [currentStep, setCurrentStep] = useState(AppStep.UPLOAD_EMPLOYEE_DATA);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [shifts, setShifts] = useState<EmployeeShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize IndexedDB and check for existing data on mount
  useEffect(() => {
    const checkExistingData = async () => {
      try {
        await initDB();
        
        // Check for existing employees
        const savedEmployees = await getEmployees();
        if (savedEmployees.length > 0) {
          setEmployees(savedEmployees);
          setCurrentStep(AppStep.DEFINE_CONSTRAINTS);
          
          // Check for existing constraints
          const savedConstraints = await getConstraints();
          setConstraints(savedConstraints);
          
          // Check for existing shifts
          const savedShifts = await getShifts();
          if (savedShifts.length > 0) {
            setShifts(savedShifts);
            setCurrentStep(AppStep.DISPLAY_RESULTS);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing:', error);
        toast.error('Failed to initialize application data');
        setIsLoading(false);
      }
    };
    
    checkExistingData();
  }, []);

  const handleEmployeeDataComplete = (employees: Employee[]) => {
    setEmployees(employees);
    setCurrentStep(AppStep.DEFINE_CONSTRAINTS);
  };

  const handleConstraintsComplete = (constraints: Constraint[]) => {
    setConstraints(constraints);
    setCurrentStep(AppStep.GENERATE_SCHEDULE);
  };

  const handleScheduleGenerated = (shifts: EmployeeShift[]) => {
    setShifts(shifts);
    setCurrentStep(AppStep.DISPLAY_RESULTS);
  };

  const handleReset = () => {
    setCurrentStep(AppStep.UPLOAD_EMPLOYEE_DATA);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-harmony-200 border-t-harmony-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-harmony-600">Initializing application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-harmony-800 mb-2">Workforce Harmony</h1>
        <p className="text-harmony-600">Automate shift scheduling for your team</p>
      </div>
      
      <StepIndicator currentStep={currentStep} />
      
      <div className="py-4">
        {currentStep === AppStep.UPLOAD_EMPLOYEE_DATA && (
          <UploadEmployeeData onComplete={handleEmployeeDataComplete} />
        )}
        
        {currentStep === AppStep.DEFINE_CONSTRAINTS && (
          <DefineConstraints onComplete={handleConstraintsComplete} />
        )}
        
        {currentStep === AppStep.GENERATE_SCHEDULE && (
          <GenerateSchedule 
            employees={employees}
            constraints={constraints}
            onComplete={handleScheduleGenerated}
          />
        )}
        
        {currentStep === AppStep.DISPLAY_RESULTS && (
          <DisplayResults shifts={shifts} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};

export default Index;
