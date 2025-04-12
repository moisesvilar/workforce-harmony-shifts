
import { Employee, Constraint, EmployeeShift, WeekDay, TimeSlot, ShiftMark } from '../types';

const WEEKDAYS: WeekDay[] = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const TIME_SLOTS: TimeSlot[] = [
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23
];

const initializeEmptySchedule = (): EmployeeShift['schedule'] => {
  const schedule: EmployeeShift['schedule'] = {} as EmployeeShift['schedule'];
  
  WEEKDAYS.forEach((day) => {
    schedule[day] = {} as Record<TimeSlot, ShiftMark>;
    TIME_SLOTS.forEach((timeSlot) => {
      schedule[day][timeSlot] = '';
    });
  });
  
  return schedule;
};

const parseConstraints = (constraints: Constraint[]): Record<string, any> => {
  // This is a simplified constraint parser
  // In a real implementation, you would use a more sophisticated natural language processing
  const parsedConstraints: Record<string, any> = {
    maxDaysPerWeek: 7,
    maxHoursPerDay: 12,
    requireWeekend: false
  };
  
  constraints.forEach((constraint) => {
    const text = constraint.text.toLowerCase();
    
    // Handle max days per week constraint
    if (text.includes('no one can work more than') && text.includes('days per week')) {
      const match = text.match(/no one can work more than (\d+) days per week/);
      if (match && match[1]) {
        parsedConstraints.maxDaysPerWeek = parseInt(match[1], 10);
      }
    }
    
    // Handle max hours per day constraint
    if (text.includes('no one can work more than') && text.includes('hours per day')) {
      const match = text.match(/no one can work more than (\d+) hours per day/);
      if (match && match[1]) {
        parsedConstraints.maxHoursPerDay = parseInt(match[1], 10);
      }
    }
    
    // Handle weekend constraint
    if (text.includes('free whole weekend')) {
      parsedConstraints.requireWeekend = true;
    }
  });
  
  return parsedConstraints;
};

// Helper to calculate hours from a schedule
const calculateTotalHours = (schedule: EmployeeShift['schedule']): number => {
  let totalHours = 0;
  
  WEEKDAYS.forEach((day) => {
    TIME_SLOTS.forEach((timeSlot) => {
      const mark = schedule[day][timeSlot];
      if (mark === 'X') {
        totalHours += 1;
      } else if (mark === '/' || mark === '\\') {
        totalHours += 0.5;
      }
    });
  });
  
  return totalHours;
};

// Helper to count working days in a schedule
const countWorkingDays = (schedule: EmployeeShift['schedule']): number => {
  const workingDays = new Set<WeekDay>();
  
  WEEKDAYS.forEach((day) => {
    const dayHasWork = TIME_SLOTS.some((timeSlot) => schedule[day][timeSlot] !== '');
    if (dayHasWork) {
      workingDays.add(day);
    }
  });
  
  return workingDays.size;
};

export const generateShifts = async (
  employees: Employee[], 
  constraints: Constraint[],
  progressCallback: (employeeName: string, progress: number) => void
): Promise<EmployeeShift[]> => {
  const parsedConstraints = parseConstraints(constraints);
  const shifts: EmployeeShift[] = [];
  
  for (let i = 0; i < employees.length; i++) {
    const employee = employees[i];
    
    // Update progress
    progressCallback(employee.name, (i / employees.length) * 100);
    
    // Create empty shift schedule
    const shift: EmployeeShift = {
      employeeId: employee.id,
      employeeName: employee.name,
      schedule: initializeEmptySchedule()
    };
    
    // Target weekly hours from employee contract
    const targetHours = employee.hours;
    
    // Simplified shift generation algorithm
    // In a real implementation, this would be more sophisticated and respect all constraints
    let remainingHours = targetHours;
    let currentDay = 0;
    let maxDaysAssigned = 0;
    
    while (remainingHours > 0 && maxDaysAssigned < parsedConstraints.maxDaysPerWeek && currentDay < WEEKDAYS.length) {
      const weekday = WEEKDAYS[currentDay];
      
      // Skip weekend days if weekend is required and this is the last weekend
      if (parsedConstraints.requireWeekend && 
         (weekday === 'SATURDAY' || weekday === 'SUNDAY') && 
         remainingHours < employee.hours * 0.25) {
        currentDay++;
        continue;
      }
      
      // Decide how many hours to allocate to this day (random between 4-8 hours, but not more than remaining or maxHoursPerDay)
      const hoursToAllocate = Math.min(
        Math.floor(Math.random() * 5) + 4, // 4-8 hours
        remainingHours,
        parsedConstraints.maxHoursPerDay
      );
      
      if (hoursToAllocate >= 1) {
        // Assign hours to this day
        const startTime = Math.floor(Math.random() * (24 - 7 - hoursToAllocate)) + 7; // Random start time between 7 and (24-hoursToAllocate)
        
        // Handle full hours
        for (let h = 0; h < Math.floor(hoursToAllocate); h++) {
          const timeSlot = (startTime + h) as TimeSlot;
          if (TIME_SLOTS.includes(timeSlot)) {
            shift.schedule[weekday][timeSlot] = 'X';
          }
        }
        
        // Handle fractional hour (0.5) if needed
        const fractionalHour = hoursToAllocate - Math.floor(hoursToAllocate);
        if (fractionalHour >= 0.5) {
          const timeSlot = (startTime + Math.floor(hoursToAllocate)) as TimeSlot;
          if (TIME_SLOTS.includes(timeSlot)) {
            shift.schedule[weekday][timeSlot] = '/'; // Second half hour
          }
        }
        
        remainingHours -= hoursToAllocate;
        maxDaysAssigned++;
      }
      
      currentDay++;
    }
    
    // Ensure we've allocated as close to the target hours as possible
    const totalHours = calculateTotalHours(shift.schedule);
    console.log(`Employee ${employee.name}: Target hours = ${targetHours}, Allocated hours = ${totalHours}`);
    
    shifts.push(shift);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return shifts;
};
