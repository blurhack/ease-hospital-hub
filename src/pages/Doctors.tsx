import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Search, Edit, Trash2, Hospital, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { QueryCard } from "@/components/analytics/QueryCard";

// Define the Doctor type based on our Supabase table
type Doctor = {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  contact: string;
  email: string;
  availability: string;
  created_at: string;
};

// Create a schema for doctor form validation
const doctorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  specialization: z.string().min(2, "Specialization is required"),
  qualification: z.string().min(2, "Qualification is required"),
  experience: z.coerce.number().min(0, "Experience cannot be negative"),
  contact: z.string().min(5, "Contact information is required"),
  email: z.string().email("Invalid email address"),
  availability: z.string().min(3, "Availability schedule is required"),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [lastQuery, setLastQuery] = useState<string>("");
  const { toast } = useToast();
  
  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      name: "",
      specialization: "",
      qualification: "",
      experience: 0,
      contact: "",
      email: "",
      availability: "",
    },
  });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from("doctors")
        .select("*")
        .order("name");
      
      setLastQuery(`SELECT * FROM doctors ORDER BY name`);
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setDoctors(data || []);
      
      await supabase.from("analytics_logs").insert({
        action_type: "SELECT",
        table_name: "doctors",
        query: "SELECT * FROM doctors ORDER BY name",
        performed_by: "current_user",
      });
      
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast({
        title: "Error",
        description: "Failed to fetch doctors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('doctors-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'doctors' }, 
        () => {
          fetchDoctors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  useEffect(() => {
    fetchDoctors();
    const unsubscribe = setupRealtimeSubscription();
    
    return () => {
      unsubscribe();
    };
  }, []);

  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onSubmit = async (values: DoctorFormValues) => {
    try {
      let actionType = "INSERT";
      let query = `INSERT INTO doctors (name, specialization, qualification, experience, contact, email, availability) VALUES ('${values.name}', '${values.specialization}', '${values.qualification}', ${values.experience}, '${values.contact}', '${values.email}', '${values.availability}')`;
      
      if (editingDoctor) {
        actionType = "UPDATE";
        query = `UPDATE doctors SET name = '${values.name}', specialization = '${values.specialization}', qualification = '${values.qualification}', experience = ${values.experience}, contact = '${values.contact}', email = '${values.email}', availability = '${values.availability}' WHERE id = '${editingDoctor.id}'`;
        
        const { error } = await supabase
          .from("doctors")
          .update({
            name: values.name,
            specialization: values.specialization,
            qualification: values.qualification,
            experience: values.experience,
            contact: values.contact,
            email: values.email,
            availability: values.availability
          })
          .eq("id", editingDoctor.id);
        
        if (error) throw error;
        
        toast({
          title: "Doctor Updated",
          description: `Dr. ${values.name}'s information has been updated.`,
        });
      } else {
        const { error } = await supabase
          .from("doctors")
          .insert({
            name: values.name,
            specialization: values.specialization,
            qualification: values.qualification,
            experience: values.experience,
            contact: values.contact,
            email: values.email,
            availability: values.availability
          });
        
        if (error) throw error;
        
        toast({
          title: "Doctor Added",
          description: `Dr. ${values.name} has been added to the system.`,
        });
      }
      
      await supabase.from("analytics_logs").insert({
        action_type: actionType,
        table_name: "doctors",
        query: query,
        performed_by: "current_user",
      });
      
      setLastQuery(query);
      setOpenDialog(false);
      form.reset();
      setEditingDoctor(null);
    } catch (error) {
      console.error("Error saving doctor:", error);
      toast({
        title: "Error",
        description: "Failed to save doctor information. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDoctor = async (doctor: Doctor) => {
    if (confirm(`Are you sure you want to delete Dr. ${doctor.name}?`)) {
      try {
        const query = `DELETE FROM doctors WHERE id = '${doctor.id}'`;
        
        const { error } = await supabase
          .from("doctors")
          .delete()
          .eq("id", doctor.id);
        
        if (error) throw error;
        
        await supabase.from("analytics_logs").insert({
          action_type: "DELETE",
          table_name: "doctors",
          record_id: doctor.id,
          query: query,
          performed_by: "current_user",
        });
        
        setLastQuery(query);
        
        toast({
          title: "Doctor Removed",
          description: `Dr. ${doctor.name} has been removed from the system.`,
        });
      } catch (error) {
        console.error("Error deleting doctor:", error);
        toast({
          title: "Error",
          description: "Failed to delete doctor. There may be related records.",
          variant: "destructive",
        });
      }
    }
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    form.reset({
      name: doctor.name,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      contact: doctor.contact,
      email: doctor.email,
      availability: doctor.availability,
    });
    setOpenDialog(true);
  };

  const handleAddDoctor = () => {
    setEditingDoctor(null);
    form.reset({
      name: "",
      specialization: "",
      qualification: "",
      experience: 0,
      contact: "",
      email: "",
      availability: "",
    });
    setOpenDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Hospital className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Doctors Management</h1>
        </div>
        <Button onClick={handleAddDoctor}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Doctor
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>All Doctors</CardTitle>
              <div className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  placeholder="Search doctors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-xs"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-mediease-500" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Specialization</TableHead>
                      <TableHead>Qualification</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDoctors.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-24 text-center text-muted-foreground"
                        >
                          No doctors found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDoctors.map((doctor) => (
                        <TableRow key={doctor.id}>
                          <TableCell className="font-medium">
                            {doctor.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{doctor.specialization}</Badge>
                          </TableCell>
                          <TableCell>{doctor.qualification}</TableCell>
                          <TableCell>{doctor.experience} years</TableCell>
                          <TableCell>{doctor.contact}</TableCell>
                          <TableCell>{doctor.email}</TableCell>
                          <TableCell>{doctor.availability}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditDoctor(doctor)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteDoctor(doctor)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <QueryCard query={lastQuery} />
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingDoctor ? "Edit Doctor" : "Add New Doctor"}
            </DialogTitle>
            <DialogDescription>
              {editingDoctor
                ? "Update the doctor's information in the system."
                : "Fill in the details to add a new doctor to the system."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input placeholder="Cardiology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="MD, FACC" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience (years)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="john.smith@mediease.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="availability"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Availability Schedule</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Mon, Wed, Fri 9AM-5PM"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDoctor ? "Update Doctor" : "Add Doctor"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorsManagement;
