
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Constraint } from '@/types';
import { saveConstraint, getConstraints, removeConstraint } from '@/lib/indexedDB';

interface DefineConstraintsProps {
  onComplete: (constraints: Constraint[]) => void;
}

const DefineConstraints: React.FC<DefineConstraintsProps> = ({ onComplete }) => {
  const [constraintText, setConstraintText] = useState('');
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing constraints on mount
  useEffect(() => {
    const loadConstraints = async () => {
      try {
        setIsLoading(true);
        const loadedConstraints = await getConstraints();
        setConstraints(loadedConstraints);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading constraints:', error);
        toast.error('Failed to load existing constraints');
        setIsLoading(false);
      }
    };

    loadConstraints();
  }, []);

  const handleAddConstraint = async () => {
    if (!constraintText.trim()) {
      toast.error('Please enter a constraint');
      return;
    }

    // Check if the constraint already exists
    if (constraints.some(c => c.text.toLowerCase() === constraintText.trim().toLowerCase())) {
      toast.error('This constraint already exists');
      return;
    }

    try {
      setIsLoading(true);
      const newConstraint: Constraint = {
        id: Date.now().toString(), // Simple unique ID
        text: constraintText.trim()
      };

      await saveConstraint(newConstraint);
      setConstraints([...constraints, newConstraint]);
      setConstraintText('');
      setIsLoading(false);
    } catch (error) {
      console.error('Error adding constraint:', error);
      toast.error('Failed to add constraint');
      setIsLoading(false);
    }
  };

  const handleRemoveConstraint = async (id: string) => {
    try {
      setIsLoading(true);
      await removeConstraint(id);
      setConstraints(constraints.filter(c => c.id !== id));
      setIsLoading(false);
    } catch (error) {
      console.error('Error removing constraint:', error);
      toast.error('Failed to remove constraint');
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    onComplete(constraints);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-harmony-700">Define Scheduling Constraints</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="bg-harmony-50 p-4 rounded-lg">
            <h3 className="text-harmony-700 font-medium mb-2">What are constraints?</h3>
            <p className="text-sm text-harmony-600">
              Constraints define rules that the schedule generator will respect. For example:
            </p>
            <ul className="list-disc list-inside text-sm mt-2 text-harmony-600">
              <li>No one can work more than 5 days per week</li>
              <li>No one can work more than 8 hours per day</li>
              <li>If an employee works more than 30 hours per week, then they must have one free whole weekend per month</li>
            </ul>
          </div>

          <div className="space-y-2">
            <label htmlFor="constraint" className="text-sm font-medium text-harmony-700">
              Add a constraint (using natural language)
            </label>
            <div className="flex space-x-2">
              <Input
                id="constraint"
                value={constraintText}
                onChange={(e) => setConstraintText(e.target.value)}
                placeholder="Enter a scheduling constraint..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                variant="default"
                className="bg-harmony-600 hover:bg-harmony-700"
                onClick={handleAddConstraint}
                disabled={isLoading || !constraintText.trim()}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-harmony-700">Added Constraints</h3>
          {constraints.length > 0 ? (
            <ul className="space-y-2">
              {constraints.map((constraint) => (
                <li
                  key={constraint.id}
                  className="flex items-start justify-between p-2 rounded-md bg-harmony-50"
                >
                  <span className="text-sm text-harmony-700">{constraint.text}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-6 w-6 p-0 text-harmony-500 hover:text-harmony-700 hover:bg-harmony-100"
                    onClick={() => handleRemoveConstraint(constraint.id)}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground p-2">
              No constraints added yet. This step is optional - you can continue without adding constraints.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          variant="default"
          className="bg-harmony-600 hover:bg-harmony-700"
          onClick={handleContinue}
        >
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DefineConstraints;
