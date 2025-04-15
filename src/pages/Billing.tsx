
import { useState, useEffect } from "react";
import { useData } from "@/contexts/DataContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
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
import { 
  CreditCard, 
  Search, 
  Plus, 
  Database, 
  User, 
  Calendar, 
  Download, 
  Printer,
  FileText,
  DollarSign 
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Billing = () => {
  const { bills: contextBills, patients: contextPatients, executeSqlQuery } = useData();
  const [bills, setBills] = useState(contextBills);
  const [patients, setPatients] = useState(contextPatients);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<string>("");
  
  // New bill form state
  const [newBill, setNewBill] = useState({
    patientId: "",
    date: new Date().toISOString().split("T")[0],
    status: "pending" as "paid" | "pending" | "overdue",
    items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]
  });

  // Fetch patients from Supabase
  const { data: supabasePatients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('*');
      if (error) {
        toast({
          title: "Error fetching patients",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      setPatients(data || []);
      return data || [];
    }
  });

  // Fetch bills from Supabase
  const { data: supabillsBills, refetch: refetchBills } = useQuery({
    queryKey: ['bills'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bills').select('*');
      if (error) {
        toast({
          title: "Error fetching bills",
          description: error.message,
          variant: "destructive",
        });
        return [];
      }
      setBills(data || []);
      return data || [];
    }
  });

  // Set up real-time subscription for bills
  useEffect(() => {
    const billsSubscription = supabase
      .channel('public:bills')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'bills' },
        (payload) => {
          console.log('Bills change received:', payload);
          refetchBills();
          toast({
            title: "Billing data updated",
            description: "The billing information has been updated.",
          });
        })
      .subscribe();

    return () => {
      supabase.removeChannel(billsSubscription);
    };
  }, [refetchBills]);

  const handlePatientChange = (value: string) => {
    setNewBill({
      ...newBill,
      patientId: value
    });
  };

  const handleStatusChange = (value: string) => {
    setNewBill({
      ...newBill,
      status: value as "paid" | "pending" | "overdue"
    });
  };

  const handleBillItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...newBill.items];
    
    if (field === "quantity" || field === "unitPrice") {
      const numValue = parseFloat(value);
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: numValue,
        total: field === "quantity" 
          ? numValue * updatedItems[index].unitPrice 
          : updatedItems[index].quantity * numValue
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value
      };
    }
    
    setNewBill({
      ...newBill,
      items: updatedItems
    });
  };

  const addBillItem = () => {
    setNewBill({
      ...newBill,
      items: [
        ...newBill.items,
        { description: "", quantity: 1, unitPrice: 0, total: 0 }
      ]
    });
  };

  const removeBillItem = (index: number) => {
    const updatedItems = [...newBill.items];
    updatedItems.splice(index, 1);
    setNewBill({
      ...newBill,
      items: updatedItems
    });
  };

  const calculateTotal = () => {
    return newBill.items.reduce((sum, item) => sum + item.total, 0);
  };

  const handleAddBill = async () => {
    if (!newBill.patientId) {
      toast({
        title: "Missing information",
        description: "Please select a patient.",
        variant: "destructive",
      });
      return;
    }

    if (newBill.items.some(item => !item.description || item.total <= 0)) {
      toast({
        title: "Missing information",
        description: "Please fill in all bill items with valid amounts.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = calculateTotal();
    
    try {
      // Insert the bill into Supabase
      const { data, error } = await supabase.from('bills').insert({
        patient_id: newBill.patientId,
        date: newBill.date,
        amount: totalAmount,
        status: newBill.status,
        items: newBill.items
      }).select();

      if (error) throw error;
      
      toast({
        title: "Bill created",
        description: `Bill has been created successfully.`,
      });

      // Execute and log the SQL query
      const query = `INSERT INTO bills (patient_id, date, amount, status, items) 
                     VALUES ('${newBill.patientId}', '${newBill.date}', ${totalAmount}, 
                     '${newBill.status}', '${JSON.stringify(newBill.items)}')`;
      
      await supabase.from('analytics_logs').insert({
        action_type: 'INSERT',
        table_name: 'bills',
        query: query,
        performed_by: 'current_user'
      });
      
      // Reset form
      setNewBill({
        patientId: "",
        date: new Date().toISOString().split("T")[0],
        status: "pending",
        items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]
      });
    } catch (error: any) {
      toast({
        title: "Error creating bill",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBillSelect = async (billId: string) => {
    setSelectedBill(billId);
    
    // Execute and show query
    const query = `SELECT b.*, p.name as patient_name 
                  FROM bills b 
                  JOIN patients p ON b.patient_id = p.id 
                  WHERE b.id = '${billId}'`;
    setQueryResult(query);
    
    try {
      await supabase.from('analytics_logs').insert({
        action_type: 'SELECT',
        table_name: 'bills',
        query: query,
        performed_by: 'current_user',
        record_id: billId
      });
    } catch (error) {
      console.error("Error logging selection:", error);
    }
  };

  const handleUpdateBillStatus = async (billId: string, status: "paid" | "pending" | "overdue") => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ status })
        .eq('id', billId);
      
      if (error) throw error;
      
      toast({
        title: "Bill status updated",
        description: `Bill status has been updated to ${status}.`,
      });
      
      // Execute and show query
      const query = `UPDATE bills 
                    SET status = '${status}' 
                    WHERE id = '${billId}'`;
      setQueryResult(query);
      
      await supabase.from('analytics_logs').insert({
        action_type: 'UPDATE',
        table_name: 'bills',
        query: query,
        performed_by: 'current_user',
        record_id: billId
      });
    } catch (error: any) {
      toast({
        title: "Error updating bill",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredBills = bills.filter(bill => {
    const patient = patients.find(p => p.id === bill.patient_id || p.id === bill.patientId);
    
    return (
      (patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bill.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.date && bill.date.toString().includes(searchTerm)))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const getPatientName = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.name : "Unknown Patient";
  };

  const generatePDF = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    
    // Get patient name
    const patientName = getPatientName(bill.patient_id || bill.patientId);
    
    // Create a PDF blob
    const downloadBill = {
      billId,
      patientName,
      date: bill.date,
      amount: bill.amount,
      status: bill.status,
      items: bill.items || []
    };
    
    // Create blob and trigger download
    const billData = JSON.stringify(downloadBill, null, 2);
    const blob = new Blob([billData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `bill-${billId}-${patientName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Bill Downloaded",
      description: `Bill #${billId} has been downloaded.`,
    });
  };

  const printBill = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    
    // In a real app, this would format data for printing
    // For now, we'll open a new window with bill info
    const patientName = getPatientName(bill.patient_id || bill.patientId);
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill #${billId}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
              .total { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>Medical Bill</h1>
            <p><strong>Bill #:</strong> ${billId}</p>
            <p><strong>Patient:</strong> ${patientName}</p>
            <p><strong>Date:</strong> ${bill.date}</p>
            <p><strong>Status:</strong> ${bill.status}</p>
            
            <table>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
              ${(bill.items || []).map(item => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>$${item.unitPrice.toFixed(2)}</td>
                  <td>$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td colspan="3">Total Amount</td>
                <td>$${bill.amount.toFixed(2)}</td>
              </tr>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
    
    toast({
      title: "Print Prepared",
      description: `Bill #${billId} has been sent to printer.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Billing</h1>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Bill</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new bill.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId">Patient</Label>
                  <Select 
                    value={newBill.patientId}
                    onValueChange={handlePatientChange}
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
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date" 
                    type="date"
                    value={newBill.date}
                    onChange={(e) => setNewBill({...newBill, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Bill Items</Label>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">Quantity</TableHead>
                        <TableHead className="w-36">Unit Price ($)</TableHead>
                        <TableHead className="w-36">Total ($)</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newBill.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={item.description}
                              onChange={(e) => handleBillItemChange(index, "description", e.target.value)}
                              placeholder="Item description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleBillItemChange(index, "quantity", e.target.value)}
                              min={1}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleBillItemChange(index, "unitPrice", e.target.value)}
                              min={0}
                              step={0.01}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.total}
                              readOnly
                            />
                          </TableCell>
                          <TableCell>
                            {newBill.items.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeBillItem(index)}
                              >
                                ×
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBillItem}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Total:</span>
                    <span className="text-lg font-bold">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newBill.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleAddBill}>Create Bill</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Bills</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search bills..."
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
                    <TableHead>Bill #</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                        No bills found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBills.map((bill) => (
                      <TableRow 
                        key={bill.id}
                        className={selectedBill === bill.id ? "bg-muted/50" : ""}
                      >
                        <TableCell 
                          className="font-medium cursor-pointer hover:text-mediease-600 transition-colors"
                          onClick={() => handleBillSelect(bill.id)}
                        >
                          {bill.id}
                        </TableCell>
                        <TableCell>{getPatientName(bill.patient_id || bill.patientId)}</TableCell>
                        <TableCell>{bill.date}</TableCell>
                        <TableCell>${bill.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(bill.status)}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => generatePDF(bill.id)}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => printBill(bill.id)}
                            >
                              <Printer className="h-3 w-3" />
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
        </div>
        
        <div className="lg:col-span-1">
          {selectedBill && (
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
          
          {selectedBill && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle>Bill Details</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const bill = bills.find(b => b.id === selectedBill);
                  if (!bill) return null;
                  
                  const patientName = getPatientName(bill.patient_id || bill.patientId);
                  
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <FileText className="h-6 w-6 text-mediease-600" />
                        <div>
                          <p className="font-medium">Bill #{bill.id}</p>
                          <p className="text-sm text-muted-foreground">{bill.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 pb-2 border-b">
                        <User className="h-6 w-6 text-blue-600" />
                        <div>
                          <p className="font-medium">{patientName}</p>
                          <p className="text-sm text-muted-foreground">Patient</p>
                        </div>
                      </div>
                      
                      <div className="pb-2 border-b">
                        <p className="text-sm text-muted-foreground mb-1">Items</p>
                        <div className="space-y-2">
                          {(bill.items || []).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.description} (x{item.quantity})</span>
                              <span>${item.total.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b">
                        <span className="font-medium">Total Amount</span>
                        <span className="text-lg font-bold">${bill.amount.toFixed(2)}</span>
                      </div>
                      
                      <div className="pb-2">
                        <p className="text-sm text-muted-foreground mb-1">Status</p>
                        <Select 
                          value={bill.status}
                          onValueChange={(value) => handleUpdateBillStatus(bill.id, value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => generatePDF(bill.id)}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => printBill(bill.id)}
                        >
                          <Printer className="h-3 w-3 mr-1" />
                          Print
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
          
          {selectedBill && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full"
                  onClick={() => {
                    handleUpdateBillStatus(selectedBill, "paid");
                    toast({
                      title: "Payment processed",
                      description: "The bill has been marked as paid.",
                    });
                  }}
                >
                  Process Payment
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;
