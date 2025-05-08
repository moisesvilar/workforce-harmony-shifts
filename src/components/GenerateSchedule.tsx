import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Employee, Constraint, EmployeeShift } from '@/types';
import { generateShifts, ShiftGeneratorError } from '@/lib/shiftGenerator';
import { saveShifts, getEmployees, getConstraints } from '@/lib/indexedDB';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerateSchedule = async () => {
    if (employees.length === 0) {
      toast.error('No employees to generate schedule for');
      return;
    }

    try {
      setIsGenerating(true);
      setProgress(0);
      setIsComplete(false);
      setErrorMessage(null);

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
      setIsGenerating(false);
      
      // Manejar errores específicos del generador
      if (error instanceof ShiftGeneratorError) {
        setErrorMessage(error.message);
      } else {
        toast.error('Failed to generate schedules');
      }
    }
  };

  const handleViewResults = () => {
    onComplete(generatedShifts);
  };

  const downloadJsonFile = (data: any, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadEmployees = async () => {
    try {
      // Obtener todos los empleados de IndexedDB
      const allEmployees = await getEmployees();
      
      if (allEmployees.length === 0) {
        toast.warning('No hay datos de empleados para descargar');
        return;
      }
      
      downloadJsonFile(allEmployees, 'workforce_employees.json');
      toast.success('Datos de empleados descargados con éxito');
    } catch (error) {
      console.error('Error al descargar empleados:', error);
      toast.error('Error al descargar datos de empleados');
    }
  };

  const handleDownloadConstraints = async () => {
    try {
      // Obtener todas las restricciones de IndexedDB
      const allConstraints = await getConstraints();
      
      if (allConstraints.length === 0) {
        toast.warning('No hay datos de restricciones para descargar');
        return;
      }
      
      downloadJsonFile(allConstraints, 'workforce_constraints.json');
      toast.success('Datos de restricciones descargados con éxito');
    } catch (error) {
      console.error('Error al descargar restricciones:', error);
      toast.error('Error al descargar datos de restricciones');
    }
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

        {errorMessage && (
          <div className="bg-red-50 p-4 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Error en la generación de horarios</p>
              <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="bg-green-50 p-4 rounded-lg flex items-center">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
            <span className="text-green-700">Schedule generation complete!</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-harmony-700"
          onClick={handleDownloadEmployees}
        >
          <Download className="h-4 w-4 mr-1" />
          Download employee data
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="text-harmony-700"
          onClick={handleDownloadConstraints}
        >
          <Download className="h-4 w-4 mr-1" />
          Download constraints data
        </Button>
        
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
