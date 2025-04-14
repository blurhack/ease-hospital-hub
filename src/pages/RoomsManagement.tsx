
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
import { toast } from "@/components/ui/use-toast";
import { BedDouble, Search, Plus, ArrowRight, Database } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RoomsManagement = () => {
  const { rooms, updateRoomStatus, addRoom, executeSqlQuery } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<string>("");
  
  // New room form state
  const [newRoom, setNewRoom] = useState({
    number: "",
    type: "general" as "general" | "private" | "icu" | "operation" | "emergency",
    status: "available" as "available" | "occupied" | "maintenance",
    floor: 1,
    capacity: 1,
    currentPatients: 0,
    price: 200,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewRoom({
      ...newRoom,
      [name]: name === "floor" || name === "capacity" || name === "price" ? Number(value) : value,
    });
  };

  const handleAddRoom = () => {
    addRoom(newRoom);
    setNewRoom({
      number: "",
      type: "general",
      status: "available",
      floor: 1,
      capacity: 1,
      currentPatients: 0,
      price: 200,
    });
    toast({
      title: "Room added",
      description: `Room ${newRoom.number} has been added successfully.`,
    });
  };

  const handleUpdateStatus = (roomId: string, status: "available" | "occupied" | "maintenance") => {
    updateRoomStatus(roomId, status);
    
    // Execute and show query
    const query = `UPDATE rooms SET status = '${status}' WHERE id = '${roomId}'`;
    setQueryResult(query);
    
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      toast({
        title: "Room status updated",
        description: `Room ${room.number} status has been updated to ${status}.`,
      });
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setSelectedRoom(roomId);
    
    // Execute and show query
    const query = `SELECT * FROM rooms WHERE id = '${roomId}'`;
    setQueryResult(query);
  };

  const filteredRooms = rooms.filter(room => 
    room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-red-100 text-red-800";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "icu":
        return "text-red-500";
      case "operation":
        return "text-blue-500";
      case "emergency":
        return "text-orange-500";
      case "private":
        return "text-purple-500";
      default:
        return "text-green-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BedDouble className="h-6 w-6 text-mediease-600" />
          <h1 className="text-2xl font-bold">Rooms Management</h1>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new room to the system.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Room Number</Label>
                  <Input 
                    id="number" 
                    name="number" 
                    value={newRoom.number}
                    onChange={handleInputChange}
                    placeholder="e.g., 101"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="floor">Floor</Label>
                  <Input 
                    id="floor" 
                    name="floor" 
                    type="number"
                    value={newRoom.floor}
                    onChange={handleInputChange}
                    min={1}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Room Type</Label>
                  <Select 
                    name="type"
                    value={newRoom.type}
                    onValueChange={(value) => setNewRoom({...newRoom, type: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="icu">ICU</SelectItem>
                      <SelectItem value="operation">Operation</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    name="status"
                    value={newRoom.status}
                    onValueChange={(value) => setNewRoom({...newRoom, status: value as any})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input 
                    id="capacity" 
                    name="capacity" 
                    type="number"
                    value={newRoom.capacity}
                    onChange={handleInputChange}
                    min={1}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Price per Day ($)</Label>
                  <Input 
                    id="price" 
                    name="price" 
                    type="number"
                    value={newRoom.price}
                    onChange={handleInputChange}
                    min={0}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={handleAddRoom}>Add Room</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Rooms List</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search rooms..."
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
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price/Day</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRooms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        No rooms found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRooms.map((room) => (
                      <TableRow
                        key={room.id}
                        className={selectedRoom === room.id ? "bg-muted/50" : ""}
                      >
                        <TableCell 
                          className="font-medium cursor-pointer hover:text-mediease-600 transition-colors"
                          onClick={() => handleRoomSelect(room.id)}
                        >
                          {room.number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BedDouble className={`h-4 w-4 ${getTypeIcon(room.type)}`} />
                            <span className="capitalize">{room.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{room.floor}</TableCell>
                        <TableCell>
                          {room.currentPatients}/{room.capacity}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(room.status)}>
                            {room.status}
                          </Badge>
                        </TableCell>
                        <TableCell>${room.price}</TableCell>
                        <TableCell>
                          <Select
                            value={room.status}
                            onValueChange={(value) => handleUpdateStatus(room.id, value as any)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          {selectedRoom && (
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
          
          {selectedRoom && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle>Room Details</CardTitle>
              </CardHeader>
              <CardContent className="pb-2">
                {(() => {
                  const room = rooms.find(r => r.id === selectedRoom);
                  if (!room) return null;
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room Number:</span>
                        <span className="font-medium">{room.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">{room.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Floor:</span>
                        <span className="font-medium">{room.floor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity:</span>
                        <span className="font-medium">{room.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Patients:</span>
                        <span className="font-medium">{room.currentPatients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price per Day:</span>
                        <span className="font-medium">${room.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant="outline" className={getStatusColor(room.status)}>
                          {room.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
              <CardFooter className="flex justify-end pt-4">
                <Button variant="outline" size="sm">
                  Assign Patient
                  <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomsManagement;
