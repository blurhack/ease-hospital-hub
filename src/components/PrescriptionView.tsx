
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";

interface PrescriptionViewProps {
  doctorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Prescription {
  id: string;
  patient_id: string;
  patient: {
    name: string;
  };
  medication_id: string;
  medication: {
    name: string;
    dosage: string;
  };
  dosage: string;
  start_date: string;
  end_date: string | null;
  instructions: string | null;
}

const PrescriptionView = ({ doctorId, open, onOpenChange }: PrescriptionViewProps) => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && doctorId) {
      fetchPrescriptions();
    }
  }, [open, doctorId]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patient_medications')
        .select(`
          id,
          patient_id,
          patient:patients(name),
          medication_id,
          medication:medications(name, dosage),
          dosage,
          start_date,
          end_date,
          instructions
        `)
        .eq('doctor_id', doctorId);

      if (error) {
        throw error;
      }

      setPrescriptions(data as Prescription[]);
    } catch (error: any) {
      toast({
        title: "Error fetching prescriptions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isPrescriptionActive = (endDate: string | null) => {
    if (!endDate) return true;
    
    const today = new Date();
    const end = new Date(endDate);
    return end >= today;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Doctor's Prescriptions</DialogTitle>
          <DialogDescription>
            View all prescriptions written by this doctor
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No prescriptions found for this doctor.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Medication</TableHead>
                <TableHead>Dosage</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Instructions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.map((prescription) => (
                <TableRow key={prescription.id}>
                  <TableCell className="font-medium">{prescription.patient.name}</TableCell>
                  <TableCell>{prescription.medication.name}</TableCell>
                  <TableCell>{prescription.dosage}</TableCell>
                  <TableCell>{formatDate(prescription.start_date)}</TableCell>
                  <TableCell>{prescription.end_date ? formatDate(prescription.end_date) : 'Ongoing'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      isPrescriptionActive(prescription.end_date)
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }>
                      {isPrescriptionActive(prescription.end_date) ? 'Active' : 'Completed'}
                    </Badge>
                  </TableCell>
                  <TableCell>{prescription.instructions || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PrescriptionView;
