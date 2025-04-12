
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeShift, TimeSlot, WeekDay } from '@/types';
import { Download, Printer } from 'lucide-react';

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

  // Print the current shift
  const handlePrint = () => {
    window.print();
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
              Export
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
          ) : (
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
              <TabsList className="flex overflow-x-auto mb-4">
                {shifts.map((shift) => (
                  <TabsTrigger 
                    key={shift.employeeId} 
                    value={shift.employeeId}
                    className="min-w-max"
                  >
                    {shift.employeeName}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {shifts.map((shift) => (
                <TabsContent key={shift.employeeId} value={shift.employeeId} className="mt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-harmony-700">
                        {shift.employeeName}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DisplayResults;
