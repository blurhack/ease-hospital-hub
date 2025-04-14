
import { useState } from "react";
import { useData } from "@/contexts/DataContext";
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
import { CalendarDays, Search, Plus, Calendar, Database, User, Clock } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Appointments = () => {
  const { appointments, doctors, patients, executeSqlQuery } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<string>("");
  
  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    patientId: "",
    doctorId: "",
    date: "",
    time: "",
    reason: "",
    status: "scheduled" as "scheduled" | "completed" | "cancelled",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewAppointment({
      ...newAppointment,
      [name]: value,
    });
  };

  const handleAddAppointment = () => {
    // This would normally add the appointment to the database
    toast({
      title: "Appointment scheduled",
      description: `Appointment has been scheduled successfully.`,
    });
    
    // Reset form
    setNewAppointment({
      patientId: "",
      doctorId: "",
      date: "",
      time: "",
      reason: "",
      status: "scheduled",
    });
  };

  const handleAppointmentSelect = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    
    // Execute and show query
    const query = `SELECT a.*, p.name as patient_name, d.name as doctor_name 
                  FROM appointments a 
                  JOIN patients p ON a.patientId = p.id 
                  JOIN doctors d ON a.doctorId = d.id 
                  WHERE a.id = '${appointmentId}'`;
    setQueryResult(query);
  };

  const filteredAppointments = appointments.filter(appointment => {
    const patient = patients.find(p => p.id === appointment.patientId);
    const doctor = doctors.find(d => d.id === appointment.doctorId);
    
    return (
      (patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doctor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.status.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
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
  
  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    return doctor ? doctor.name : "Unknown Doctor";
  };

  // Categorize appointments by status
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
                  value={newAppointment.patientId}
                  onValueChange={(value) => setNewAppointment({...newAppointment, patientId: value})}
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
                  value={newAppointment.doctorId}
                  onValueChange={(value) => setNewAppointment({...newAppointment, doctorId: value})}
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
                    getPatientName={getPatientName}
                    getDoctorName={getDoctorName}
                    getStatusColor={getStatusColor}
                    onSelect={handleAppointmentSelect}
                    selectedId={selectedAppointment}
                  />
                </TabsContent>
                
                <TabsContent value="completed">
                  <AppointmentTable 
                    appointments={completedAppointments} 
                    getPatientName={getPatientName}
                    getDoctorName={getDoctorName}
                    getStatusColor={getStatusColor}
                    onSelect={handleAppointmentSelect}
                    selectedId={selectedAppointment}
                  />
                </TabsContent>
                
                <TabsContent value="cancelled">
                  <AppointmentTable 
                    appointments={cancelledAppointments} 
                    getPatientName={getPatientName}
                    getDoctorName={getDoctorName}
                    getStatusColor={getStatusColor}
                    onSelect={handleAppointmentSelect}
                    selectedId={selectedAppointment}
                  />
                </TabsContent>
                
                <TabsContent value="all">
                  <AppointmentTable 
                    appointments={filteredAppointments} 
                    getPatientName={getPatientName}
                    getDoctorName={getDoctorName}
                    getStatusColor={getStatusColor}
                    onSelect={handleAppointmentSelect}
                    selectedId={selectedAppointment}
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
                  const appointment = appointments.find(a => a.id === selectedAppointment);
                  if (!appointment) return null;
                  
                  const patient = patients.find(p => p.id === appointment.patientId);
                  const doctor = doctors.find(d => d.id === appointment.doctorId);
                  
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
                          <p className="font-medium">{appointment.date}</p>
                          <p className="text-sm text-muted-foreground">Appointment Date</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <Clock className="h-6 w-6 text-gray-600" />
                        <div>
                          <p className="font-medium">{appointment.time}</p>
                          <p className="text-sm text-muted-foreground">Appointment Time</p>
                        </div>
                      </div>
                      
                      <div className="pb-2 border-b">
                        <p className="text-sm text-muted-foreground mb-1">Reason</p>
                        <p>{appointment.reason}</p>
                      </div>
                      
                      <div className="pb-2">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <Badge variant="outline" className={getStatusColor(appointment.status)}>
                          {appointment.status}
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

// Appointment Table Component
const AppointmentTable = ({ 
  appointments, 
  getPatientName, 
  getDoctorName,
  getStatusColor,
  onSelect,
  selectedId
}: { 
  appointments: any[],
  getPatientName: (id: string) => string,
  getDoctorName: (id: string) => string,
  getStatusColor: (status: string) => string,
  onSelect: (id: string) => void,
  selectedId: string | null
}) => {
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
              onClick={() => onSelect(appointment.id)}
            >
              <TableCell className="font-medium cursor-pointer">
                {getPatientName(appointment.patientId)}
              </TableCell>
              <TableCell>{getDoctorName(appointment.doctorId)}</TableCell>
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
