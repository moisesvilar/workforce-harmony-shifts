
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { FileUp, FileCheck } from 'lucide-react';
import { parseExcelFile, processEmployeeData } from '@/lib/excelParser';
import { saveEmployees } from '@/lib/indexedDB';
import { Employee } from '@/types';

interface UploadEmployeeDataProps {
  onComplete: (employees: Employee[]) => void;
}

const UploadEmployeeData: React.FC<UploadEmployeeDataProps> = ({ onComplete }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<{ headers: string[], rows: any[] } | null>(null);
  const [parsedEmployees, setParsedEmployees] = useState<Employee[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessPreview, setShowSuccessPreview] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // Check if the file is an Excel file
      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
          file.type !== 'application/vnd.ms-excel') {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      
      setSelectedFile(file);
      setPreviewData(null);
      setParsedEmployees(null);
      showPreview(file);
    }
  };

  const showPreview = async (file: File) => {
    try {
      setIsProcessing(true);
      const { data, headers } = await parseExcelFile(file);
      
      // Only show the first 10 rows in the preview
      setPreviewData({
        headers,
        rows: data.slice(0, 10)
      });
      
      // Parse all data but don't display it yet
      const employees = processEmployeeData(data, headers);
      setParsedEmployees(employees);
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Error parsing the Excel file. Please make sure it has the correct format.');
      setIsProcessing(false);
    }
  };

  const handleCancelPreview = () => {
    setPreviewData(null);
    setParsedEmployees(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmData = async () => {
    if (!parsedEmployees) {
      toast.error('No employee data to save');
      return;
    }
    
    try {
      setIsProcessing(true);
      await saveEmployees(parsedEmployees);
      setShowSuccessPreview(true);
      setIsProcessing(false);
    } catch (error) {
      console.error('Error saving employee data:', error);
      toast.error('Failed to save employee data');
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (parsedEmployees) {
      onComplete(parsedEmployees);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-harmony-700">Upload Employee Information</CardTitle>
      </CardHeader>
      <CardContent>
        {!previewData && !showSuccessPreview ? (
          <div className="space-y-6">
            <div className="border-2 border-dashed border-harmony-200 rounded-lg p-10 text-center">
              <FileUp className="h-10 w-10 mb-4 text-harmony-400 mx-auto" />
              <h3 className="text-lg font-medium text-harmony-700 mb-2">Select an Excel File</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload an Excel file (.xlsx) containing employee information
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".xlsx,.xls"
              />
              <Button 
                variant="default" 
                className="bg-harmony-600 hover:bg-harmony-700"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                Select File
              </Button>
              
              {selectedFile && (
                <p className="mt-4 text-sm text-harmony-600">
                  Selected: {selectedFile.name}
                </p>
              )}
              
              {isProcessing && (
                <div className="mt-4 text-sm text-harmony-600">
                  Processing file...
                </div>
              )}
            </div>
            
            <div className="bg-harmony-50 p-4 rounded-lg">
              <h4 className="font-medium text-harmony-700 mb-2">Required Columns</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-harmony-600">
                <li>ID: Employee identifier</li>
                <li>PEOPLE: Employee name</li>
                <li>SECTION: Department or section</li>
                <li>GROUPING: Team or group</li>
                <li>JOB: Job position</li>
                <li>ROLE: Additional job role (optional)</li>
                <li>CONTRACT: Type of employment contract</li>
                <li>HOURS: Weekly working hours</li>
                <li>STATUS: Employee status</li>
              </ul>
            </div>
          </div>
        ) : showSuccessPreview ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-100 rounded-lg p-6 text-center">
              <FileCheck className="h-10 w-10 mb-4 text-green-500 mx-auto" />
              <h3 className="text-lg font-medium text-green-700 mb-2">Everything was fine!</h3>
              <p className="text-sm text-green-600 mb-4">
                Employee data has been successfully processed and stored.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <h4 className="font-medium text-harmony-700 mb-2">Preview (First 10 Employees)</h4>
              <table className="min-w-full divide-y divide-harmony-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 bg-harmony-50 text-left text-xs font-medium text-harmony-700 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-2 bg-harmony-50 text-left text-xs font-medium text-harmony-700 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-2 bg-harmony-50 text-left text-xs font-medium text-harmony-700 uppercase tracking-wider">Section</th>
                    <th className="px-4 py-2 bg-harmony-50 text-left text-xs font-medium text-harmony-700 uppercase tracking-wider">Job</th>
                    <th className="px-4 py-2 bg-harmony-50 text-left text-xs font-medium text-harmony-700 uppercase tracking-wider">Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-harmony-200">
                  {parsedEmployees?.slice(0, 10).map((employee, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-harmony-50' : 'bg-white'}>
                      <td className="px-4 py-2 text-sm">{employee.id}</td>
                      <td className="px-4 py-2 text-sm">{employee.name}</td>
                      <td className="px-4 py-2 text-sm">{employee.section}</td>
                      <td className="px-4 py-2 text-sm">{employee.job}</td>
                      <td className="px-4 py-2 text-sm">{employee.hours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="font-medium text-harmony-700">Preview the data before confirming</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-harmony-200">
                <thead className="bg-harmony-50">
                  <tr>
                    {previewData?.headers.map((header, index) => (
                      <th 
                        key={index}
                        className="px-4 py-2 text-left text-xs font-medium text-harmony-700 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-harmony-200">
                  {previewData?.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-harmony-50' : 'bg-white'}>
                      {previewData.headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-4 py-2 text-sm">
                          {row[colIndex] !== undefined ? String(row[colIndex]) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        {previewData && !showSuccessPreview && (
          <>
            <Button 
              variant="outline" 
              onClick={handleCancelPreview}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="default"
              className="bg-harmony-600 hover:bg-harmony-700"
              onClick={handleConfirmData}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'OK'}
            </Button>
          </>
        )}
        {showSuccessPreview && (
          <Button 
            variant="default"
            className="bg-harmony-600 hover:bg-harmony-700"
            onClick={handleContinue}
          >
            Continue
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default UploadEmployeeData;
