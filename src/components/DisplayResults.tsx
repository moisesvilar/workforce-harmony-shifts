import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { EmployeeShift, TimeSlot, WeekDay, Constraint } from '@/types';
import { Download, Printer, BarChart2, FileJson, CheckCircle, XCircle, Search, ChevronsUpDown, Check } from 'lucide-react';
import { getShifts, getConstraints } from '@/lib/indexedDB';
import { toast } from '@/lib/toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { cn } from "@/lib/utils";

const TIME_SLOTS: TimeSlot[] = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
];

const WEEKDAYS: WeekDay[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

interface DisplayResultsProps {
  shifts: EmployeeShift[];
  onReset: () => void;
}

const DisplayResults: React.FC<DisplayResultsProps> = ({ shifts, onReset }) => {
  const [activeTab, setActiveTab] = useState(shifts.length > 0 ? shifts[0].employeeId : '');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = useState("");

  // Ordenar los shifts alfabéticamente por nombre de empleado
  const sortedShifts = [...shifts].sort((a, b) => 
    a.employeeName.localeCompare(b.employeeName)
  );

  // Filtrar shifts según la búsqueda
  const filteredShifts = sortedShifts.filter(shift => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      shift.employeeName.toLowerCase().includes(searchLower) ||
      shift.employeeId.toLowerCase().includes(searchLower)
    );
  });

  // Cargar las restricciones al montar el componente
  useEffect(() => {
    const loadConstraints = async () => {
      try {
        const loadedConstraints = await getConstraints();
        setConstraints(loadedConstraints);
      } catch (error) {
        console.error('Error al cargar restricciones:', error);
      }
    };
    
    loadConstraints();
  }, []);

  // Calculate total hours worked for each employee
  const calculateTotalHours = (shift: EmployeeShift): number => {
    let totalHours = 0;
    
    WEEKDAYS.forEach((day) => {
      TIME_SLOTS.forEach((timeSlot) => {
        const mark = shift.schedule[day][timeSlot];
        if (mark === 'X') {
          totalHours += 1;
        } else if (mark === '/' || mark === '\\') {
          totalHours += 0.5;
        }
      });
    });
    
    return totalHours;
  };

  // Calculate hours per day
  const calculateDailyHours = (shift: EmployeeShift, day: WeekDay): number => {
    let dailyHours = 0;
    
    TIME_SLOTS.forEach((timeSlot) => {
      const mark = shift.schedule[day][timeSlot];
      if (mark === 'X') {
        dailyHours += 1;
      } else if (mark === '/' || mark === '\\') {
        dailyHours += 0.5;
      }
    });
    
    return dailyHours;
  };

  // Render one employee schedule
  const renderEmployeeSchedule = (shift: EmployeeShift) => {
    return (
      <div key={shift.employeeId} className="schedule-container mb-8 page-break-after">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-harmony-700">
            {shift.employeeName} - {shift.employeeId}
          </h3>
          <div className="text-sm text-harmony-600">
            Total Hours: <span className="font-medium">{calculateTotalHours(shift)}</span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="shift-table w-full">
            <thead>
              <tr>
                <th className="w-24"></th>
                {TIME_SLOTS.map((slot) => (
                  <th key={slot}>{slot}</th>
                ))}
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((day) => (
                <tr key={day}>
                  <td className="shift-day">{day}</td>
                  {TIME_SLOTS.map((timeSlot) => (
                    <td 
                      key={`${day}-${timeSlot}`}
                      className={
                        shift.schedule[day][timeSlot] === 'X' 
                          ? 'bg-harmony-200 text-harmony-900' 
                          : shift.schedule[day][timeSlot]
                            ? 'bg-harmony-100 text-harmony-900'
                            : ''
                      }
                    >
                      {shift.schedule[day][timeSlot]}
                    </td>
                  ))}
                  <td className="font-medium">{calculateDailyHours(shift, day)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Print all employee schedules
  const handlePrint = () => {
    // Create style element for print
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #print-container, #print-container * {
          visibility: visible;
        }
        #print-container {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 20px;
        }
        .page-break-after {
          page-break-after: always;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        table, th, td {
          border: 1px solid #ddd;
        }
        th, td {
          padding: 8px;
          text-align: center;
        }
        th {
          background-color: #f8f9fa !important;
        }
        td.shift-day {
          font-weight: bold;
        }
        .bg-harmony-200 {
          background-color: #d1d5db !important;
        }
        .bg-harmony-100 {
          background-color: #e5e7eb !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Mostrar el contenedor de impresión
    if (printRef.current) {
      printRef.current.classList.remove('hidden');
    }
    
    setTimeout(() => {
      window.print();
      
      // Ocultar el contenedor después de imprimir
      if (printRef.current) {
        printRef.current.classList.add('hidden');
      }
      
      // Remove style element after printing
      document.head.removeChild(style);
    }, 100);
  };

  // Export to CSV
  const handleExport = () => {
    if (shifts.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header row
    csvContent += "Employee ID,Employee Name,Day,";
    TIME_SLOTS.forEach(slot => {
      csvContent += `${slot}:00,`;
    });
    csvContent += "Daily Hours\r\n";
    
    // Data rows
    shifts.forEach(shift => {
      WEEKDAYS.forEach(day => {
        csvContent += `${shift.employeeId},${shift.employeeName},${day},`;
        
        TIME_SLOTS.forEach(timeSlot => {
          csvContent += `${shift.schedule[day][timeSlot]},`;
        });
        
        // Add daily hours
        csvContent += `${calculateDailyHours(shift, day)}\r\n`;
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "workforce_shifts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const handleExportJSON = async () => {
    try {
      // Obtener todos los turnos de IndexedDB
      const allShifts = await getShifts();
      
      if (allShifts.length === 0) {
        toast.warning('No hay datos de turnos para descargar');
        return;
      }
      
      const jsonString = JSON.stringify(allShifts, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'workforce_shifts.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Datos de turnos descargados con éxito');
    } catch (error) {
      console.error('Error al descargar turnos:', error);
      toast.error('Error al descargar datos de turnos');
    }
  };

  // Calculate heatmap data
  const calculateHeatmapData = () => {
    const heatmapData: Record<WeekDay, Record<TimeSlot, number>> = {} as any;
    
    // Initialize heatmap data structure
    WEEKDAYS.forEach(day => {
      heatmapData[day] = {} as Record<TimeSlot, number>;
      TIME_SLOTS.forEach(slot => {
        heatmapData[day][slot] = 0;
      });
    });
    
    // Count employees working at each time slot
    shifts.forEach(shift => {
      WEEKDAYS.forEach(day => {
        TIME_SLOTS.forEach(timeSlot => {
          const mark = shift.schedule[day][timeSlot];
          if (mark === 'X') {
            heatmapData[day][timeSlot] += 1;
          } else if (mark === '/' || mark === '\\') {
            heatmapData[day][timeSlot] += 0.5;
          }
        });
      });
    });
    
    return heatmapData;
  };

  // Calculate color based on value (min to max range)
  const getHeatmapColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return 'bg-gray-100';
    
    // Calculate ratio (0 to 1)
    const ratio = value / maxValue;
    
    if (ratio < 0.33) {
      return 'bg-red-200 text-red-900';
    } else if (ratio < 0.66) {
      return 'bg-yellow-200 text-yellow-900';
    } else {
      return 'bg-green-200 text-green-900';
    }
  };

  // Find maximum value in heatmap data
  const findMaxValue = (heatmapData: Record<WeekDay, Record<TimeSlot, number>>) => {
    let max = 0;
    WEEKDAYS.forEach(day => {
      TIME_SLOTS.forEach(slot => {
        if (heatmapData[day][slot] > max) {
          max = heatmapData[day][slot];
        }
      });
    });
    return max;
  };

  const heatmapData = calculateHeatmapData();
  const maxValue = findMaxValue(heatmapData);

  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  // Evaluar si una restricción se cumple para un turno específico
  const evaluateConstraint = (constraint: Constraint, shift: EmployeeShift) => {
    const text = constraint.text.toLowerCase();
    const schedule = shift.schedule;
    
    // Calcular horas totales por semana
    const totalHours = calculateTotalHours(shift);
    
    // Calcular días trabajados por semana
    const workingDays = Object.keys(schedule).filter(day => 
      Object.values(schedule[day as WeekDay]).some(mark => mark !== '')
    ).length;
    
    // Calcular máximo de horas por día
    let maxHoursPerDay = 0;
    WEEKDAYS.forEach(day => {
      const dailyHours = calculateDailyHours(shift, day);
      if (dailyHours > maxHoursPerDay) {
        maxHoursPerDay = dailyHours;
      }
    });
    
    // Calcular mínimo de horas por día (sólo en días trabajados)
    let minHoursPerDay = 24;
    WEEKDAYS.forEach(day => {
      const dailyHours = calculateDailyHours(shift, day);
      if (dailyHours > 0 && dailyHours < minHoursPerDay) {
        minHoursPerDay = dailyHours;
      }
    });
    
    // Evaluar cada tipo de restricción
    if (text.includes('no one can work more than') && text.includes('days per week')) {
      const match = text.match(/no one can work more than (\d+) days per week/);
      if (match && match[1]) {
        const maxDays = parseInt(match[1], 10);
        return {
          meet: workingDays <= maxDays,
          explanation: `La persona trabaja ${workingDays} días esta semana.`
        };
      }
    }
    
    if (text.includes('no one can work more than') && text.includes('hours per day')) {
      const match = text.match(/no one can work more than (\d+) hours per day/);
      if (match && match[1]) {
        const maxHours = parseInt(match[1], 10);
        return {
          meet: maxHoursPerDay <= maxHours,
          explanation: `Máximo de horas en un día: ${maxHoursPerDay}.`
        };
      }
    }
    
    if (text.includes('no one can work less than') && text.includes('days per week')) {
      const match = text.match(/no one can work less than (\d+) days per week/);
      if (match && match[1]) {
        const minDays = parseInt(match[1], 10);
        return {
          meet: workingDays >= minDays,
          explanation: `La persona trabaja ${workingDays} días esta semana.`
        };
      }
    }
    
    if (text.includes('no one can work less than') && text.includes('hours per day')) {
      const match = text.match(/no one can work less than (\d+) hours per day/);
      if (match && match[1]) {
        const minHours = parseInt(match[1], 10);
        return {
          meet: workingDays === 0 || minHoursPerDay >= minHours,
          explanation: `Horas mínimas trabajadas en un día: ${minHoursPerDay}.`
        };
      }
    }
    
    // Restricción genérica por defecto
    return {
      meet: true,
      explanation: "No se ha evaluado específicamente."
    };
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-harmony-700">Shift Schedules</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-harmony-700"
              onClick={handlePrint}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-harmony-700"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-harmony-700"
              onClick={handleExportJSON}
            >
              <FileJson className="h-4 w-4 mr-1" />
              Export JSON
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className={`${showHeatmap ? 'bg-harmony-100' : ''} text-harmony-700`}
              onClick={toggleHeatmap}
            >
              <BarChart2 className="h-4 w-4 mr-1" />
              {showHeatmap ? 'Hide Heatmap' : 'View Heatmap'}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-harmony-600 hover:bg-harmony-700"
              onClick={onReset}
            >
              New Schedule
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No shifts generated yet. Please go back and generate shifts.
            </div>
          ) : showHeatmap ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-harmony-700">
                Staff Coverage Heatmap
              </h3>
              <div className="overflow-x-auto">
                <table className="shift-table">
                  <thead>
                    <tr>
                      <th className="w-24"></th>
                      {TIME_SLOTS.map((slot) => (
                        <th key={slot}>{slot}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WEEKDAYS.map((day) => (
                      <tr key={day}>
                        <td className="shift-day">{day}</td>
                        {TIME_SLOTS.map((timeSlot) => (
                          <td 
                            key={`${day}-${timeSlot}`}
                            className={`text-center font-medium ${getHeatmapColor(heatmapData[day][timeSlot], maxValue)}`}
                          >
                            {heatmapData[day][timeSlot]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-200 mr-1"></div>
                  <span>Bajo</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-200 mr-1"></div>
                  <span>Medio</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-200 mr-1"></div>
                  <span>Alto</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium">Buscar empleado:</label>
                  <div className="flex items-center w-full max-w-md">
                    <div className="relative w-full">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre o ID..."
                        className="pl-8"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <label className="text-sm font-medium">Seleccionar empleado:</label>
                    <Select value={activeTab} onValueChange={setActiveTab}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredShifts.map((shift) => (
                          <SelectItem key={shift.employeeId} value={shift.employeeId}>
                            {shift.employeeName} - {shift.employeeId}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <Tabs value={activeTab}>
                {shifts.map((shift) => (
                  <TabsContent key={shift.employeeId} value={shift.employeeId} className="mt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-harmony-700">
                          {shift.employeeName} - {shift.employeeId}
                        </h3>
                        <div className="text-sm text-harmony-600">
                          Total Hours: <span className="font-medium">{calculateTotalHours(shift)}</span>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="shift-table">
                          <thead>
                            <tr>
                              <th className="w-24"></th>
                              {TIME_SLOTS.map((slot) => (
                                <th key={slot}>{slot}</th>
                              ))}
                              <th>Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            {WEEKDAYS.map((day) => (
                              <tr key={day}>
                                <td className="shift-day">{day}</td>
                                {TIME_SLOTS.map((timeSlot) => (
                                  <td 
                                    key={`${day}-${timeSlot}`}
                                    className={
                                      shift.schedule[day][timeSlot] === 'X' 
                                        ? 'bg-harmony-200 text-harmony-900' 
                                        : shift.schedule[day][timeSlot]
                                          ? 'bg-harmony-100 text-harmony-900'
                                          : ''
                                    }
                                  >
                                    {shift.schedule[day][timeSlot]}
                                  </td>
                                ))}
                                <td className="font-medium">{calculateDailyHours(shift, day)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <span className="mr-4">X = Full hour</span>
                        <span className="mr-4">/ = Second half-hour</span>
                        <span>\ = First half-hour</span>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Hidden container for printing all schedules */}
      <div id="print-container" ref={printRef} className="hidden print:block">
        <h1 className="text-2xl font-bold mb-6">Workforce Harmony - Horarios</h1>
        {sortedShifts.map(shift => renderEmployeeSchedule(shift))}
      </div>
    </div>
  );
};

export default DisplayResults;
