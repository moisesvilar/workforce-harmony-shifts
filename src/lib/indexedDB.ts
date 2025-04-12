
import { Employee, Constraint, EmployeeShift } from '../types';

const DB_NAME = 'workforceHarmony';
const DB_VERSION = 1;
const EMPLOYEE_STORE = 'employees';
const CONSTRAINT_STORE = 'constraints';
const SHIFT_STORE = 'shifts';

let db: IDBDatabase | null = null;

export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(true);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Error opening IndexedDB:', event);
      reject(new Error('Could not open IndexedDB'));
    };

    request.onsuccess = (event) => {
      db = (event.target as IDBOpenDBRequest).result;
      resolve(true);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create employee store
      if (!db.objectStoreNames.contains(EMPLOYEE_STORE)) {
        db.createObjectStore(EMPLOYEE_STORE, { keyPath: 'id' });
      }
      
      // Create constraint store
      if (!db.objectStoreNames.contains(CONSTRAINT_STORE)) {
        db.createObjectStore(CONSTRAINT_STORE, { keyPath: 'id' });
      }
      
      // Create shift store
      if (!db.objectStoreNames.contains(SHIFT_STORE)) {
        db.createObjectStore(SHIFT_STORE, { keyPath: 'employeeId' });
      }
    };
  });
};

// Employee Operations
export const saveEmployees = async (employees: Employee[]): Promise<boolean> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(EMPLOYEE_STORE, 'readwrite');
    const store = transaction.objectStore(EMPLOYEE_STORE);
    
    // Clear existing employees first
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      let count = 0;
      employees.forEach((employee) => {
        const request = store.add(employee);
        request.onsuccess = () => {
          count++;
          if (count === employees.length) {
            resolve(true);
          }
        };
        request.onerror = (event) => {
          console.error('Error adding employee:', event);
          reject(new Error('Failed to add employee'));
        };
      });
    };
    
    clearRequest.onerror = (event) => {
      console.error('Error clearing employees:', event);
      reject(new Error('Failed to clear employees'));
    };
  });
};

export const getEmployees = async (): Promise<Employee[]> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(EMPLOYEE_STORE, 'readonly');
    const store = transaction.objectStore(EMPLOYEE_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Error fetching employees:', event);
      reject(new Error('Failed to fetch employees'));
    };
  });
};

// Constraint Operations
export const saveConstraint = async (constraint: Constraint): Promise<boolean> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(CONSTRAINT_STORE, 'readwrite');
    const store = transaction.objectStore(CONSTRAINT_STORE);
    const request = store.add(constraint);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      console.error('Error adding constraint:', event);
      reject(new Error('Failed to add constraint'));
    };
  });
};

export const getConstraints = async (): Promise<Constraint[]> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(CONSTRAINT_STORE, 'readonly');
    const store = transaction.objectStore(CONSTRAINT_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Error fetching constraints:', event);
      reject(new Error('Failed to fetch constraints'));
    };
  });
};

export const removeConstraint = async (id: string): Promise<boolean> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(CONSTRAINT_STORE, 'readwrite');
    const store = transaction.objectStore(CONSTRAINT_STORE);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      console.error('Error removing constraint:', event);
      reject(new Error('Failed to remove constraint'));
    };
  });
};

// Shift Operations
export const saveShifts = async (shifts: EmployeeShift[]): Promise<boolean> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(SHIFT_STORE, 'readwrite');
    const store = transaction.objectStore(SHIFT_STORE);
    
    // Clear existing shifts first
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = () => {
      let count = 0;
      shifts.forEach((shift) => {
        const request = store.add(shift);
        request.onsuccess = () => {
          count++;
          if (count === shifts.length) {
            resolve(true);
          }
        };
        request.onerror = (event) => {
          console.error('Error adding shift:', event);
          reject(new Error('Failed to add shift'));
        };
      });
    };
    
    clearRequest.onerror = (event) => {
      console.error('Error clearing shifts:', event);
      reject(new Error('Failed to clear shifts'));
    };
  });
};

export const getShifts = async (): Promise<EmployeeShift[]> => {
  await initDB();
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    const transaction = db.transaction(SHIFT_STORE, 'readonly');
    const store = transaction.objectStore(SHIFT_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Error fetching shifts:', event);
      reject(new Error('Failed to fetch shifts'));
    };
  });
};
