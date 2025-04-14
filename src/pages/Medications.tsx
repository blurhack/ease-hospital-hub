
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Search, Plus, Database, Pill, Calendar, User, Clock, CheckCircle2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the Medication type
type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  notes: string;
};

// Define the MedicationGiven type
type MedicationGiven = {
  id: string;
  medicationId: string;
  patientId: string;
  adminTime: string;
  adminDate: string;
  givenBy: string;
  status: "scheduled" | "administered" | "skipped";
};

const Medications = () => {
  // Mock data for medications
  const [medications] = useState<Medication[]>([
    {
      id: "med1",
      name: "Amoxicillin",
      dosage: "500mg",
      frequency: "3 times daily",
      notes: "Take with food",
    },
    {
      id: "med2",
      name: "Ibuprofen",
      dosage: "400mg",
      frequency: "Every 6 hours as needed",
      notes: "For pain relief",
    },
    {
      id: "med3",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Once daily",
      notes: "For blood pressure control",
    }
  ]);
  
  // Mock data for medication administration
  const [medicationsGiven, setMedicationsGiven] = useState<MedicationGiven[]>([
    {
      id: "mg1",
      medicationId: "med1",
      patientId: "p1",
      adminTime: "09:00 AM",
      adminDate: "2023-06-15",
      givenBy: "Nurse Johnson",
      status: "administered",
    },
    {
      id: "mg2",
      medicationId: "med2",
      patientId: "p2",
      adminTime: "02:00 PM",
      adminDate: "2023-06-15",
      givenBy: "Nurse Smith",
      status: "administered",
    },
    {
      id: "mg3",
      medicationId: "med3",
      patientId: "p3",
      adminTime: "10:30 AM",
      adminDate: "2023-06-15",
      givenBy: "Nurse Davis",
      status: "administered",
    },
    {
      id: "mg4",
      medicationId: "med1",
      patientId: "p1",
      adminTime: "09:00 AM",
      adminDate: "2023-06-16",
      givenBy: "",
      status: "scheduled",
    },
    {
      id: "mg5",
      medicationId: "med2",
      patientId: "p2",
      adminTime: "02:00 PM",
      adminDate: "2023-06-16",
      givenBy: "",
      status: "scheduled",
    }
  ]);
  
  const { patients, executeSqlQuery } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMedGiven, setSelectedMedGiven] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<string>("");
  
  // New medication administration form state
  const [newMedGiven, setNewMedGiven] = useState({
    medicationId: "",
    patientId: "",
    adminTime: "",
    adminDate: "",
    status: "scheduled" as "scheduled" | "administered" | "skipped",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMedGiven({
      ...newMedGiven,
      [name]: value,
    });
  };

  const handleAddMedGiven = () => {
    // This would normally add the medication administration to the database
    const newId = `mg${medicationsGiven.length + 1}`;
    const newMedication: MedicationGiven = {
      id: newId,
      ...newMedGiven,
      givenBy: "",
    };
    
    setMedicationsGiven([...medicationsGiven, newMedication]);
    
    toast({
      title: "Medication scheduled",
      description: `Medication has been scheduled successfully.`,
    });
    
    // Reset form
    setNewMedGiven({
      medicationId: "",
      patientId: "",
      adminTime: "",
      adminDate: "",
      status: "scheduled",
    });
  };

  const handleMedGivenSelect = (medGivenId: string) => {
    setSelectedMedGiven(medGivenId);
    
    // Execute and show query
    const query = `SELECT mg.*, m.name as medication_name, p.name as patient_name 
                  FROM medication_given mg 
                  JOIN medications m ON mg.medicationId = m.id 
                  JOIN patients p ON mg.patientId = p.id 
                  WHERE mg.id = '${medGivenId}'`;
    setQueryResult(query);
  };

  const handleAdministerMed = (medGivenId: string) => {
    setMedicationsGiven(medicationsGiven.map(mg => 
      mg.id === medGivenId ? 
      { ...mg, status: "administered" as const, givenBy: "Current User" } : 
      mg
    ));
    
    toast({
      title: "Medication administered",
      description: `Medication has been marked as administered.`,
    });
    
    // Execute and show query
    const query = `UPDATE medication_given 
                  SET status = 'administered', givenBy = 'Current User' 
                  WHERE id = '${medGivenId}'`;
    setQueryResult(query);
  };

  const filteredMedGiven = medicationsGiven.filter(mg => {
    const patient = patients.find(p => p.id === mg.patientId);
    const medication = medications.find(m => m.id === mg.medicationId);
    
    return (
      (patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      medication?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mg.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "administered":
        return "bg-green-100 text-green-800";
      case "skipped":
        return "bg-red-100 text-red-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : "Unknown Patient";
  };
  
  const getMedicationName = (medicationId: string) => {
    const medication = medications.find(m => m.id === medicationId);
    return medication ? medication.name : "Unknown Medication";
  };

  const getMedicationDosage = (medicationId: string) => {
    const medication = medications.find(m => m.id === medicationId);
    return medication ? medication.dosage : "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pill className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Medications</h1>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Medication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Medication</DialogTitle>
              <DialogDescription>
                Fill in the details to schedule a medication for a patient.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient</Label>
                <Select 
                  value={newMedGiven.patientId}
                  onValueChange={(value) => setNewMedGiven({...newMedGiven, patientId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medicationId">Medication</Label>
                <Select 
                  value={newMedGiven.medicationId}
                  onValueChange={(value) => setNewMedGiven({...newMedGiven, medicationId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map(medication => (
                      <SelectItem key={medication.id} value={medication.id}>
                        {medication.name} - {medication.dosage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adminDate">Date</Label>
                  <Input 
                    id="adminDate" 
                    name="adminDate" 
                    type="date"
                    value={newMedGiven.adminDate}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="adminTime">Time</Label>
                  <Input 
                    id="adminTime" 
                    name="adminTime" 
                    type="time"
                    value={newMedGiven.adminTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleAddMedGiven}>Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Medication Administration</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search medications..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Medication</TableHead>
                    <TableHead>Dosage</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedGiven.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No medications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMedGiven.map((medGiven) => (
                      <TableRow 
                        key={medGiven.id}
                        className={selectedMedGiven === medGiven.id ? "bg-muted/50" : ""}
                      >
                        <TableCell 
                          className="font-medium cursor-pointer hover:text-mediease-600 transition-colors"
                          onClick={() => handleMedGivenSelect(medGiven.id)}
                        >
                          {getPatientName(medGiven.patientId)}
                        </TableCell>
                        <TableCell>{getMedicationName(medGiven.medicationId)}</TableCell>
                        <TableCell>{getMedicationDosage(medGiven.medicationId)}</TableCell>
                        <TableCell>{medGiven.adminDate}</TableCell>
                        <TableCell>{medGiven.adminTime}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(medGiven.status)}>
                            {medGiven.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {medGiven.status === "scheduled" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAdministerMed(medGiven.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" /> 
                              Administer
                            </Button>
                          )}
                          {medGiven.status !== "scheduled" && (
                            <span className="text-sm text-muted-foreground">
                              {medGiven.givenBy || "-"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          {selectedMedGiven && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  SQL Query
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto">
                  {queryResult}
                </div>
              </CardContent>
            </Card>
          )}
          
          {selectedMedGiven && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle>Medication Details</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const medGiven = medicationsGiven.find(mg => mg.id === selectedMedGiven);
                  if (!medGiven) return null;
                  
                  const patient = patients.find(p => p.id === medGiven.patientId);
                  const medication = medications.find(m => m.id === medGiven.medicationId);
                  
                  if (!medication) return null;
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <User className="h-6 w-6 text-mediease-600" />
                        <div>
                          <p className="font-medium">{patient?.name}</p>
                          <p className="text-sm text-muted-foreground">Patient</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <Pill className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium">{medication.name}</p>
                          <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <Calendar className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="font-medium">{medGiven.adminDate}</p>
                          <p className="text-sm text-muted-foreground">Administration Date</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <Clock className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="font-medium">{medGiven.adminTime}</p>
                          <p className="text-sm text-muted-foreground">Administration Time</p>
                        </div>
                      </div>
                      
                      <div className="pb-2 border-b">
                        <p className="text-sm text-muted-foreground mb-1">Administration Notes</p>
                        <p>{medication.notes}</p>
                      </div>
                      
                      <div className="pb-2 border-b">
                        <p className="text-sm text-muted-foreground mb-1">Frequency</p>
                        <p>{medication.frequency}</p>
                      </div>
                      
                      <div className="pb-2">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <Badge variant="outline" className={getStatusColor(medGiven.status)}>
                          {medGiven.status}
                        </Badge>
                      </div>
                      
                      {medGiven.status === "scheduled" && (
                        <div className="flex gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => {
                              setMedicationsGiven(medicationsGiven.map(mg => 
                                mg.id === medGiven.id ? 
                                { ...mg, status: "skipped" as const } : 
                                mg
                              ));
                              
                              toast({
                                title: "Medication skipped",
                                description: `Medication has been marked as skipped.`,
                              });
                            }}
                          >
                            Skip
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleAdministerMed(medGiven.id)}
                          >
                            Administer
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Medications;
