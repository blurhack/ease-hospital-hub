
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, BedDouble, Calendar, CreditCard, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  const { user } = useAuth();
  const { doctors, patients, rooms, appointments, bills } = useData();
  
  // Calculate dashboard metrics
  const availableRooms = rooms.filter((room) => room.status === "available").length;
  const occupiedRooms = rooms.filter((room) => room.status === "occupied").length;
  
  const upcomingAppointments = appointments.filter(
    (appointment) => appointment.status === "scheduled"
  ).length;
  
  const pendingBills = bills.filter(
    (bill) => bill.status === "pending" || bill.status === "overdue"
  ).length;
  
  const totalRevenue = bills.reduce((sum, bill) => sum + bill.amount, 0);
  
  // Room occupancy data for chart
  const roomOccupancyData = [
    { name: "Available", value: availableRooms },
    { name: "Occupied", value: occupiedRooms },
    { name: "Maintenance", value: rooms.length - availableRooms - occupiedRooms },
  ];
  
  // Department data (based on doctor specializations)
  const specializations = doctors.reduce((acc, doctor) => {
    acc[doctor.specialization] = (acc[doctor.specialization] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const departmentData = Object.entries(specializations).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium">{user?.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Patients</p>
                <h3 className="text-2xl font-bold mt-1">{patients.length}</h3>
              </div>
              <div className="h-12 w-12 bg-mediease-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-mediease-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Room Status</p>
                <h3 className="text-2xl font-bold mt-1">{availableRooms} Available</h3>
              </div>
              <div className="h-12 w-12 bg-mediease-100 rounded-full flex items-center justify-center">
                <BedDouble className="h-6 w-6 text-mediease-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Appointments</p>
                <h3 className="text-2xl font-bold mt-1">{upcomingAppointments} Upcoming</h3>
              </div>
              <div className="h-12 w-12 bg-mediease-100 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-mediease-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Billing</p>
                <h3 className="text-2xl font-bold mt-1">${totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 bg-mediease-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-mediease-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Hospital Statistics</CardTitle>
            <CardDescription>Key metrics overview</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roomOccupancyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Doctors by specialization</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-mediease-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-mediease-600" />
                </div>
                <div>
                  <p className="font-medium">New patient registered</p>
                  <p className="text-sm text-muted-foreground">Maria Garcia was added</p>
                  <p className="text-xs text-muted-foreground mt-1">10 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-mediease-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-mediease-600" />
                </div>
                <div>
                  <p className="font-medium">Appointment scheduled</p>
                  <p className="text-sm text-muted-foreground">Follow-up with Dr. Chen</p>
                  <p className="text-xs text-muted-foreground mt-1">30 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="h-8 w-8 bg-mediease-100 rounded-full flex items-center justify-center">
                  <BedDouble className="h-4 w-4 text-mediease-600" />
                </div>
                <div>
                  <p className="font-medium">Room status changed</p>
                  <p className="text-sm text-muted-foreground">Room 201 is now occupied</p>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments
                .filter((app) => app.status === "scheduled")
                .slice(0, 3)
                .map((appointment) => {
                  const patient = patients.find((p) => p.id === appointment.patientId);
                  const doctor = doctors.find((d) => d.id === appointment.doctorId);
                  
                  return (
                    <div key={appointment.id} className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-mediease-100 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-mediease-600" />
                        </div>
                        <div>
                          <p className="font-medium">{patient?.name}</p>
                          <p className="text-sm text-muted-foreground">With {doctor?.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{appointment.date}</p>
                        <p className="text-sm text-muted-foreground">{appointment.time}</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
