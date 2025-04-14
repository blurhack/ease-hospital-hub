
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { User, Users, PlusCircle, Search, Trash2, FileEdit, UserCheck, AlertCircle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QueryCard } from "@/components/analytics/QueryCard";

// Form schema for adding/editing patients
const patientFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(0, "Age must be a positive number"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  bloodGroup: z.string().min(1, "Blood group is required"),
  contact: z.string().min(5, "Contact must be at least 5 characters"),
  email: z.string().email("Invalid email format"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  medicalHistory: z.string().optional(),
  assignedDoctorId: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

const Patients = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  
  const { toast: uiToast } = useToast();
  const queryClient = useQueryClient();

  // Form setup for adding/editing patients
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: "",
      age: 0,
      gender: "male",
      bloodGroup: "",
      contact: "",
      email: "",
      address: "",
      medicalHistory: "",
      assignedDoctorId: undefined,
    },
  });

  // Fetch doctors for the dropdown
  const { data: doctors = [] } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("doctors")
        .select("id, name, specialization");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch patients with assigned doctor information
  const { data: patients = [], isLoading, refetch } = useQuery({
    queryKey: ["patients", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("patients")
        .select(`
          *,
          assigned_doctor:doctors(id, name, specialization)
        `);
      
      // Store the raw SQL query
      const queryString = `SELECT patients.*, doctors.id, doctors.name, doctors.specialization 
                          FROM patients 
                          LEFT JOIN doctors ON patients.assigned_doctor_id = doctors.id`;
      setLastQuery(queryString);
      
      // Apply search filter if provided
      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%, email.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Log this view in analytics_logs
      await supabase.from("analytics_logs").insert({
        action_type: "SELECT",
        table_name: "patients",
        query: queryString + (searchQuery ? ` WHERE name ILIKE '%${searchQuery}%' OR email ILIKE '%${searchQuery}%'` : ""),
        performed_by: "current_user",
      });
      
      return data;
    },
  });

  // Reset form when dialog is opened or edit mode changes
  useEffect(() => {
    if (isAddDialogOpen) {
      form.reset({
        name: "",
        age: 0,
        gender: "male",
        bloodGroup: "",
        contact: "",
        email: "",
        address: "",
        medicalHistory: "",
        assignedDoctorId: undefined,
      });
    } else if (isEditDialogOpen && selectedPatient) {
      form.reset({
        name: selectedPatient.name,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        bloodGroup: selectedPatient.blood_group,
        contact: selectedPatient.contact,
        email: selectedPatient.email,
        address: selectedPatient.address,
        medicalHistory: selectedPatient.medical_history || "",
        assignedDoctorId: selectedPatient.assigned_doctor_id,
      });
    }
  }, [isAddDialogOpen, isEditDialogOpen, selectedPatient, form]);

  // Handle form submission for adding/editing patients
  const onSubmit = async (values: PatientFormValues) => {
    try {
      if (isEditMode && selectedPatient) {
        // Update existing patient
        const { error } = await supabase
          .from("patients")
          .update({
            name: values.name,
            age: values.age,
            gender: values.gender,
            blood_group: values.bloodGroup,
            contact: values.contact,
            email: values.email,
            address: values.address,
            medical_history: values.medicalHistory,
            assigned_doctor_id: values.assignedDoctorId,
          })
          .eq("id", selectedPatient.id);

        const updateQuery = `UPDATE patients SET 
                           name = '${values.name}', 
                           age = ${values.age}, 
                           gender = '${values.gender}', 
                           blood_group = '${values.bloodGroup}', 
                           contact = '${values.contact}', 
                           email = '${values.email}', 
                           address = '${values.address}', 
                           medical_history = '${values.medicalHistory || ""}', 
                           assigned_doctor_id = ${values.assignedDoctorId ? `'${values.assignedDoctorId}'` : null} 
                           WHERE id = '${selectedPatient.id}'`;
        
        setLastQuery(updateQuery);
        
        // Log this update in analytics_logs
        await supabase.from("analytics_logs").insert({
          action_type: "UPDATE",
          table_name: "patients",
          record_id: selectedPatient.id,
          query: updateQuery,
          performed_by: "current_user",
        });

        if (error) throw error;
        
        toast.success("Patient updated successfully");
        setIsEditDialogOpen(false);
      } else {
        // Add new patient
        const { data, error } = await supabase
          .from("patients")
          .insert({
            name: values.name,
            age: values.age,
            gender: values.gender,
            blood_group: values.bloodGroup,
            contact: values.contact,
            email: values.email,
            address: values.address,
            medical_history: values.medicalHistory,
            assigned_doctor_id: values.assignedDoctorId,
          })
          .select();

        const insertQuery = `INSERT INTO patients (name, age, gender, blood_group, contact, email, address, medical_history, assigned_doctor_id) 
                           VALUES ('${values.name}', ${values.age}, '${values.gender}', '${values.bloodGroup}', '${values.contact}', 
                           '${values.email}', '${values.address}', '${values.medicalHistory || ""}', ${values.assignedDoctorId ? `'${values.assignedDoctorId}'` : null})`;
        
        setLastQuery(insertQuery);
        
        // Log this insert in analytics_logs
        await supabase.from("analytics_logs").insert({
          action_type: "INSERT",
          table_name: "patients",
          query: insertQuery,
          performed_by: "current_user",
        });

        if (error) throw error;
        
        toast.success("Patient added successfully");
        setIsAddDialogOpen(false);
      }
      
      // Refresh the patient list
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      refetch();
    } catch (error) {
      console.error("Error:", error);
      uiToast({
        title: "Error",
        description: "Failed to save patient information",
        variant: "destructive",
      });
    }
  };

  // Delete patient
  const handleDelete = async () => {
    if (!selectedPatient) return;
    
    try {
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", selectedPatient.id);

      const deleteQuery = `DELETE FROM patients WHERE id = '${selectedPatient.id}'`;
      setLastQuery(deleteQuery);
      
      // Log this delete in analytics_logs
      await supabase.from("analytics_logs").insert({
        action_type: "DELETE",
        table_name: "patients",
        record_id: selectedPatient.id,
        query: deleteQuery,
        performed_by: "current_user",
      });

      if (error) throw error;
      
      toast.success("Patient deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedPatient(null);
      
      // Refresh the patient list
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      refetch();
    } catch (error) {
      console.error("Error:", error);
      uiToast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Patients Management</h1>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
          <CardDescription>
            View and manage all patient information
          </CardDescription>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients by name or email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-mediease-500" />
            </div>
          ) : patients.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No patients found</AlertTitle>
              <AlertDescription>
                There are no patients in the system that match your search criteria.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Blood Group</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Assigned Doctor</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">{patient.name}</TableCell>
                      <TableCell>{patient.age}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{patient.blood_group}</TableCell>
                      <TableCell>{patient.contact}</TableCell>
                      <TableCell>
                        {patient.assigned_doctor ? (
                          <div className="flex items-center">
                            <UserCheck className="mr-1 h-3 w-3 text-green-500" />
                            <span>
                              {patient.assigned_doctor.name}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({patient.assigned_doctor.specialization})
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {patient.last_visit
                          ? new Date(patient.last_visit).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setIsEditMode(true);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <FileEdit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-4">
          <div className="text-sm text-muted-foreground">
            Showing {patients.length} patients
          </div>
        </CardFooter>
      </Card>

      <QueryCard query={lastQuery} />

      {/* Add Patient Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the details of the new patient below
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="+1 123-456-7890" {...field} />
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
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Anytown, USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical History</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any relevant medical history..."
                            className="h-20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="assignedDoctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Doctor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a doctor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name} ({doctor.specialization})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Assign a doctor to this patient for regular consultation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Add Patient</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Patient Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Patient Information</DialogTitle>
            <DialogDescription>
              Update the patient's details below
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloodGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select blood group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="+1 123-456-7890" {...field} />
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
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St, Anytown, USA" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="medicalHistory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical History</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter any relevant medical history..."
                            className="h-20 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-2">
                  <FormField
                    control={form.control}
                    name="assignedDoctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Doctor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a doctor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {doctors.map((doctor) => (
                              <SelectItem key={doctor.id} value={doctor.id}>
                                {doctor.name} ({doctor.specialization})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Assign a doctor to this patient for regular consultation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Update Patient</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this patient? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;
