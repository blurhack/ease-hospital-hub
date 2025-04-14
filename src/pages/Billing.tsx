
import { useState } from "react";
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

const Billing = () => {
  const { bills, patients, executeSqlQuery } = useData();
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

  const handleAddBill = () => {
    // This would normally add the bill to the database
    toast({
      title: "Bill created",
      description: `Bill has been created successfully.`,
    });
    
    // Reset form
    setNewBill({
      patientId: "",
      date: new Date().toISOString().split("T")[0],
      status: "pending",
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0 }]
    });
  };

  const handleBillSelect = (billId: string) => {
    setSelectedBill(billId);
    
    // Execute and show query
    const query = `SELECT b.*, p.name as patient_name 
                  FROM bills b 
                  JOIN patients p ON b.patientId = p.id 
                  WHERE b.id = '${billId}'`;
    setQueryResult(query);
  };

  const handleUpdateBillStatus = (billId: string, status: "paid" | "pending" | "overdue") => {
    // This would normally update the bill in the database
    toast({
      title: "Bill status updated",
      description: `Bill status has been updated to ${status}.`,
    });
    
    // Execute and show query
    const query = `UPDATE bills 
                  SET status = '${status}' 
                  WHERE id = '${billId}'`;
    setQueryResult(query);
  };

  const filteredBills = bills.filter(bill => {
    const patient = patients.find(p => p.id === bill.patientId);
    
    return (
      (patient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bill.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.date.includes(searchTerm))
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
    
    // In a real app, this would generate a PDF
    // For now, we'll just show a toast
    toast({
      title: "PDF Generated",
      description: `Bill #${billId} has been prepared for download.`,
    });
  };

  const printBill = (billId: string) => {
    // In a real app, this would open the print dialog
    // For now, we'll just show a toast
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
                        <TableCell>{getPatientName(bill.patientId)}</TableCell>
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
                  
                  const patient = patients.find(p => p.id === bill.patientId);
                  
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
                          <p className="font-medium">{patient?.name}</p>
                          <p className="text-sm text-muted-foreground">Patient</p>
                        </div>
                      </div>
                      
                      <div className="pb-2 border-b">
                        <p className="text-sm text-muted-foreground mb-1">Items</p>
                        <div className="space-y-2">
                          {bill.items.map((item, index) => (
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
