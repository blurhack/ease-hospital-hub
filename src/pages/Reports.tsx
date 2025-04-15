
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Calendar, Filter, Database, BarChart, PieChart, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { format } from "date-fns";
import { QueryCard } from "@/components/analytics/QueryCard";

const Reports = () => {
  const [reportType, setReportType] = useState("appointments");
  const [dateRange, setDateRange] = useState("week");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange, startDate, endDate]);

  const getDateRangeFilter = () => {
    const now = new Date();
    let start = new Date();
    
    if (dateRange === "week") {
      start.setDate(now.getDate() - 7);
    } else if (dateRange === "month") {
      start.setMonth(now.getMonth() - 1);
    } else if (dateRange === "year") {
      start.setFullYear(now.getFullYear() - 1);
    } else if (dateRange === "custom" && startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    
    return { start, end: now };
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getDateRangeFilter();
      
      if (dateRange === "custom" && (!start || !end)) {
        // Don't fetch if custom range is selected but dates aren't set
        return;
      }
      
      let query;
      let queryString = "";
      
      if (reportType === "appointments") {
        query = supabase
          .from("appointments")
          .select(`
            *,
            doctor:doctors(id, name, specialization),
            patient:patients(id, name)
          `);
          
        queryString = `SELECT appointments.*, doctors.id, doctors.name, doctors.specialization, patients.id, patients.name 
                      FROM appointments 
                      JOIN doctors ON appointments.doctor_id = doctors.id 
                      JOIN patients ON appointments.patient_id = patients.id`;
        
        if (dateRange !== "all") {
          query = query.gte("date", format(start, "yyyy-MM-dd"));
          query = query.lte("date", format(end, "yyyy-MM-dd"));
          
          queryString += ` WHERE appointments.date >= '${format(start, "yyyy-MM-dd")}' 
                         AND appointments.date <= '${format(end, "yyyy-MM-dd")}'`;
        }
      } else if (reportType === "billing") {
        query = supabase
          .from("bills")
          .select(`
            *,
            patient:patients(id, name)
          `);
          
        queryString = `SELECT bills.*, patients.id, patients.name 
                      FROM bills 
                      JOIN patients ON bills.patient_id = patients.id`;
        
        if (dateRange !== "all") {
          query = query.gte("date", start.toISOString());
          query = query.lte("date", end.toISOString());
          
          queryString += ` WHERE bills.date >= '${start.toISOString()}' 
                         AND bills.date <= '${end.toISOString()}'`;
        }
      } else if (reportType === "patients") {
        query = supabase
          .from("patients")
          .select(`
            *,
            assigned_doctor:doctors(id, name, specialization)
          `);
          
        queryString = `SELECT patients.*, doctors.id, doctors.name, doctors.specialization 
                      FROM patients 
                      LEFT JOIN doctors ON patients.assigned_doctor_id = doctors.id`;
        
        if (dateRange !== "all") {
          query = query.gte("created_at", start.toISOString());
          query = query.lte("created_at", end.toISOString());
          
          queryString += ` WHERE patients.created_at >= '${start.toISOString()}' 
                         AND patients.created_at <= '${end.toISOString()}'`;
        }
      } else if (reportType === "rooms") {
        query = supabase.from("rooms").select("*");
          
        queryString = `SELECT * FROM rooms`;
        
        // No date filtering for rooms report
      }
      
      setLastQuery(queryString);
      
      // Log this report view in analytics_logs
      await supabase.from("analytics_logs").insert({
        action_type: "SELECT",
        table_name: reportType,
        query: queryString,
        performed_by: "current_user",
      });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setReportData(data || []);
    } catch (error) {
      console.error("Error fetching report data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch report data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!reportData.length) return;
    
    // Format the data based on report type
    let csvContent = "";
    
    if (reportType === "appointments") {
      csvContent = "ID,Patient,Doctor,Date,Time,Status,Reason\n";
      reportData.forEach((appointment) => {
        // Check if appointment.patient and appointment.doctor exist before accessing their properties
        const patientName = appointment.patient?.name || "Unknown";
        const doctorName = appointment.doctor?.name || "Unknown";
        csvContent += `${appointment.id},${patientName},${doctorName},${appointment.date},${appointment.time},${appointment.status},${appointment.reason || ""}\n`;
      });
    } else if (reportType === "billing") {
      csvContent = "ID,Patient,Date,Amount,Status\n";
      reportData.forEach((bill) => {
        // Check if bill.patient exists before accessing its properties
        const patientName = bill.patient?.name || "Unknown";
        csvContent += `${bill.id},${patientName},${new Date(bill.date).toLocaleDateString()},${bill.amount},${bill.status}\n`;
      });
    } else if (reportType === "patients") {
      csvContent = "ID,Name,Age,Gender,Blood Group,Contact,Email,Address,Doctor\n";
      reportData.forEach((patient) => {
        // Check if patient.assigned_doctor exists before accessing its properties
        const doctorInfo = patient.assigned_doctor 
          ? `${patient.assigned_doctor.name} (${patient.assigned_doctor.specialization})` 
          : "None";
        csvContent += `${patient.id},${patient.name},${patient.age},${patient.gender},${patient.blood_group},${patient.contact},${patient.email},${patient.address},${doctorInfo}\n`;
      });
    } else if (reportType === "rooms") {
      csvContent = "ID,Number,Type,Status,Floor,Capacity,Current Patients,Price\n";
      reportData.forEach((room) => {
        csvContent += `${room.id},${room.number},${room.type},${room.status},${room.floor},${room.capacity},${room.current_patients || 0},${room.price}\n`;
      });
    }
    
    // Create a download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${reportType}_report_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getChartData = () => {
    if (!reportData.length) return [];
    
    if (reportType === "appointments") {
      // Group appointments by status
      const statusCounts: Record<string, number> = {};
      reportData.forEach((appointment) => {
        const status = appointment.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      return Object.entries(statusCounts).map(([status, count]) => ({
        id: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }));
    } else if (reportType === "billing") {
      // Group bills by status
      const statusCounts: Record<string, number> = {};
      const amountByStatus: Record<string, number> = {};
      
      reportData.forEach((bill) => {
        const status = bill.status;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        amountByStatus[status] = (amountByStatus[status] || 0) + Number(bill.amount);
      });
      
      // For billing, we need to transform the data for ResponsiveBar
      return Object.entries(statusCounts).map(([status, count]) => ({
        id: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: parseFloat(amountByStatus[status].toFixed(2)),
      }));
    } else if (reportType === "patients") {
      // Group patients by gender
      const genderCounts: Record<string, number> = {};
      reportData.forEach((patient) => {
        const gender = patient.gender;
        genderCounts[gender] = (genderCounts[gender] || 0) + 1;
      });
      
      return Object.entries(genderCounts).map(([gender, count]) => ({
        id: gender,
        label: gender.charAt(0).toUpperCase() + gender.slice(1),
        value: count,
      }));
    } else if (reportType === "rooms") {
      // Group rooms by status and type
      const statusCounts: Record<string, number> = {};
      const typeCounts: Record<string, number> = {};
      
      reportData.forEach((room) => {
        const status = room.status;
        const type = room.type;
        statusCounts[status] = (statusCounts[status] || 0) + 1;
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });
      
      // Return data for room status chart
      return Object.entries(statusCounts).map(([status, count]) => ({
        id: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }));
    }
    
    return [];
  };

  // Calculate room utilization data for the bar chart
  const getRoomUtilizationData = () => {
    if (!reportData.length || reportType !== "rooms") return [];
    
    const roomTypes: Record<string, { total: number; used: number }> = {};
    
    reportData.forEach((room) => {
      if (!roomTypes[room.type]) {
        roomTypes[room.type] = { total: 0, used: 0 };
      }
      
      roomTypes[room.type].total += room.capacity;
      roomTypes[room.type].used += room.current_patients || 0;
    });
    
    return Object.entries(roomTypes).map(([type, data]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      capacity: data.total,
      used: data.used,
      utilization: data.total > 0 ? Math.round((data.used / data.total) * 100) : 0,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Reports</h1>
        </div>
        <Button onClick={downloadReport} disabled={reportData.length === 0 || loading}>
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Report Settings</CardTitle>
          <CardDescription>
            Configure the type of report and date range
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointments">Appointments</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="patients">Patients</SelectItem>
                  <SelectItem value="rooms">Room Occupancy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Past Week</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <div className="flex gap-2 items-center">
                <DatePicker
                  selected={startDate}
                  onSelect={setStartDate}
                  placeholder="Start date"
                />
                <span className="text-muted-foreground">to</span>
                <DatePicker
                  selected={endDate}
                  onSelect={setEndDate}
                  placeholder="End date"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="table">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="chart">Chart View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
              </CardTitle>
              <CardDescription>
                {dateRange === "all"
                  ? "Showing all data"
                  : dateRange === "custom" && startDate && endDate
                  ? `From ${format(startDate, "MMM dd, yyyy")} to ${format(endDate, "MMM dd, yyyy")}`
                  : dateRange === "week"
                  ? "Data from the past week"
                  : dateRange === "month"
                  ? "Data from the past month"
                  : "Data from the past year"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-mediease-500" />
                </div>
              ) : reportData.length === 0 ? (
                <Alert>
                  <AlertTitle>No data found</AlertTitle>
                  <AlertDescription>
                    There is no data available for the selected report type and date range.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      {reportType === "appointments" && (
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Doctor</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      )}
                      {reportType === "billing" && (
                        <TableRow>
                          <TableHead>Patient</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Items</TableHead>
                        </TableRow>
                      )}
                      {reportType === "patients" && (
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Age</TableHead>
                          <TableHead>Gender</TableHead>
                          <TableHead>Blood Group</TableHead>
                          <TableHead>Assigned Doctor</TableHead>
                          <TableHead>Last Visit</TableHead>
                        </TableRow>
                      )}
                      {reportType === "rooms" && (
                        <TableRow>
                          <TableHead>Number</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Floor</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Current Patients</TableHead>
                          <TableHead>Price</TableHead>
                        </TableRow>
                      )}
                    </TableHeader>
                    <TableBody>
                      {reportType === "appointments" &&
                        reportData.map((appointment) => (
                          <TableRow key={appointment.id}>
                            <TableCell>{appointment.patient?.name || "Unknown"}</TableCell>
                            <TableCell>{appointment.doctor?.name || "Unknown"}</TableCell>
                            <TableCell>{appointment.date}</TableCell>
                            <TableCell>{appointment.time}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  appointment.status === "scheduled"
                                    ? "outline"
                                    : appointment.status === "completed"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {appointment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{appointment.reason || "—"}</TableCell>
                          </TableRow>
                        ))}
                      {reportType === "billing" &&
                        reportData.map((bill) => (
                          <TableRow key={bill.id}>
                            <TableCell>{bill.patient?.name || "Unknown"}</TableCell>
                            <TableCell>
                              {new Date(bill.date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>${bill.amount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  bill.status === "paid"
                                    ? "default"
                                    : bill.status === "pending"
                                    ? "outline"
                                    : "destructive"
                                }
                              >
                                {bill.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {bill.items ? bill.items.length : 0} items
                            </TableCell>
                          </TableRow>
                        ))}
                      {reportType === "patients" &&
                        reportData.map((patient) => (
                          <TableRow key={patient.id}>
                            <TableCell className="font-medium">
                              {patient.name}
                            </TableCell>
                            <TableCell>{patient.age}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {patient.gender.charAt(0).toUpperCase() +
                                  patient.gender.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{patient.blood_group}</TableCell>
                            <TableCell>
                              {patient.assigned_doctor
                                ? `${patient.assigned_doctor.name} (${patient.assigned_doctor.specialization})`
                                : "Not assigned"}
                            </TableCell>
                            <TableCell>
                              {patient.last_visit
                                ? new Date(patient.last_visit).toLocaleDateString()
                                : "Never"}
                            </TableCell>
                          </TableRow>
                        ))}
                      {reportType === "rooms" &&
                        reportData.map((room) => (
                          <TableRow key={room.id}>
                            <TableCell>{room.number}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {room.type.charAt(0).toUpperCase() +
                                  room.type.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  room.status === "available"
                                    ? "default"
                                    : room.status === "occupied"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {room.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{room.floor}</TableCell>
                            <TableCell>{room.capacity}</TableCell>
                            <TableCell>{room.current_patients || 0}</TableCell>
                            <TableCell>${room.price}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between border-t p-4">
              <div className="text-sm text-muted-foreground">
                Showing {reportData.length} records
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="chart">
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Distribution
              </CardTitle>
              <CardDescription>
                Visual representation of the report data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-mediease-500" />
                </div>
              ) : reportData.length === 0 ? (
                <Alert>
                  <AlertTitle>No data to visualize</AlertTitle>
                  <AlertDescription>
                    There is no data available for the selected report type and date range.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-md border p-4">
                    <h3 className="mb-4 text-lg font-medium">
                      {reportType === "appointments"
                        ? "Appointments by Status"
                        : reportType === "billing"
                        ? "Bills by Status"
                        : reportType === "patients"
                        ? "Patients by Gender"
                        : "Rooms by Status"}
                    </h3>
                    <div className="h-80">
                      <ResponsivePie
                        data={getChartData()}
                        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        borderWidth={1}
                        borderColor={{ from: "color", modifiers: [["darker", 0.2]] }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: "color" }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{ from: "color", modifiers: [["darker", 2]] }}
                        legends={[
                          {
                            anchor: "bottom",
                            direction: "row",
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 0,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: "#999",
                            itemDirection: "left-to-right",
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: "circle",
                          },
                        ]}
                      />
                    </div>
                  </div>
                  
                  {reportType === "billing" && (
                    <div className="rounded-md border p-4">
                      <h3 className="mb-4 text-lg font-medium">
                        Revenue by Status
                      </h3>
                      <div className="h-80">
                        <ResponsiveBar
                          data={getChartData()}
                          keys={["value"]}
                          indexBy="id"
                          margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
                          padding={0.3}
                          valueScale={{ type: "linear" }}
                          indexScale={{ type: "band", round: true }}
                          colors={{ scheme: "nivo" }}
                          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                          axisTop={null}
                          axisRight={null}
                          axisBottom={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: "Status",
                            legendPosition: "middle",
                            legendOffset: 32,
                          }}
                          axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: "Amount ($)",
                            legendPosition: "middle",
                            legendOffset: -40,
                          }}
                          labelSkipWidth={12}
                          labelSkipHeight={12}
                          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                          animate={true}
                        />
                      </div>
                    </div>
                  )}
                  
                  {reportType === "rooms" && (
                    <div className="rounded-md border p-4">
                      <h3 className="mb-4 text-lg font-medium">
                        Room Utilization
                      </h3>
                      <div className="h-80">
                        <ResponsiveBar
                          data={getRoomUtilizationData()}
                          keys={["used", "capacity"]}
                          indexBy="type"
                          margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
                          padding={0.3}
                          groupMode="grouped"
                          valueScale={{ type: "linear" }}
                          indexScale={{ type: "band", round: true }}
                          colors={{ scheme: "paired" }}
                          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                          axisTop={null}
                          axisRight={null}
                          axisBottom={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: "Room Type",
                            legendPosition: "middle",
                            legendOffset: 32,
                          }}
                          axisLeft={{
                            tickSize: 5,
                            tickPadding: 5,
                            tickRotation: 0,
                            legend: "Count",
                            legendPosition: "middle",
                            legendOffset: -40,
                          }}
                          labelSkipWidth={12}
                          labelSkipHeight={12}
                          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
                          legends={[
                            {
                              dataFrom: "keys",
                              anchor: "bottom-right",
                              direction: "column",
                              justify: false,
                              translateX: 120,
                              translateY: 0,
                              itemsSpacing: 2,
                              itemWidth: 100,
                              itemHeight: 20,
                              itemDirection: "left-to-right",
                              itemOpacity: 0.85,
                              symbolSize: 20,
                              effects: [
                                {
                                  on: "hover",
                                  style: {
                                    itemOpacity: 1,
                                  },
                                },
                              ],
                            },
                          ]}
                          animate={true}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <QueryCard query={lastQuery} />
    </div>
  );
};

export default Reports;
