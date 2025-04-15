
import React, { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
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
import { CalendarDays, Search, Plus, Database, User, Calendar, Clock } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Appointments = () => {
  const { doctors, patients } = useData();
  const [appointments, setAppointments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [queryResult, setQueryResult] = useState("");
  
  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    doctor_id: "",
    date: "",
    time: "",
    reason: "",
    status: "scheduled",
  });

  // Handler for input changes - updated to handle all input types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for select changes
  const handleSelectChange = (name: string, value: string) => {
    setNewAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch initial appointments and set up real-time subscription
  useEffect(() => {
    // Fetch initial appointments
    fetchAppointments();

    // Set up real-time subscription
    const channel = supabase
      .channel('appointments')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'appointments' }, 
        (payload) => {
          switch(payload.eventType) {
            case 'INSERT':
              setAppointments(prev => [...prev, payload.new]);
              break;
            case 'UPDATE':
              setAppointments(prev => 
                prev.map(apt => 
                  apt.id === payload.new.id ? payload.new : apt
                )
              );
              break;
            case 'DELETE':
              setAppointments(prev => 
                prev.filter(apt => apt.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('*');
    
    if (error) {
      toast({ 
        title: "Error", 
        description: "Failed to fetch appointments" 
      });
    } else {
      setAppointments(data);
    }
  };

  const handleAddAppointment = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        patient_id: newAppointment.patient_id,
        doctor_id: newAppointment.doctor_id,
        date: newAppointment.date,
        time: newAppointment.time,
        reason: newAppointment.reason,
        status: newAppointment.status
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add appointment"
      });
    } else {
      toast({
        title: "Appointment scheduled",
        description: "Appointment has been added successfully"
      });
      
      // Reset form
      setNewAppointment({
        patient_id: "",
        doctor_id: "",
        date: "",
        time: "",
        reason: "",
        status: "scheduled"
      });
    }
  };

  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    
    // Create and show query
    const query = `SELECT a.*, p.name as patient_name, d.name as doctor_name 
                   FROM appointments a 
                   JOIN patients p ON a.patient_id = p.id 
                   JOIN doctors d ON a.doctor_id = d.id 
                   WHERE a.id = '${appointment.id}'`;
    setQueryResult(query);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "scheduled": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const patient = patients.find(p => p.id === appointment.patient_id);
    const doctor = doctors.find(d => d.id === appointment.doctor_id);
    
    return (
      (patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const upcomingAppointments = filteredAppointments.filter(a => a.status === "scheduled");
  const completedAppointments = filteredAppointments.filter(a => a.status === "completed");
  const cancelledAppointments = filteredAppointments.filter(a => a.status === "cancelled");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Appointments</h1>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Fill in the details to schedule a new appointment.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient</Label>
                <Select 
                  value={newAppointment.patient_id}
                  onValueChange={(value) => handleSelectChange("patient_id", value)}
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
                <Label htmlFor="doctorId">Doctor</Label>
                <Select 
                  value={newAppointment.doctor_id}
                  onValueChange={(value) => handleSelectChange("doctor_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.map(doctor => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date"
                    value={newAppointment.date}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time" 
                    name="time" 
                    type="time"
                    value={newAppointment.time}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="reason">Reason</Label>
                <Input 
                  id="reason" 
                  name="reason" 
                  value={newAppointment.reason}
                  onChange={handleInputChange}
                  placeholder="Reason for appointment"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleAddAppointment}>Schedule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Appointments List</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search appointments..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upcoming">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                  <TabsTrigger value="all">All</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  <AppointmentTable 
                    appointments={upcomingAppointments} 
                    patients={patients}
                    doctors={doctors}
                    getStatusColor={getStatusColor}
                    onSelect={handleAppointmentSelect}
                    selectedId={selectedAppointment?.id}
                  />
                </TabsContent>
                
                <TabsContent value="completed">
                  <AppointmentTable 
                    appointments={completedAppointments} 
                    patients={patients}
                    doctors={doctors}
                    getStatusColor={getStatusColor}
                    onSelect={handleAppointmentSelect}
                    selectedId={selectedAppointment?.id}
                  />
                </TabsContent>
                
                <TabsContent value="cancelled">
                  <AppointmentTable 
                    appointments={cancelledAppointments} 
                    patients={patients}
                    doctors={doctors}
                    getStatusColor={getStatusColor}
                    onSelect={handleAppointmentSelect}
                    selectedId={selectedAppointment?.id}
                  />
                </TabsContent>
                
                <TabsContent value="all">
                  <AppointmentTable 
                    appointments={filteredAppointments} 
                    patients={patients}
                    doctors={doctors}
                    getStatusColor={getStatusColor}
                    onSelect={handleAppointmentSelect}
                    selectedId={selectedAppointment?.id}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          {selectedAppointment && (
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
          
          {selectedAppointment && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle>Appointment Details</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const patient = patients.find(p => p.id === selectedAppointment.patient_id);
                  const doctor = doctors.find(d => d.id === selectedAppointment.doctor_id);
                  
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
                        <User className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium">{doctor?.name}</p>
                          <p className="text-sm text-muted-foreground">{doctor?.specialization}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <Calendar className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="font-medium">{selectedAppointment.date}</p>
                          <p className="text-sm text-muted-foreground">Appointment Date</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <Clock className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="font-medium">{selectedAppointment.time}</p>
                          <p className="text-sm text-muted-foreground">Appointment Time</p>
                        </div>
                      </div>
                      
                      <div className="pb-2 border-b">
                        <p className="text-sm text-muted-foreground mb-1">Reason</p>
                        <p>{selectedAppointment.reason}</p>
                      </div>
                      
                      <div className="pb-2">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <Badge variant="outline" className={getStatusColor(selectedAppointment.status)}>
                          {selectedAppointment.status}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">Cancel</Button>
                        <Button size="sm" className="flex-1">Reschedule</Button>
                      </div>
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

const AppointmentTable = ({ 
  appointments, 
  patients,
  doctors,
  getStatusColor,
  onSelect,
  selectedId
}) => {
  const getPatientName = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : "Unknown Patient";
  };
  
  const getDoctorName = (doctorId) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : "Unknown Doctor";
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Doctor</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
              No appointments found
            </TableCell>
          </TableRow>
        ) : (
          appointments.map((appointment) => (
            <TableRow 
              key={appointment.id}
              className={selectedId === appointment.id ? "bg-muted/50" : ""}
              onClick={() => onSelect(appointment)}
            >
              <TableCell className="font-medium cursor-pointer">
                {getPatientName(appointment.patient_id)}
              </TableCell>
              <TableCell>{getDoctorName(appointment.doctor_id)}</TableCell>
              <TableCell>{appointment.date}</TableCell>
              <TableCell>{appointment.time}</TableCell>
              <TableCell>{appointment.reason}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getStatusColor(appointment.status)}>
                  {appointment.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default Appointments;
