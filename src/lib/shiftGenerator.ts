import { Employee, Constraint, EmployeeShift, WeekDay, TimeSlot, ShiftMark } from '../types';
import { getEmployees, getConstraints } from '@/lib/indexedDB';
import { toast } from '@/lib/toast';

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

// Clase personalizada para errores del generador de horarios
export class ShiftGeneratorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShiftGeneratorError';
  }
}

// Convertir el formato de horario de la respuesta del servidor al formato de la aplicación
const convertScheduleFormat = (serverSchedule: Record<string, any>): EmployeeShift[] => {
  const shifts: EmployeeShift[] = [];
  
  // Obtener los IDs de empleados del objeto schedule
  const employeeIds = Object.keys(serverSchedule);
  
  for (const employeeId of employeeIds) {
    if (employeeId === '_status') continue; // Saltar el campo de estado
    
    const employeeData = serverSchedule[employeeId];
    const employeeSchedule = initializeEmptySchedule();
    
    // Para cada día de la semana
    for (const day of WEEKDAYS) {
      // Verificar si el día existe en el horario del empleado
      if (employeeData.schedule && employeeData.schedule[day]) {
        const workingHours = employeeData.schedule[day];
        
        // Para cada franja horaria, marcar con "X" si está en el array de horas
        for (const timeSlot of TIME_SLOTS) {
          // Convertir el timeSlot al formato del servidor (por ejemplo, 7 -> "07")
          const timeSlotStr = timeSlot < 10 ? `0${timeSlot}` : `${timeSlot}`;
          
          // Si la hora está en el array de horas trabajadas, marcar con "X"
          if (workingHours.includes(timeSlotStr)) {
            employeeSchedule[day][timeSlot] = 'X';
          }
        }
      }
    }
    
    shifts.push({
      employeeId,
      employeeName: employeeData.name,
      schedule: employeeSchedule
    });
  }
  
  return shifts;
};

export const generateShifts = async (
  employees: Employee[],
  constraints: Constraint[],
  progressCallback: (employeeName: string, progress: number) => void
): Promise<EmployeeShift[]> => {
  try {
    // Indicar el inicio del proceso
    progressCallback('Preparando datos', 10);
    
    // Obtener restricciones formalizadas
    const allConstraints = await getConstraints();
    
    // Filtrar solo las restricciones que tienen un formato JSON válido
    const formalizedConstraints = allConstraints
      .filter(constraint => constraint.jsonData)
      .map(constraint => constraint.jsonData);
    
    // Preparar los datos para la petición
    const requestData = {
      employees: employees,
      constraints: formalizedConstraints
    };
    
    // Indicar que se está enviando la petición
    progressCallback('Generando horarios', 30);
    
    // Enviar la petición al nuevo servicio
    const response = await fetch('http://127.0.0.1:5000/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
    progressCallback('Procesando resultados', 70);
    
    // Manejar errores específicos
    if (!response.ok) {
      // Si es un error 400, intentar leer el mensaje específico
      if (response.status === 400) {
        const errorData = await response.json();
        if (errorData && errorData.error) {
          throw new ShiftGeneratorError(errorData.error);
        }
      }
      throw new Error(`Error al generar horarios: ${response.statusText}`);
    }
    
    // Obtener la respuesta como JSON
    const responseData = await response.json();
    
    // Verificar si la respuesta tiene el formato esperado
    if (!responseData || !responseData.schedule) {
      throw new Error('Formato de respuesta inválido');
    }
    
    // Verificar el estado de la solución
    if (responseData._status && responseData._status.is_feasible === false) {
      // Lanzar un error si la solución no es factible
      throw new ShiftGeneratorError('No se pudo encontrar una solución factible con las restricciones dadas');
    }
    
    // Convertir el formato de la respuesta al formato de la aplicación
    const shifts = convertScheduleFormat(responseData.schedule);
    
    progressCallback('Completado', 100);
    
    return shifts;
  } catch (error) {
    console.error('Error en la generación de horarios:', error);
    
    // Propagar el error específico del generador
    if (error instanceof ShiftGeneratorError) {
      toast.error(error.message);
      throw error;
    }
    
    // En caso de error general, devolver horarios vacíos para todos los empleados
    return employees.map(employee => ({
      employeeId: employee.id,
      employeeName: employee.name,
      schedule: initializeEmptySchedule()
    }));
  }
};
