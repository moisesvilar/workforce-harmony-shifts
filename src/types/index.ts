
export interface Employee {
  id: string;
  name: string;
  section: string;
  grouping: string;
  job: string;
  role?: string;
  contract: string;
  hours: number;
  status: string;
}

export interface Constraint {
  id: string;
  text: string;
}

export type TimeSlot = 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23;

export type WeekDay = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export type ShiftMark = '' | 'X' | '/' | '\\';

export interface EmployeeShift {
  employeeId: string;
  employeeName: string;
  schedule: {
    [key in WeekDay]: {
      [key in TimeSlot]: ShiftMark;
    };
  };
}

export enum AppStep {
  UPLOAD_EMPLOYEE_DATA = 0,
  DEFINE_CONSTRAINTS = 1,
  GENERATE_SCHEDULE = 2,
  DISPLAY_RESULTS = 3
}
