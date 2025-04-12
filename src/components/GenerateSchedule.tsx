
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Employee, Constraint, EmployeeShift } from '@/types';
import { generateShifts } from '@/lib/shiftGenerator';
import { saveShifts } from '@/lib/indexedDB';

interface GenerateScheduleProps {
  employees: Employee[];
  constraints: Constraint[];
  onComplete: (shifts: EmployeeShift[]) => void;
}

const GenerateSchedule: React.FC<GenerateScheduleProps> = ({ 
  employees, 
  constraints, 
  onComplete 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentEmployee, setCurrentEmployee] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [generatedShifts, setGeneratedShifts] = useState<EmployeeShift[]>([]);

  const handleGenerateSchedule = async () => {
    if (employees.length === 0) {
      toast.error('No employees to generate schedule for');
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);
      setIsComplete(false);

      // Generate shifts with progress tracking
      const shifts = await generateShifts(employees, constraints, (employeeName, progressPercent) => {
        setCurrentEmployee(employeeName);
        setProgress(progressPercent);
      });

      // Save shifts to IndexedDB
      await saveShifts(shifts);
      
      setGeneratedShifts(shifts);
      setIsComplete(true);
      setIsGenerating(false);
      toast.success('Schedule generation complete!');
    } catch (error) {
      console.error('Error generating schedules:', error);
      toast.error('Failed to generate schedules');
      setIsGenerating(false);
    }
  };

  const handleViewResults = () => {
    onComplete(generatedShifts);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-harmony-700">Generate Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-harmony-50 p-4 rounded-lg">
          <h3 className="text-harmony-700 font-medium mb-2">Ready to Generate Shifts</h3>
          <p className="text-sm text-harmony-600">
            The system will generate an optimized schedule for {employees.length} employees, 
            taking into account their working hours and {constraints.length} defined constraints.
          </p>
        </div>

        {isGenerating && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span>Generating shifts for: <span className="font-medium">{currentEmployee}</span></span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {isComplete && (
          <div className="bg-green-50 p-4 rounded-lg flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">Schedule generation complete!</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        {!isComplete ? (
          <Button
            variant="default"
            className="bg-harmony-600 hover:bg-harmony-700"
            onClick={handleGenerateSchedule}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <span className="mr-2">Generating...</span>
              </span>
            ) : (
              <span className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                Generate Shifts
              </span>
            )}
          </Button>
        ) : (
          <Button
            variant="default"
            className="bg-harmony-600 hover:bg-harmony-700"
            onClick={handleViewResults}
          >
            View Results
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default GenerateSchedule;
