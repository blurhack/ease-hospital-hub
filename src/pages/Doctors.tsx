
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
import { UserRound, Search, Plus, Calendar, Mail, Phone, File, ArrowUpRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/components/ui/use-toast";
import PrescriptionView from "@/components/PrescriptionView";

const Doctors = () => {
  const { doctors: contextDoctors, addDoctor } = useData();
  const [doctors, setDoctors] = useState(contextDoctors);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  
  // New doctor form state
  const [newDoctor, setNewDoctor] = useState({
    name: "",
    specialization: "",
    qualification: "",
    experience: 0,
    contact: "",
    email: "",
    availability: "",
  });

  // Fetch doctors from Supabase
  const { data: supabaseDoctors, refetch: refetchDoctors } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('doctors').select('*');
      if (error) {
        toast({
          title: "Error fetching doctors",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      setDoctors(data || []);
      return data || [];
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewDoctor({
      ...newDoctor,
      [name]: name === "experience" ? Number(value) : value,
    });
  };

  const handleAddDoctor = async () => {
    try {
      // Insert the doctor into Supabase
      const { data, error } = await supabase.from('doctors').insert({
        name: newDoctor.name,
        specialization: newDoctor.specialization,
        qualification: newDoctor.qualification,
        experience: newDoctor.experience,
        contact: newDoctor.contact,
        email: newDoctor.email,
        availability: newDoctor.availability
      }).select();

      if (error) throw error;

      toast({
        title: "Doctor added",
        description: `Dr. ${newDoctor.name} has been added to the system.`,
      });
      
      // Reset form
      setNewDoctor({
        name: "",
        specialization: "",
        qualification: "",
        experience: 0,
        contact: "",
        email: "",
        availability: "",
      });
      
      // Refresh doctor list
      refetchDoctors();
    } catch (error: any) {
      toast({
        title: "Error adding doctor",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const viewPrescriptions = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    setShowPrescriptions(true);
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserRound className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Doctors</h1>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new doctor to the system.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={newDoctor.name}
                    onChange={handleInputChange}
                    placeholder="Dr. John Smith"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input 
                    id="specialization" 
                    name="specialization" 
                    value={newDoctor.specialization}
                    onChange={handleInputChange}
                    placeholder="e.g., Cardiology"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qualification">Qualification</Label>
                  <Input 
                    id="qualification" 
                    name="qualification" 
                    value={newDoctor.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g., MD, FACC"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience (years)</Label>
                  <Input 
                    id="experience" 
                    name="experience" 
                    type="number"
                    value={newDoctor.experience}
                    onChange={handleInputChange}
                    min={0}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Number</Label>
                  <Input 
                    id="contact" 
                    name="contact" 
                    value={newDoctor.contact}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email"
                    value={newDoctor.email}
                    onChange={handleInputChange}
                    placeholder="doctor@example.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input 
                  id="availability" 
                  name="availability" 
                  value={newDoctor.availability}
                  onChange={handleInputChange}
                  placeholder="e.g., Mon, Wed, Fri 9AM-5PM"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleAddDoctor}>Add Doctor</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>All Doctors</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search doctors..."
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
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                    No doctors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDoctors.map((doctor) => (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="font-medium">{doctor.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700">
                        {doctor.specialization}
                      </Badge>
                    </TableCell>
                    <TableCell>{doctor.experience} years</TableCell>
                    <TableCell>{doctor.qualification}</TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
                          {doctor.contact}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
                          {doctor.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-sm">{doctor.availability}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewPrescriptions(doctor.id)}
                        >
                          <File className="h-3 w-3 mr-1" />
                          Prescriptions
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Prescriptions Dialog */}
      {selectedDoctor && (
        <PrescriptionView 
          doctorId={selectedDoctor}
          open={showPrescriptions}
          onOpenChange={setShowPrescriptions}
        />
      )}
    </div>
  );
};

export default Doctors;
